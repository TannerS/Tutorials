import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function Cheatsheet() {
  return (
    <GuideLayout
      title="GIT"
      kicker="FIELD GUIDE"
      glyph="🌿"
      tagline="Objects, refs, branching strategy, and the team process wrapped around them — every hash and command below was run for real in a throwaway repo."
      meta={['Git 2.50.1', 'verified in real repos', '14 panels']}
      page="1 / 1"
      footer="The reasoning and the worked walkthroughs live in the three lessons before this one; this page is the recall sheet — nothing here is invented example output."
      prev={{ path: '/version-control/collaboration', label: 'Collaborative Workflows' }}
      next={null}
    >
      <GuidePanel n={1} title="The Object Model" accent="blue" glyph="📦" span={2}>
        <GuideCode>{`$ git cat-file -p HEAD
tree 46b5a9787de4738b5eee8b310fd955b1a5a73e14
author Demo User <demo@example.com> 1786840959 -0500
committer Demo User <demo@example.com> 1786840959 -0500

Add greeting.txt

$ git cat-file -p 46b5a9787de4738b5eee8b310fd955b1a5a73e14
100644 blob b00f56f95b66e87d8d2f3baff7ee67f101c7bfc6	greeting.txt

$ git cat-file -p b00f56f95b66e87d8d2f3baff7ee67f101c7bfc6
hello git internals`}</GuideCode>
        <GuideDefs
          items={[
            ['blob', 'raw file content only — no filename, no permissions, no path'],
            ['tree', 'a directory listing: mode + type + hash + name, one line per entry'],
            ['commit', 'one tree hash + parent(s) + author/committer + message'],
            ['tag (annotated)', 'its own object: pointer to a commit + message + tagger'],
          ]}
        />
        <GuideRules
          items={[
            "One file's full chain is commit -> tree -> blob. A lightweight tag skips the tag object entirely — its ref just holds the commit hash directly.",
            'git log is computed by walking commit objects backward through their parent pointers — there is no separate history data structure hiding in .git.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={2} title="Content-Addressable Storage" accent="purple" glyph="🔑">
        <GuideCode>{`$ git hash-object src/config/app.conf
95c8bb63928321e7d1793928ceae6211d58a2bd3
$ git hash-object lib/settings/app.conf
95c8bb63928321e7d1793928ceae6211d58a2bd3   # identical content, different path — SAME hash

$ git ls-tree -r HEAD
100644 blob 95c8bb63928321e7d1793928ceae6211d58a2bd3	lib/settings/app.conf
100644 blob 95c8bb63928321e7d1793928ceae6211d58a2bd3	src/config/app.conf`}</GuideCode>
        <GuideRules
          items={[
            'A hash is derived purely from CONTENT — never the filename or the path.',
            'Change one byte and the hash changes completely; identical content is never stored twice, no matter how many paths or commits reference it.',
            'This is also how git status decides a file changed without diffing anything: it hashes the working-tree content and compares hashes.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={3} title="Refs, Branches & HEAD" accent="green" glyph="🌿" span={2}>
        <GuideCode>{`$ cat .git/refs/heads/main
5beb974b7178f5bf3bf709d496e45da77bbf282c
$ git commit -q -am "Append line two"
$ cat .git/refs/heads/main
9f1c9e163102480f8da2e37ae50aecf75b94cfda   # same file, new content — "the branch advanced"

$ cat .git/HEAD
ref: refs/heads/main        # HEAD points AT a branch, not a hash

$ git checkout 1470db8983dc1872872e70e8b45e607e3864dd2b
$ cat .git/HEAD
1470db8983dc1872872e70e8b45e607e3864dd2b   # detached: the hash written straight in
$ git status
HEAD detached at 1470db8`}</GuideCode>
        <GuideDefs
          items={[
            ['branch ref', '~41 bytes on disk — 50 extra branches cost 0.01s of real CPU time'],
            ['git reset --hard', 'rewrites that SAME small file to an existing commit; nothing new is created, and the old commit still exists, just unreferenced'],
            ['detached HEAD', 'normal for looking at old history; committing there and switching branches without git branch <name> first leaves the commit unreachable (recoverable via git reflog for a while)'],
          ]}
        />
        <GuideRules
          items={[
            "git switch and git restore split checkout's two historical jobs in modern Git — checkout itself still works and is not deprecated.",
          ]}
        />
      </GuidePanel>

      <GuidePanel n={4} title="The DAG & Object Commands" accent="amber" glyph="🕸️" span={2}>
        <GuideCode>{`$ git log --graph --oneline --all
*   46573ae Merge branch 'feature'
|\\
| * 4ee2c86 Continue feature work
| * 1470db8 Start feature work
* | 0c07453 Update greeting on main
|/
* 29c1197 Append line two

$ git cat-file -p HEAD
parent 0c0745379a3d7ad829b22bc6aa55f65e7dd13f38
parent 4ee2c86a766f3f8dd6842421f5799adfa2e6554f   # TWO parents = a merge commit`}</GuideCode>
        <GuideTable
          head={['I want to...', 'Run']}
          rows={[
            ["See an object's type / content", 'git cat-file -t / -p <hash>'],
            ['Find what a branch points at', 'git rev-parse <name>'],
            ['Visualize the whole commit DAG', 'git log --graph --oneline --all'],
            ['Recover a commit orphaned by reset', 'git reflog'],
          ]}
        />
        <GuideRules
          items={[
            'DAG = Directed Acyclic Graph: edges only point backward to a parent, never loop back to a commit already visited.',
            'Modern Git can store refs in a binary reftable instead of loose files (the Git 3.0 default for new repos) — read a ref with rev-parse or show-ref, not cat .git/refs/..., since the loose file may not even exist.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={5} title="Merge vs Rebase" accent="pink" glyph="🔀" span={2}>
        <GuideCode>{`git merge feature   -> a real merge commit, TWO parents:
  4da9d89 (HEAD -> main) Merge branch 'feature'
  |\\
  | * 9af3715 (feature) Feature: add validation
  * | 34271ca ...
  |/

git rebase main   (on feature, instead)  -> LINEAR, no merge commit:
  a89865e -> 8cc7b73 -> 34271ca -> 5a93f17`}</GuideCode>
        <GuideRules
          items={[
            "Rebase REWRITES hashes: the identical file change gets a brand new commit SHA after replay — feature's tip went from 9af3715... to a89865e..., even though the diff kept an identical blob hash both times.",
            "merge creates one new commit with two parents; it never changes an existing commit's hash — that is exactly why merge is safe for shared history and rebase is not.",
          ]}
        />
      </GuidePanel>

      <GuidePanel n={6} title="The Rebase Danger" accent="red" glyph="⚠️">
        <GuideCode>{`# Alice pushes; Bob pulls and builds his own commit on top.
# Alice then rebases the already-pushed commits and force-pushes.

$ git pull                  (on Bob's clone)
fatal: Need to specify how to reconcile divergent branches.`}</GuideCode>
        <GuideRules
          items={[
            'Never rebase commits that have already been pushed and might be pulled by someone else — rebase creates new hashes for what looks like "the same" commits.',
            'Push rewritten history with git push --force-with-lease, never bare --force: force-with-lease aborts if the remote moved since your last fetch; bare --force overwrites regardless.',
            'Reproduced with two real clones: after a teammate pushed, --force-with-lease refused with "(stale info)"; plain --force reported "(forced update)" and destroyed their commit.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={7} title="Interactive Rebase -i" accent="cyan" glyph="✂️">
        <GuideCode>{`$ GIT_SEQUENCE_EDITOR="sed -i '' -e '2,3s/^pick/squash/'" \\
    GIT_EDITOR=true git rebase -i HEAD~3
Successfully rebased and updated refs/heads/feature.

$ git log --oneline -3
b8b5ecb WIP: start password reset
a89865e Feature: add validation
8cc7b73 Feature: add login form`}</GuideCode>
        <GuideDefs
          items={[
            ['pick', 'keep the commit as-is'],
            ['squash', 'combine into the previous commit; prompts for a combined message'],
            ['reword', 'keep the changes, edit the message'],
            ['edit', 'pause the rebase here to amend'],
            ['drop', 'discard the commit entirely'],
          ]}
        />
        <GuideRules
          items={[
            'Reordering two lines in the todo list reorders the replayed commits — same mechanism as squash, just a different edit.',
            'Every replayed commit gets a brand new hash, even one that only reorders without changing content.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={8} title="Conflict Resolution" accent="blue" glyph="🥊">
        <GuideCode>{`$ git merge increase-timeout
CONFLICT (content): Merge conflict in config.txt
Automatic merge failed; fix conflicts and then commit the result.

$ cat config.txt
<<<<<<< HEAD
timeout = 10
=======
timeout = 60
>>>>>>> increase-timeout`}</GuideCode>
        <GuideRules
          items={[
            'Between <<<<<<< HEAD and ======= is the branch currently checked out; between ======= and >>>>>>> <name> is the branch being merged in.',
            'Resolve by editing the file down to the intended content, then git add <file> and git commit — or git rebase --continue mid-rebase.',
            'git add on a conflicted file means "this path is resolved," not "accept my working-tree edit."',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={9} title="Branching Quick Reference" accent="purple" glyph="🧭" span={2}>
        <GuideTable
          head={['I need to...', 'Use', 'Because']}
          rows={[
            ['Clean up WIP commits before a PR', 'git rebase -i', 'unpushed — rewriting is free'],
            ['Update your own unpushed branch with main', 'git rebase main', 'linear history; safe because it is still only yours'],
            ['Bring a branch others may have pulled into main', 'git merge', "never rewrites an existing commit's hash"],
            ['Push after rebasing or amending a PR branch', 'git push --force-with-lease', 'aborts if the remote moved since your last fetch'],
            ['Resolve a flagged conflict', 'edit markers, git add, git commit', 'Git cannot choose a winner between two edits automatically'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={10} title="Trunk-Based vs. GitFlow" accent="green" glyph="🌳">
        <GuideTable
          head={['Model', 'Fits']}
          rows={[
            ['Trunk-based', 'Continuous deployment; small, frequent merges to main, often behind feature flags'],
            ['GitFlow', 'Scheduled/versioned releases with multiple supported lines — Vincent Driessen, Jan 2010; his own later note steers continuous-deployment teams toward simpler models'],
          ]}
        />
        <GuideRules
          items={[
            "Match the model to how the software ships: most web teams default to trunk-based; genuine parallel release lines (desktop, firmware, a maintained v2 + v3 library) fit GitFlow's explicit roles.",
          ]}
        />
      </GuidePanel>

      <GuidePanel n={11} title="Pull Requests & Code Review" accent="amber" glyph="🔍">
        <GuideRules
          items={[
            'Size: reviewer defect-detection drops sharply past roughly 200-400 changed lines (Cisco/SmartBear study, ~2,500 reviews) — a 2,000-line PR gets skimmed, not scrutinized.',
            'Decompose large work into an ordered stack of small, independently reviewable PRs instead of one PR that lands a whole rewrite atomically.',
            'A PR description should explain WHY — the alternative ruled out, the constraint, the ticket — the diff already shows what changed.',
            'Formatting and import order should not cost review time if a linter enforces them automatically; a human catching them by hand is a tooling gap, not a review win.',
            "Mark optional comments explicitly: Google's published engineering practices prefix a non-blocking suggestion with \"Nit:\" — everything else defaults to blocking.",
          ]}
        />
      </GuidePanel>

      <GuidePanel n={12} title="Conventional Commits" accent="pink" glyph="📝" span={2}>
        <GuideCode>{`<type>[optional scope]: <description>

[optional body]
[optional footer(s)]

git commit -m "feat(auth): add OAuth2 login flow"
git commit -m "fix(cart): prevent duplicate line items on double-click"
git commit -m "feat(api)!: remove deprecated /v1/users endpoint"`}</GuideCode>
        <GuideRules
          items={[
            'Spec (conventionalcommits.org v1.0.0) mandates only TWO types: fix (SemVer PATCH) and feat (SemVer MINOR).',
            "chore, docs, refactor, style, test, ci, build all come from the Angular project's convention that tooling (commitlint, semantic-release) also happens to support — not the spec text itself.",
            'A ! right after the type/scope, or a BREAKING CHANGE: footer, forces a MAJOR bump regardless of which type it is attached to.',
            'Payoff: a machine can bucket commits by type and generate a changelog, and the same scan picks the next SemVer bump — but only if the prefixes stay consistent across the team.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={13} title="Merge Queues & Squash Merge" accent="red" glyph="🚦" span={2}>
        <GuideCode>{`$ git merge --squash feature-branch
Squash commit -- not updating HEAD
# stages the combined diff from every commit on the branch; creates NO
# commit until you run git commit yourself`}</GuideCode>
        <GuideRules
          items={[
            'Semantic conflict: PR A renames a shared function, PR B adds a caller using the old name. No textual conflict, both pass CI against main alone — main breaks the moment both land.',
            'A merge queue re-tests each queued PR against main plus every PR already ahead of it, not just against main at approval time — this is exactly what plain branch-protection-plus-CI cannot catch.',
            "Real, shipping feature: GitHub's native merge queue reached general availability in July 2023; GitLab has shipped the same idea longer under the name \"merge trains.\"",
            'A failing combination ejects just that one PR and re-queues everything behind it against the new reality.',
            'The clean, single-commit history a queue produces on main usually comes from squash-merging each PR — the PR title/description often becomes that final commit message.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={14} title="Monorepo vs. Polyrepo" accent="cyan" glyph="🗂️">
        <GuideDefs
          items={[
            ['monorepo', 'one atomic commit can touch a shared library and every caller; one place for CI/lint/tooling config; trivial cross-project search'],
            ['polyrepo', 'simpler per-project access control; independent deploy cadence per team; no risk of one bad commit blocking CI for every other project'],
          ]}
        />
        <GuideRules
          items={[
            'Both are genuinely defensible — the debate is real, not settled. Pick based on team and deploy topology, not dogma.',
          ]}
        />
      </GuidePanel>
    </GuideLayout>
  );
}
