import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function Cheatsheet() {
  return (
    <LessonLayout
      title="📋 Git & Version Control Cheat Sheet"
      sectionId="version-control"
      lessonIndex={3}
      prev={{ path: '/version-control/collaboration', label: 'Collaborative Workflows' }}
      next={null}
    >
      <p>
        A single-page reconciliation of every mechanism and attribution from this section. Every
        hash, command, and history claim below was run for real in a throwaway repo somewhere in
        the three lessons that precede this one — nothing here is invented example output.
      </p>

      <h2>The Object Model</h2>

      <CodeBlock language="text" title="Content-addressable storage — verified with real hashes">
{`Four object types: blob (file content) · tree (directory listing)
                  · commit (snapshot + parent pointer(s)) · tag

A git object's hash is derived from its CONTENT, not its filename.
Verified: src/config/app.conf and lib/settings/app.conf, identical text,
different paths — BOTH hashed to 95c8bb63928321e7d1793928ceae6211d58a2bd3.
git ls-tree -r HEAD confirmed both tree entries reference the same single
blob. Change one byte -> different hash. No duplicate content is ever
stored twice, regardless of filename.

A branch is a FILE. .git/refs/heads/main literally contains a commit hash
— moving a branch is just rewriting that file's contents.

HEAD is a ref to the current branch: .git/HEAD normally contains
"ref: refs/heads/main", NOT a hash directly. Checking out a specific
commit hash instead puts the raw hash in HEAD -- "detached HEAD",
verified: git status reported "HEAD detached at 1470db8" after
checking out a commit hash directly.`}
      </CodeBlock>

      <h2>Merge vs Rebase — the Real Side-by-Side Result</h2>

      <CodeBlock language="text" title="Same divergent history, two different outcomes — real git log output">
{`git merge feature   -> a real merge commit, TWO parents:
  4da9d89 (HEAD -> main) Merge branch 'feature'
  |\\
  | * 9af3715 (feature) Feature: add validation
  * | 34271ca ...
  |/

git rebase main (on feature, instead)  -> LINEAR, no merge commit:
  a89865e -> 8cc7b73 -> 34271ca -> 5a93f17

Rebase REWRITES hashes: feature's tip went from 9af37158... to
a89865e86a1e... after rebase, even though the actual file diff
(login.txt) kept the IDENTICAL blob hash both times — same change,
different commit SHA. This is exactly why rebasing already-pushed
commits breaks other people's clones: their branch now diverges from
the rewritten history. Reproduced directly with two real clones —
after a force-push following a rebase, the second clone's "git pull"
failed with: fatal: Need to specify how to reconcile divergent branches.`}
      </CodeBlock>

      <InfoBox variant="danger" title="The Rule, and Why It's Not Just a Convention">
        <p>
          Never rebase commits that have already been pushed and might be pulled by someone else
          — not a style preference, a direct consequence of rebase creating new hashes for what
          looks like "the same" commits. Reproduced above: it causes a real pull failure, not a
          hypothetical one.
        </p>
      </InfoBox>

      <h2>Conflict Markers — Real Output</h2>

      <CodeBlock language="text" title="From an actual forced git merge conflict">
{`<<<<<<< HEAD
timeout = 10
=======
timeout = 60
>>>>>>> increase-timeout`}
      </CodeBlock>

      <h2>Workflow Models</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Model</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Fits</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Trunk-based</strong></td>
            <td style={{ padding: '0.75rem' }}>Continuous deployment, small frequent merges to main, often behind feature flags</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>GitFlow</strong></td>
            <td style={{ padding: '0.75rem' }}>Scheduled/versioned releases with multiple supported lines — Vincent Driessen, Jan 5 2010; his own later note steers continuous-deployment teams toward simpler models</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="text" title="Conventional Commits — what the spec actually mandates">
{`<type>[optional scope]: <description>

Spec (conventionalcommits.org v1.0.0) MANDATES only two types:
  fix   feat
Everything else — chore, docs, refactor, style, test — comes from the
Angular convention that tooling happens to also support, not the spec
itself. Payoff: automated changelog generation + semantic version
bumping straight from commit history.

Merge queues (GitHub: GA July 2023; GitLab: "merge trains") re-test
each queued PR against the ACTUAL combination of everything ahead of
it in the queue — not just against main at approval time — preventing
a "semantic merge conflict" where two individually-green PRs break
main together.`}
      </CodeBlock>

      <InfoBox variant="info" title="Section Index">
        <p>
          1. Git Internals: Objects, Refs &amp; the DAG &nbsp;·&nbsp; 2. Branching &amp; Rebase
          Strategies &nbsp;·&nbsp; 3. Collaborative Workflows &nbsp;·&nbsp; 4. This page
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
