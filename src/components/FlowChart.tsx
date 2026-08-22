import { useEffect, useId, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useTheme } from './ThemeProvider';

const darkThemeVariables = {
  primaryColor: '#252a3f',
  primaryTextColor: '#e4e6f0',
  primaryBorderColor: '#5b9cf6',
  lineColor: '#5b9cf6',
  secondaryColor: '#1a1d2e',
  tertiaryColor: '#161822',
  background: '#0f1117',
  mainBkg: '#252a3f',
  nodeBorder: '#5b9cf6',
  clusterBkg: '#1a1d2e',
  clusterBorder: '#2a2e42',
  titleColor: '#e4e6f0',
  edgeLabelBackground: '#1a1d2e',
  nodeTextColor: '#e4e6f0',
};

const lightThemeVariables = {
  primaryColor: '#eef0f5',
  primaryTextColor: '#14161f',
  primaryBorderColor: '#2563eb',
  lineColor: '#2563eb',
  secondaryColor: '#ffffff',
  tertiaryColor: '#f6f7fa',
  background: '#f6f7fa',
  mainBkg: '#eef0f5',
  nodeBorder: '#2563eb',
  clusterBkg: '#ffffff',
  clusterBorder: '#dde2ec',
  titleColor: '#14161f',
  edgeLabelBackground: '#ffffff',
  nodeTextColor: '#14161f',
};

// Many chart strings across the site hardcode per-node overrides, e.g.
// `style A fill:#1a2744,stroke:#5b9cf6` — mermaid renders these as literal
// SVG attributes, so theme.themeVariables alone can't touch them. Swap any
// known dark-mode hex for its light-mode equivalent before rendering; the
// map mirrors the CSS token values in global.css. Unmapped/rare hex values
// are left as-is.
const lightSwap: Record<string, string> = {
  '#1a2744': '#e8f0fe', '#1a3329': '#e6f7ec', '#3d2f14': '#fef3e2',
  '#2a1f44': '#f2ecfe', '#3b1a1a': '#fdeaea',
  '#0f1117': '#f6f7fa', '#161822': '#eef0f5', '#12141e': '#f1f2f6',
  '#1a1d2e': '#ffffff', '#1e2235': '#eef0f5', '#1f2337': '#e7e9f0',
  '#252a3f': '#dde1ea',
  '#e4e6f0': '#14161f', '#9399b2': '#52586b', '#6c7293': '#6b7183',
  '#2a2e42': '#dde2ec',
  '#5b9cf6': '#2563eb', '#4ade80': '#15803d', '#a78bfa': '#7c3aed',
  '#fb923c': '#c2410c', '#f87171': '#dc2626', '#22d3ee': '#0e7490',
  '#facc15': '#a16207', '#f472b6': '#be185d',
  '#10b981': '#059669', '#fbbf24': '#92400e', '#f59e0b': '#92400e',
  '#d97706': '#78350f', '#6366f1': '#4338ca', '#8b5cf6': '#6d28d9',
  '#3b82f6': '#1d4ed8', '#ef4444': '#b91c1c', '#dc2626': '#991b1b',
};

function applyLightSwap(chart: string): string {
  return chart.replace(/#[0-9a-fA-F]{6}/g, (hex) => lightSwap[hex.toLowerCase()] ?? hex);
}

interface FlowChartProps {
  chart: string;
  title?: string;
}

export default function FlowChart({ chart, title }: FlowChartProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState('');
  // Was `useRef(\`mermaid-${chartId++}\`)`, which bumped the module counter on
  // every single render (the argument is evaluated each time even though only
  // the first value is kept). useId gives a stable per-instance id; mermaid
  // uses it as a DOM id and CSS selector, so strip anything not selector-safe.
  const reactId = useId();
  const chartDomId = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  useEffect(() => {
    let cancelled = false;
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: theme === 'light' ? lightThemeVariables : darkThemeVariables,
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        padding: 15,
      },
      fontFamily: "'Inter', sans-serif",
    });
    const render = async () => {
      try {
        // Mermaid measures every label with the configured fontFamily to size
        // its nodes. If Inter has not loaded yet it measures against the
        // fallback, comes up short, and clips the last character off each
        // label ("src/" renders as "src,"). Waiting for fonts first makes a
        // cold load produce the same geometry as a warm one — which also
        // matters for the PDF export, where every page is a cold load.
        if (typeof document !== 'undefined' && document.fonts?.ready) {
          await document.fonts.ready;
        }
        if (cancelled) return;
        const source = theme === 'light' ? applyLightSwap(chart.trim()) : chart.trim();
        const { svg: rendered } = await mermaid.render(chartDomId, source);
        if (!cancelled) setSvg(rendered);
      } catch (e) {
        console.error('Mermaid render error:', e);
      }
    };
    void render();
    return () => { cancelled = true; };
  }, [chart, theme, chartDomId]);

  return (
    <div className="flow-chart" style={{
      margin: '1.5rem 0',
      background: 'var(--bg-secondary)',
      borderRadius: '8px',
      border: '1px solid var(--border-color)',
      overflow: 'hidden',
    }}>
      {title && (
        <div style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--border-color)',
          fontSize: '0.85rem',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span style={{ fontSize: '1rem' }}>📊</span> {title}
        </div>
      )}
      <div
        ref={containerRef}
        style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', overflow: 'auto' }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
