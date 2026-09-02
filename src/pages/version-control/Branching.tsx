import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';

export default function Branching() {
  return (
    <LessonLayout
      title="Branching & Rebase Strategies"
      sectionId="version-control"
      lessonIndex={1}
      prev={{ path: '/version-control/internals', label: 'Git Internals: Objects, Refs & the DAG' }}
      next={{ path: '/version-control/collaboration', label: 'Collaborative Workflows' }}
    >
      <p>
        The previous lesson established, with real <code>cat .git/refs/heads/&lt;name&gt;</code> output,
        that a branch is a small text file holding one commit hash. Everything in this lesson is a
        consequence of that one fact: branches are cheap enough to create by the dozen, merge and rebase
        are two different ways of adding new commits and rewriting which hash a ref points at, and the
        one real danger in this whole area comes from rebase creating <em>new</em> hashes for commits
        that already have a hash someone else is relying on. All of it is demonstrated below in a real
        scratch repo, including a real two-clone simulation of the exact failure a shared-history rebase
        causes.
      </p>

      <h2>What a Branch Actually Costs</h2>

      <p>
        A branch ref file is a fixed, tiny size — 40 hex characters plus a trailing newline — regardless
        of how large the repository's history is. Creating one is a single small file write, not a copy
        of any code:
      </p>

      <CodeBlock language="bash" title="A Branch Ref Is ~41 Bytes, Full Stop">
{`$ git branch feature
$ cat .git/refs/heads/feature
5a93f17c21713690d2f469e673e67c5a65ae3c51
$ wc -c < .git/refs/heads/feature
41`}
      </CodeBlock>

      <p>
        Creating 50 more of them, timed for real:
      </p>

      <CodeBlock language="bash" title="Fifty Branches, Timed">
{`$ time (for i in $(seq 1 50); do git branch "temp-$i"; done)
( for i in $(seq 1 50); do; git branch "temp-$i"; done; )  0.01s user 0.01s system 2% cpu 0.756 total

$ ls .git/refs/heads | wc -l
52
$ find .git/refs/heads -type f -exec wc -c {} + | tail -1
    2132 total`}
      </CodeBlock>

      <p>
        0.01 seconds of actual CPU time for 50 branches — the 0.756-second wall-clock figure is almost
        entirely the cost of spawning 50 separate <code>git</code> processes from the shell loop, not
        anything Git itself is doing per branch. 52 ref files (2 original + 50 new) come to 2,132 bytes
        total, matching 41 bytes &times; 52 almost exactly. (A plain <code>du -sh</code> on that directory
        reported 208K on this machine — that number is filesystem block-allocation overhead from macOS
        APFS rounding tiny files up to a minimum block size, not anything Git wrote; the actual content is
        the 2,132 bytes above.) Compare this to centrally-hosted, pre-DVCS systems like Subversion, where a
        branch was historically a full server-side copy of the tree and creating one could mean copying an
        entire codebase's worth of paths — expensive enough that teams reserved branching for large,
        infrequent efforts. A cost measured in bytes and milliseconds is why git workflows default to the
        opposite extreme: a new branch per feature, per bug fix, sometimes per five-minute experiment,
        discarded with <code>git branch -D</code> just as cheaply if it doesn't pan out.
      </p>

      <h2>Merge vs Rebase, Side by Side</h2>

      <p>
        Same starting point for both: <code>main</code> gets one commit, <code>feature</code> gets two,
        diverging from a shared ancestor.
      </p>

      <CodeBlock language="bash" title="Diverging History">
{`$ git checkout -q feature
$ echo "<form>login</form>" > login.txt
$ git add login.txt
$ git commit -q -m "Feature: add login form"
$ echo "if (!valid) throw" >> login.txt
$ git commit -q -am "Feature: add validation"

$ git checkout -q main
$ echo "v1.1" >> readme.txt
$ git commit -q -am "Main: bump version"

$ echo "main:    $(git rev-parse main)"
main:    34271ca688d6fc33e0ce1bc1bb6bff9d688bbd83
$ echo "feature: $(git rev-parse feature)"
feature: 9af37158cc7495ea7a09a436de12799cdd3895f2`}
      </CodeBlock>

      <p>
        <strong>Option 1 — merge.</strong> Bring <code>feature</code> into <code>main</code> with{' '}
        <code>git merge</code>:
      </p>

      <CodeBlock language="bash" title="git merge — Creates a Merge Commit">
{`$ git checkout -q main
$ git merge --no-edit feature -q

$ git log --graph --oneline --all --decorate
*   4da9d89 (HEAD -> main) Merge branch 'feature'
|\\
| * 9af3715 (feature) Feature: add validation
| * a103470 Feature: add login form
* | 34271ca Main: bump version
|/
* 5a93f17 Initial commit

$ git log -1 --pretty=%P HEAD
34271ca688d6fc33e0ce1bc1bb6bff9d688bbd83 9af37158cc7495ea7a09a436de12799cdd3895f2`}
      </CodeBlock>

      <p>
        A brand-new commit, <code>4da9d89</code>, appears with <strong>two</strong> hashes on its{' '}
        <code>parent</code> line — <code>34271ca&hellip;</code> (main's tip) and{' '}
        <code>9af3715&hellip;</code> (feature's tip). Nothing about the two original branches' commits
        changed; a new commit was added on top that references both histories.
      </p>

      <p>
        <strong>Option 2 — rebase.</strong> Undo that merge (reset <code>main</code> back to its
        pre-merge tip — <code>feature</code> is untouched by any of this), and instead replay{' '}
        <code>feature</code>'s commits on top of <code>main</code>:
      </p>

      <CodeBlock language="bash" title="git rebase — Linear, No Merge Commit">
{`$ git reset --hard 34271ca688d6fc33e0ce1bc1bb6bff9d688bbd83 -q
$ git checkout -q feature
$ git rebase main
Rebasing (1/2)Rebasing (2/2)Successfully rebased and updated refs/heads/feature.

$ git log --graph --oneline --all --decorate
* a89865e (HEAD -> feature) Feature: add validation
* 8cc7b73 Feature: add login form
* 34271ca (main) Main: bump version
* 5a93f17 Initial commit`}
      </CodeBlock>

      <p>
        No merge commit anywhere — a single straight line. <code>feature</code> now sits directly on
        top of <code>main</code>'s tip, as if its two commits had been written after{' '}
        <code>Main: bump version</code> all along.
      </p>

      <FlowChart
        title="merge Adds a Commit With Two Parents"
        chart={"graph LR\n  Base[5a93f17 Initial] --> Main[34271ca Main bump version]\n  Base --> F1[a103470 login form]\n  F1 --> F2[9af3715 add validation]\n  Main --> Merge[4da9d89 Merge commit]\n  F2 --> Merge"}
      />

      <FlowChart
        title="rebase Replays Commits, No Merge Node"
        chart={"graph LR\n  Base[5a93f17 Initial] --> Main[34271ca Main bump version]\n  Main --> F1p[8cc7b73 login form']\n  F1p --> F2p[a89865e add validation']"}
      />

      <p>
        This is the entire tradeoff. Merge preserves exactly what happened, including the fact that two
        lines of work diverged and were reconciled at a specific point — at the cost of a graph that gets
        harder to read as merge commits accumulate. Rebase produces a graph that reads like the feature
        was built in one continuous line — at a cost covered next: it does not simply relabel the
        existing commits.
      </p>

      <h2>The Rebase Danger: New Hashes, Real Consequences</h2>

      <p>
        <code>feature</code>'s tip was <code>9af3715&hellip;</code> before the rebase above and{' '}
        <code>a89865e&hellip;</code> after it — different commit objects, not the same commit moved to a
        new location:
      </p>

      <CodeBlock language="bash" title="Same File Content, Different Commit Hash">
{`$ git ls-tree 9af3715 login.txt
100644 blob 1df70d50f12685c3a66f028ee3068789cc7ad67c	login.txt
$ git ls-tree feature login.txt
100644 blob 1df70d50f12685c3a66f028ee3068789cc7ad67c	login.txt

$ git diff 9af3715 feature -- login.txt
(nothing — byte-identical file content)

$ git cat-file -p 9af37158cc7495ea7a09a436de12799cdd3895f2
tree c57dd34e4052d28a9be8a39ab43a362095ffb513
parent a10347027135a482f3ae2193595bc36e4da0f8a7
author Demo User <demo@example.com> 1786841372 -0500
committer Demo User <demo@example.com> 1786841372 -0500

Feature: add validation

$ git cat-file -p feature
tree a8c2670af68659e8137c4ec020576023c8044cc8
parent 8cc7b7326fcb2599336052007926d4016fcabc31
author Demo User <demo@example.com> 1786841372 -0500
committer Demo User <demo@example.com> 1786841384 -0500

Feature: add validation`}
      </CodeBlock>

      <p>
        <code>login.txt</code>'s blob is the exact same object (<code>1df70d50&hellip;</code>) both
        times — the change the commit introduces is identical. But the commit object itself is not, and
        the reason is the one from the previous lesson: <strong>a commit's hash is the hash of its own
        bytes, and the <code>parent</code> line is one of those bytes.</strong> Point it at the rebase
        target instead of the old parent and the object being hashed is literally different text, so the
        hash is different. (Two other lines moved here too: the <code>tree</code>, because the replayed
        commit now snapshots a working tree that also contains main's changes, and the{' '}
        <code>committer</code> timestamp, which is stamped fresh at replay time — the author timestamp is
        preserved. Any one of the three on its own is enough.) Content-addressing applies without
        exception: different bytes, different hash — the same rule as two files differing by one byte.
      </p>

      <InfoBox variant="warning" title="A Changed Parent Does Not Mean a Changed Tree">
        <p>
          It is tempting to compress that into &quot;the parent changed, so the tree changed, so the
          hash changed.&quot; That middle step is not a rule — the tree records the <em>snapshot</em>,
          and re-parenting a commit onto history that adds nothing to the snapshot leaves it byte-identical.
          Rebasing a commit onto an <code>--allow-empty</code> commit demonstrates it: same tree object,
          different parent, different commit hash.
        </p>
        <CodeBlock language="bash" title="Same tree, new parent, new hash — verified on git 2.50.1">
{`# feature = one commit adding b.txt; main then gets an EMPTY commit
$ git rev-parse feature          # before rebase
15d1de688d3e474bcbd05ec2a9a4a9a09bc33336
$ git cat-file -p feature | head -1
tree f4b354863caa9cea99b95422c9dab70465757d87

$ git rebase -q main

$ git rev-parse feature          # after rebase -> DIFFERENT commit
1e42c471af1213a79164f5a6eb751a9fcf056fab
$ git cat-file -p feature | head -1
tree f4b354863caa9cea99b95422c9dab70465757d87   # ...but the SAME tree`}
        </CodeBlock>
        <p>
          The direction only runs one way: changing the tree always changes the commit hash, because the
          tree line is part of the commit's bytes. Changing the parent also always changes the commit
          hash, for exactly the same reason — not via the tree.
        </p>
      </InfoBox>

      <p>
        The old commit, <code>9af3715&hellip;</code>, is still a real object right after the rebase —
        just unreferenced:
      </p>

      <CodeBlock language="bash" title="The Old Commit Still Exists, Just Unreachable">
{`$ git cat-file -t 9af37158cc7495ea7a09a436de12799cdd3895f2
commit
$ git branch --contains 9af3715
(nothing — no branch contains it anymore)

$ git reflog show feature | head -4
a89865e feature@{0}: rebase (finish): refs/heads/feature onto 34271ca688d6fc33e0ce1bc1bb6bff9d688bbd83
9af3715 feature@{1}: commit: Feature: add validation
a103470 feature@{2}: commit: Feature: add login form
5a93f17 feature@{3}: branch: Created from main`}
      </CodeBlock>

      <p>
        This is harmless as long as nobody else has that old hash. It stops being harmless the moment
        someone else <em>does</em> — which is exactly what happens after a push. Here is the real failure,
        reproduced with two actual clones of a shared repo:
      </p>

      <CodeBlock language="bash" title="Alice Pushes, Bob Pulls and Builds On Top">
{`# Alice pushes two commits to the shared 'origin'
alice$ git log --oneline
8f20ac3 Alice: change 2
1693ca6 Alice: change 1
924fbe3 Initial commit
alice$ git push -q origin main

# Bob pulls — his local main now matches Alice's exactly
bob$ git pull -q origin main
bob$ git log --oneline
8f20ac3 Alice: change 2
1693ca6 Alice: change 1
924fbe3 Initial commit

# Bob adds his own commit on top of Alice's (now-shared) commits
bob$ echo "bob's own change" >> shared.txt
bob$ git commit -q -am "Bob: add his own change on top"`}
      </CodeBlock>

      <CodeBlock language="bash" title="Alice Rebases the Already-Pushed Commits and Force-Pushes">
{`alice$ GIT_SEQUENCE_EDITOR="sed -i '' -e '2s/^pick/squash/'" GIT_EDITOR=true git rebase -i HEAD~2
Rebasing (2/2)[detached HEAD 0c8a20c] Alice: change 1
Successfully rebased and updated refs/heads/main.

alice$ git log --oneline
0c8a20c Alice: change 1
924fbe3 Initial commit

alice$ git push --force -q origin main`}
      </CodeBlock>

      <CodeBlock language="bash" title="Bob Pulls — Git Refuses, Precisely Because the Histories No Longer Agree">
{`bob$ git fetch origin
 + 8f20ac3...0c8a20c main       -> origin/main  (forced update)

bob$ git pull origin main
hint: You have divergent branches and need to specify how to reconcile them.
hint: You can do so by running one of the following commands sometime before
hint: your next pull:
hint:
hint:   git config pull.rebase false  # merge
hint:   git config pull.rebase true   # rebase
hint:   git config pull.ff only       # fast-forward only
fatal: Need to specify how to reconcile divergent branches.`}
      </CodeBlock>

      <p>
        This is the actual mechanism, not a hypothetical: Bob's <code>main</code> and the rewritten{' '}
        <code>origin/main</code> share the same starting commit (<code>924fbe3</code>) but diverge from
        there by hash, even though Alice's <em>content</em> is identical on both sides. Git has no way to
        know that <code>0c8a20c</code> is &quot;the same change, just rebased&quot; — by definition, a
        commit's identity is its hash, and these are two different commits. Choosing to merge does not
        avoid the pain, it just moves it into the merge itself:
      </p>

      <CodeBlock language="bash" title="Bob Chooses Merge — the Divergence Surfaces as a Conflict">
{`bob$ git pull --no-rebase origin main
Auto-merging shared.txt
CONFLICT (content): Merge conflict in shared.txt
Automatic merge failed; fix conflicts and then commit the result.

bob$ cat shared.txt
base
alice change 1
alice change 2
<<<<<<< HEAD
bob's own change
=======
>>>>>>> 0c8a20ce800f5a2d114201b421cfeab35e62743a

bob$ printf "base\\nalice change 1\\nalice change 2\\nbob's own change\\n" > shared.txt
bob$ git add shared.txt
bob$ git commit -q --no-edit

bob$ git log --oneline --graph --all
*   615c81c Merge branch 'main' of ...
|\\
| * 0c8a20c Alice: change 1
* | 5ca1d8c Bob: add his own change on top
* | 8f20ac3 Alice: change 2
* | 1693ca6 Alice: change 1
|/
* 924fbe3 Initial commit`}
      </CodeBlock>

      <p>
        Notice the final line of history: Bob's repo now permanently contains{' '}
        <strong>both</strong> versions of Alice's change — the original two commits (
        <code>1693ca6</code>, <code>8f20ac3</code>) and Alice's rewritten squash of the same change (
        <code>0c8a20c</code>) — stitched together by a merge commit neither of them intended to create.
        Git's line-based 3-way merge happened to reconcile the actual text cleanly (both sides added the
        same two lines), which is why the conflict landed only on Bob's own unrelated line rather than on
        Alice's content — but the duplicate commits are permanent in Bob's history either way. That is
        precisely why the rule exists:
      </p>

      <InfoBox variant="danger" title="Never Rebase Commits Someone Else Has Already Pulled">
        <p>
          Rewriting commits that only exist on your own machine, or on a PR branch nobody else has based
          work on, is completely safe — that is what interactive rebase is <em>for</em>. The line is
          whether anyone else may have already pulled those specific commit hashes and built on top of
          them. Once they have, force-pushing a rebase does not update their copy; it leaves them holding
          commits that reference a parent hash which no longer exists on the shared branch, silently
          diverging exactly as shown above. Their next pull either hard-fails asking them to pick a
          reconciliation strategy, or — if resolved with a merge — permanently welds a duplicate copy of
          the rewritten history into their branch. Shared branches (<code>main</code>,{' '}
          <code>develop</code>, anything with a second contributor) get merged. Personal branches nobody
          else has fetched get rebased freely.
        </p>
      </InfoBox>

      <h2>Interactive Rebase: Squash and Reorder</h2>

      <p>
        <code>git rebase -i</code> opens an editable list of <code>pick</code> lines, one per commit, in
        a text editor — changing a line's verb changes what happens to that commit. Scripting the editor
        with <code>GIT_SEQUENCE_EDITOR</code> runs the exact same rebase machinery non-interactively,
        which is how this was verified for real rather than described from memory.
      </p>

      <p>
        <strong>Squashing</strong> three work-in-progress commits into one — change{' '}
        <code>pick</code> to <code>squash</code> on the second and third lines of the todo list:
      </p>

      <CodeBlock language="bash" title="Before — Three Separate Commits">
{`$ git log --oneline -5
b84e52e WIP: add tests
4df8d90 WIP: fix typo
69b8601 WIP: start password reset
a89865e Feature: add validation
8cc7b73 Feature: add login form`}
      </CodeBlock>

      <CodeBlock language="bash" title="git rebase -i, Scripted — squash Both Later Commits Into the First">
{`$ GIT_SEQUENCE_EDITOR="sed -i '' -e '2,3s/^pick/squash/'" GIT_EDITOR=true git rebase -i HEAD~3
Rebasing (2/3)Rebasing (3/3)[detached HEAD b8b5ecb] WIP: start password reset
 1 file changed, 3 insertions(+)
Successfully rebased and updated refs/heads/feature.

$ git log --oneline -5
b8b5ecb WIP: start password reset
a89865e Feature: add validation
8cc7b73 Feature: add login form
34271ca Main: bump version
5a93f17 Initial commit

$ git log -1 --format="%B" HEAD
WIP: start password reset

WIP: fix typo

WIP: add tests`}
      </CodeBlock>

      <p>
        Three commits became one, <code>b8b5ecb</code>, with the default combined message concatenating
        all three original messages (a real editor session lets you rewrite that message instead of
        accepting the default).
      </p>

      <p>
        <strong>Reordering</strong> works the same way — swap the order of two lines in the todo list
        instead of changing their verb:
      </p>

      <CodeBlock language="bash" title="Before — 'docs' Committed After 'flag'">
{`$ git log --oneline -2
7c5e3af Add feature flag docs
1adf856 Add feature flag`}
      </CodeBlock>

      <p>
        <code>GIT_SEQUENCE_EDITOR</code> can point at any executable that rewrites the todo file in
        place — here, a two-line script that swaps the file's first two lines:
      </p>

      <CodeBlock language="bash" title="swap_editor.sh — Swaps the Todo List's First Two Lines">
{`#!/bin/bash
awk 'NR==1{first=$0; next} NR==2{print; print first; next} {print}' "$1" > "$1.tmp"
mv "$1.tmp" "$1"`}
      </CodeBlock>

      <CodeBlock language="bash" title="git rebase -i, Scripted — Swap the Two pick Lines">
{`$ chmod +x swap_editor.sh
$ GIT_SEQUENCE_EDITOR=./swap_editor.sh git rebase -i HEAD~2
Rebasing (1/2)Rebasing (2/2)Successfully rebased and updated refs/heads/feature.

$ git log --oneline -3
39a8b3a Add feature flag
6b84df1 Add feature flag docs
b8b5ecb WIP: start password reset`}
      </CodeBlock>

      <p>
        The commits with the flag change and its docs traded places (both got new hashes, as always with
        rebase). This is the same operation squashing used — edit the todo list, Git replays commits in
        whatever order the list says — just changing order instead of collapsing count.
      </p>

      <h2>Conflict Resolution Mechanics</h2>

      <p>
        A conflict happens when two branches edit the <em>same line</em> differently and Git cannot pick a
        winner automatically. Forcing one for real — <code>main</code> and a branch both change the same
        config line in incompatible ways:
      </p>

      <CodeBlock language="bash" title="Same Line, Two Different Edits">
{`$ echo "timeout = 30" > config.txt
$ git commit -q -am "Initial config"

$ git checkout -q -b increase-timeout
$ sed -i '' 's/timeout = 30/timeout = 60/' config.txt
$ git commit -q -am "Bump timeout to 60 for slow clients"

$ git checkout -q main
$ sed -i '' 's/timeout = 30/timeout = 10/' config.txt
$ git commit -q -am "Tighten timeout to 10 for fast-fail"`}
      </CodeBlock>

      <InfoBox variant="note" title="git checkout -b vs git switch -c">
        <p>
          Every branch-creation/switch command in this lesson uses <code>git checkout</code>, including{' '}
          <code>git checkout -q -b increase-timeout</code> above — deliberately, for consistency with the
          countless existing codebases and CI scripts you&apos;ll encounter that were written before the
          alternative existed, and because <code>checkout</code> is not deprecated (the{' '}
          <em>Git Internals</em> lesson confirms this directly against Git&apos;s own docs). But{' '}
          <code>git switch</code> and <code>git restore</code> — which split <code>checkout</code>&apos;s
          two historically-overloaded jobs (moving between branches vs. discarding file changes) into two
          separate, narrower commands — graduated out of experimental status as of Git 2.51.0 (August
          2025) and are now Git&apos;s own recommended starting point for newcomers. For exactly what this
          lesson just did, <code>git switch -c increase-timeout</code> is the direct equivalent of{' '}
          <code>git checkout -b increase-timeout</code>, and plain <code>git switch feature</code> replaces{' '}
          <code>git checkout feature</code> for moving between existing branches. Reach for whichever one
          the codebase you&apos;re in already uses — this lesson sticks to <code>checkout</code> throughout
          purely so every example stays consistent with itself.
        </p>
      </InfoBox>

      <CodeBlock language="bash" title="git merge — Real Conflict, Real Markers">
{`$ git merge increase-timeout
Auto-merging config.txt
CONFLICT (content): Merge conflict in config.txt
Automatic merge failed; fix conflicts and then commit the result.
$ echo $?
1

$ git status
On branch main
You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)
	both modified:   config.txt

$ cat config.txt
<<<<<<< HEAD
timeout = 10
=======
timeout = 60
>>>>>>> increase-timeout`}
      </CodeBlock>

      <p>
        Everything between <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD</code> and{' '}
        <code>=======</code> is the version on the branch you currently have checked out (
        <code>main</code>'s <code>timeout = 10</code>); everything between{' '}
        <code>=======</code> and <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt; increase-timeout</code> is the
        version from the branch being merged in. Git makes no decision here — it inserts both versions
        and stops. Resolving means editing the file down to the intended final content, then finishing
        the merge exactly like any other commit:
      </p>

      <CodeBlock language="bash" title="Resolve and Complete the Merge">
{`$ echo "timeout = 20" > config.txt
$ git add config.txt
$ git commit -q --no-edit
$ echo $?
0

$ git status
On branch main
nothing to commit, working tree clean

$ git log --graph --oneline --all
*   6b4d18b Merge branch 'increase-timeout'
|\\
| * fcc5ffc Bump timeout to 60 for slow clients
* | 2e50248 Tighten timeout to 10 for fast-fail
|/
* 680d91a Initial config`}
      </CodeBlock>

      <p>
        <code>git add</code> on a conflicted file does not mean &quot;accept my working-tree
        edit&quot; in the usual sense — it means &quot;this path's conflict is resolved,&quot; and{' '}
        <code>git commit</code> with no further changes finishes the in-progress merge using whatever the
        working tree currently holds. The same markers, same <code>add</code>-then-continue pattern, apply
        during a conflicted rebase — the only difference is the command that finishes it is{' '}
        <code>git rebase --continue</code> instead of <code>git commit</code>.
      </p>

      <h2>Quick Reference</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>I need to&hellip;</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Use</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Because</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Clean up WIP commits before opening a PR</td>
            <td style={{ padding: '0.75rem' }}><strong>git rebase -i</strong> (squash/reword)</td>
            <td style={{ padding: '0.75rem' }}>Nobody has pulled these commits yet — rewriting them is free</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Update your own unpushed feature branch with the latest main</td>
            <td style={{ padding: '0.75rem' }}><strong>git rebase main</strong></td>
            <td style={{ padding: '0.75rem' }}>Linear history, no merge commit — safe because it's still only yours</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Bring a branch other people may have pulled into main</td>
            <td style={{ padding: '0.75rem' }}><strong>git merge</strong></td>
            <td style={{ padding: '0.75rem' }}>Never changes an existing commit's hash — safe for shared history</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Reorder, edit, or drop older unpushed commits</td>
            <td style={{ padding: '0.75rem' }}><strong>git rebase -i</strong></td>
            <td style={{ padding: '0.75rem' }}>The todo list gives full control: pick/squash/reword/edit/drop</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Push your own PR branch after rebasing or amending it</td>
            <td style={{ padding: '0.75rem' }}><strong>git push --force-with-lease</strong> (never bare <code>--force</code>)</td>
            <td style={{ padding: '0.75rem' }}>Rewriting means the remote can&apos;t fast-forward, so <em>some</em> force is required — but <code>--force-with-lease</code> first checks the remote branch still points where your last fetch said it did, and aborts if a teammate pushed in the meantime. Reproduced with two clones: after a teammate pushed, <code>--force-with-lease</code> refused with <code>! [rejected] main -&gt; main (stale info)</code>, while plain <code>--force</code> reported <code>(forced update)</code> and destroyed their commit. It only protects you if you have <em>not</em> just run <code>git fetch</code> — fetching refreshes the lease</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Resolve a conflict Git flagged</td>
            <td style={{ padding: '0.75rem' }}>Edit between <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code>/<code>=======</code>/<code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code>, then <code>git add</code> + <code>git commit</code> (or <code>rebase --continue</code>)</td>
            <td style={{ padding: '0.75rem' }}>Git paused because it cannot choose a winner between two edits automatically</td>
          </tr>
        </tbody>
      </table>

      <p>
        The next lesson builds on this directly: pull requests, force-pushing your own PR branch after a
        rebase, and the team conventions that decide, project by project, where the merge/rebase line
        actually gets drawn.
      </p>

    </LessonLayout>
  );
}
