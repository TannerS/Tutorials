/**
 * TypeScript Validator Worker
 *
 * Receives user code + hidden tests, compiles it via the TypeScript compiler
 * inside a Web Worker, and returns diagnostics. Lib files are fetched from
 * the CDN on first use, then cached in this worker's scope for subsequent
 * validations during the same session.
 */

import * as ts from 'typescript';
import {
  createSystem,
  createVirtualTypeScriptEnvironment,
  createDefaultMapFromCDN,
} from '@typescript/vfs';

// ─── Message protocol ──────────────────────────────────────────────────────

export interface ValidateRequest {
  type: 'validate';
  challengeId: string;
  /** Combined: helpers + user code + hidden tests. */
  fullCode: string;
}

export interface DiagnosticDisplay {
  message: string;
  line: number;
  column: number;
  category: 'error' | 'warning' | 'suggestion' | 'message';
}

export interface ValidateResult {
  type: 'result';
  challengeId: string;
  passed: boolean;
  diagnostics: DiagnosticDisplay[];
  durationMs: number;
}

export interface ValidatorReady {
  type: 'ready';
}

export interface ValidatorError {
  type: 'error';
  message: string;
}

type AnyResult = ValidateResult | ValidatorReady | ValidatorError;

// ─── Compiler options ──────────────────────────────────────────────────────

const COMPILER_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  noEmit: true,
  esModuleInterop: true,
  isolatedModules: false,
  skipLibCheck: true,
};

// ─── Cached lib-file map (first validation pays the CDN fetch cost) ─────────

let libMapPromise: Promise<Map<string, string>> | null = null;

function getLibMap(): Promise<Map<string, string>> {
  if (!libMapPromise) {
    libMapPromise = createDefaultMapFromCDN(
      COMPILER_OPTIONS,
      ts.version,
      true, // cache lib files in localStorage of the worker
      ts,
    );
  }
  return libMapPromise;
}

// ─── Main message handler ──────────────────────────────────────────────────

self.addEventListener('message', async (event: MessageEvent<ValidateRequest>) => {
  const req = event.data;
  if (!req || req.type !== 'validate') return;

  const start = performance.now();

  try {
    const libMap = await getLibMap();
    // Clone so each validation has a fresh VFS (lib files reused).
    const fsMap = new Map(libMap);
    fsMap.set('index.ts', req.fullCode);

    const system = createSystem(fsMap);
    const env = createVirtualTypeScriptEnvironment(
      system,
      ['index.ts'],
      ts,
      COMPILER_OPTIONS,
    );

    const syntactic = env.languageService.getSyntacticDiagnostics('index.ts');
    const semantic = env.languageService.getSemanticDiagnostics('index.ts');
    const all = [...syntactic, ...semantic];

    const diagnostics: DiagnosticDisplay[] = all.map((d) => {
      const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
      let line = 0;
      let column = 0;
      if (d.file && typeof d.start === 'number') {
        const pos = d.file.getLineAndCharacterOfPosition(d.start);
        line = pos.line + 1;
        column = pos.character + 1;
      }
      const category: DiagnosticDisplay['category'] =
        d.category === ts.DiagnosticCategory.Error
          ? 'error'
          : d.category === ts.DiagnosticCategory.Warning
            ? 'warning'
            : d.category === ts.DiagnosticCategory.Suggestion
              ? 'suggestion'
              : 'message';
      return { message, line, column, category };
    });

    const errorCount = diagnostics.filter((d) => d.category === 'error').length;

    const result: ValidateResult = {
      type: 'result',
      challengeId: req.challengeId,
      passed: errorCount === 0,
      diagnostics,
      durationMs: Math.round(performance.now() - start),
    };
    (self as unknown as Worker).postMessage(result satisfies AnyResult);
  } catch (err) {
    const result: ValidateResult = {
      type: 'result',
      challengeId: req.challengeId,
      passed: false,
      diagnostics: [
        {
          message: `Validator internal error: ${(err as Error).message}`,
          line: 0,
          column: 0,
          category: 'error',
        },
      ],
      durationMs: Math.round(performance.now() - start),
    };
    (self as unknown as Worker).postMessage(result satisfies AnyResult);
  }
});

// Signal readiness immediately on script load.
(self as unknown as Worker).postMessage({ type: 'ready' } satisfies AnyResult);
