import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function Internals() {
  return (
    <LessonLayout
      title="Git Internals: Objects, Refs & the DAG"
      sectionId="version-control"
      lessonIndex={0}
      prev={null}
      next={{ path: '/version-control/branching', label: 'Branching & Rebase Strategies' }}
    >
      <p>
        <code>git merge</code>, <code>git rebase</code>, and <code>git reset</code> all feel like
        distinct, memorized incantations until you see what they actually operate on underneath: a
        content-addressed key-value store plus a handful of tiny text files. There is no magic
        &quot;history&quot; data structure hiding in <code>.git</code> — there are four object types
        and some pointer files, and every high-level command is just a specific way of creating
        objects and rewriting which hash a pointer file contains. Every command and every hash on this
        page was run for real, in a throwaway repo, moments before writing it down — including{' '}
        <code>git --version</code> to confirm the exact behavior applies to this Git version.
      </p>

      <InfoBox variant="info" title="The Four Object Types">
        <p><strong>Blob</strong> — Raw file content. No filename, no permissions, just bytes.</p>
        <p><strong>Tree</strong> — A directory listing: mode, type, hash, and name for each entry.</p>
        <p><strong>Commit</strong> — A pointer to one tree, plus parent commit(s), author, and a message.</p>
        <p><strong>Tag (annotated)</strong> — A pointer to a commit, plus a message and tagger identity.</p>
      </InfoBox>

      <h2>Blobs, Trees, and Commits — Read the Real Objects Back</h2>

      <p>
        Committing one file with a real commit, then asking Git what it actually stored:
      </p>

      <CodeBlock language="bash" title="A Real Commit (git 2.50.1)">
{`$ git --version
git version 2.50.1 (Apple Git-155)

$ git init -q
$ git config user.email "demo@example.com"
$ git config user.name "Demo User"
$ echo "hello git internals" > greeting.txt
$ git add greeting.txt
$ git commit -q -m "Add greeting.txt"

$ git log --oneline
7400081 Add greeting.txt`}
      </CodeBlock>

      <p>
        <code>git cat-file -p</code> prints an object's content and <code>git cat-file -t</code> prints
        its type. Starting from the commit and walking down to the blob:
      </p>

      <CodeBlock language="bash" title="The Commit Object">
{`$ git cat-file -p HEAD
tree 46b5a9787de4738b5eee8b310fd955b1a5a73e14
author Demo User <demo@example.com> 1786840959 -0500
committer Demo User <demo@example.com> 1786840959 -0500

Add greeting.txt

$ git rev-parse HEAD
7400081f72e20afa0a40bf05d93c751cd719f480
$ git cat-file -t 7400081f72e20afa0a40bf05d93c751cd719f480
commit`}
      </CodeBlock>

      <p>
        The commit object is small: it does not contain a diff, and it does not contain your files
        directly. It has exactly one <code>tree</code> line, one or more <code>parent</code> lines (this
        first commit has none — it's a root commit), author/committer metadata, and a message. The tree
        hash it points to is a completely separate object:
      </p>

      <CodeBlock language="bash" title="The Tree Object">
{`$ git cat-file -t 46b5a9787de4738b5eee8b310fd955b1a5a73e14
tree
$ git cat-file -p 46b5a9787de4738b5eee8b310fd955b1a5a73e14
100644 blob b00f56f95b66e87d8d2f3baff7ee67f101c7bfc6	greeting.txt`}
      </CodeBlock>

      <p>
        A tree is a directory listing — file mode, object type, hash, and name, one line per entry. It
        does not contain file content either; it points at a blob:
      </p>

      <CodeBlock language="bash" title="The Blob Object">
{`$ git cat-file -t b00f56f95b66e87d8d2f3baff7ee67f101c7bfc6
blob
$ git cat-file -p b00f56f95b66e87d8d2f3baff7ee67f101c7bfc6
hello git internals`}
      </CodeBlock>

      <p>
        That is the whole chain for one file: <strong>commit &rarr; tree &rarr; blob</strong>. A commit
        with more files just has a tree with more entries (and nested trees for subdirectories); a
        commit with more history just has more parent lines and more commit objects behind it. There is
        nothing else — no separate diff format, no separate history log. <code>git log</code> is
        computed by walking commit objects backward through their parent pointers.
      </p>

      <h2>The Tag Object — And Why Lightweight Tags Skip It</h2>

      <p>
        An <em>annotated</em> tag (<code>git tag -a</code>) is a real fifth kind of object on top of the
        four already shown — a pointer to a commit plus a message and a tagger identity, exactly like a
        commit points to a tree:
      </p>

      <CodeBlock language="bash" title="Annotated Tag — Its Own Object">
{`$ git tag -a v1.0 -m "First release"
$ git rev-parse v1.0
052e3aa231baf2d2d93feaacfc73c01794b14f9c
$ git cat-file -t 052e3aa231baf2d2d93feaacfc73c01794b14f9c
tag
$ git cat-file -p 052e3aa231baf2d2d93feaacfc73c01794b14f9c
object 7400081f72e20afa0a40bf05d93c751cd719f480
type commit
tag v1.0
tagger Demo User <demo@example.com> 1786840972 -0500

First release

$ cat .git/refs/tags/v1.0
052e3aa231baf2d2d93feaacfc73c01794b14f9c`}
      </CodeBlock>

      <p>
        A <em>lightweight</em> tag (<code>git tag</code>, no <code>-a</code>) skips the tag object
        entirely — the ref file just holds the commit hash directly, and its type comes back as{' '}
        <code>commit</code>, not <code>tag</code>:
      </p>

      <CodeBlock language="bash" title="Lightweight Tag — No Tag Object, Points Straight at the Commit">
{`$ git tag lightweight-v1
$ cat .git/refs/tags/lightweight-v1
7400081f72e20afa0a40bf05d93c751cd719f480
$ git cat-file -t 7400081f72e20afa0a40bf05d93c751cd719f480
commit`}
      </CodeBlock>

      <p>
        That is the same hash the annotated tag&apos;s <code>object</code> line named above — both tags
        point at the same (and, this early in the repo, only) commit. The difference is not <em>what</em>{' '}
        they point at, it is how many hops it takes: <code>v1.0</code> resolves to a tag object that then
        names the commit, while <code>lightweight-v1</code> is the commit hash written straight into the
        ref file.
      </p>

      <h2>Content-Addressable Storage: The Hash IS the Content</h2>

      <p>
        A blob's hash is computed purely from its bytes — not its filename, not its path, not when it
        was written. Two files with identical content, committed from completely different paths, hash
        to the exact same value:
      </p>

      <CodeBlock language="bash" title="Identical Content, Different Paths, Same Hash">
{`$ mkdir -p src/config lib/settings
$ echo "max_retries = 3" > src/config/app.conf
$ echo "max_retries = 3" > lib/settings/app.conf

$ git hash-object src/config/app.conf
95c8bb63928321e7d1793928ceae6211d58a2bd3
$ git hash-object lib/settings/app.conf
95c8bb63928321e7d1793928ceae6211d58a2bd3

$ git hash-object src/config/app.conf lib/settings/app.conf
95c8bb63928321e7d1793928ceae6211d58a2bd3
95c8bb63928321e7d1793928ceae6211d58a2bd3

# Change ONE byte in one of the two files and rehash both
$ echo "max_retries = 4" > lib/settings/app.conf
$ git hash-object src/config/app.conf lib/settings/app.conf
95c8bb63928321e7d1793928ceae6211d58a2bd3
19f048780a76af58a411017ffbe27662f0ef5a21`}
      </CodeBlock>

      <p>
        The moment the content diverges by a single byte, the hash diverges completely — that is the
        point of a cryptographic hash, and it is exactly how <code>git status</code> decides a file
        changed without diffing anything: it hashes the working-tree content and compares hashes.
        Committing the two identical files confirms the storage-level consequence — the tree lists two
        different paths that both resolve to <strong>one</strong> blob object:
      </p>

      <CodeBlock language="bash" title="One Blob, Two Tree Entries">
{`$ echo "max_retries = 3" > lib/settings/app.conf
$ git add src lib
$ git commit -q -m "Add two identical config files in different paths"
$ git ls-tree -r HEAD
100644 blob b00f56f95b66e87d8d2f3baff7ee67f101c7bfc6	greeting.txt
100644 blob 95c8bb63928321e7d1793928ceae6211d58a2bd3	lib/settings/app.conf
100644 blob 95c8bb63928321e7d1793928ceae6211d58a2bd3	src/config/app.conf`}
      </CodeBlock>

      <p>
        <code>lib/settings/app.conf</code> and <code>src/config/app.conf</code> point at the identical
        blob hash <code>95c8bb63&hellip;</code>. Git never stores the same content twice, no matter how
        many paths or how many commits reference it — this is also why copying, moving, or renaming a
        large unchanged file costs almost nothing in repo size.
      </p>

      <InfoBox variant="note" title="SHA-1 by Default, SHA-256 Available">
        <p>
          This Git version (2.50.1) still defaults to SHA-1 for object hashes — confirmed with{' '}
          <code>git rev-parse --show-object-format</code>, which printed <code>sha1</code>, and with{' '}
          <code>git hash-object --stdin</code> on arbitrary input, which returned a 40-character hex
          digest (160 bits — a SHA-1 length; SHA-256 would print 64 hex characters). A newer
          repository-wide format is available and does work on this machine —{' '}
          <code>git init --object-format=sha256</code> successfully created a repo — but it produces a
          fully incompatible object store: a SHA-1 repo and a SHA-256 repo cannot currently be pushed to
          or fetched from each other directly. SHA-1 remains the default and the format you will meet in
          essentially every existing repository.
        </p>
      </InfoBox>

      <h2>Refs Are Just Files</h2>

      <p>
        A branch is not a data structure with metadata — it is a plain text file whose entire content is
        one commit hash, living under <code>.git/refs/heads/</code>. &quot;Moving a branch pointer&quot;
        is Git overwriting that file's content with a different hash. No history is touched, no other
        object is modified.
      </p>

      <CodeBlock language="bash" title="A Branch Is a File — Watch Its Content Change">
{`$ git branch -M main
$ ls .git/refs/heads
main
$ cat .git/refs/heads/main
5beb974b7178f5bf3bf709d496e45da77bbf282c
$ git rev-parse main
5beb974b7178f5bf3bf709d496e45da77bbf282c

--- now make a new commit ---
$ echo "line two" >> greeting.txt
$ git add greeting.txt
$ git commit -q -m "Append line two"
$ git rev-parse HEAD
9f1c9e163102480f8da2e37ae50aecf75b94cfda

$ cat .git/refs/heads/main
9f1c9e163102480f8da2e37ae50aecf75b94cfda`}
      </CodeBlock>

      <p>
        The file's content changed from <code>5beb974&hellip;</code> to <code>9f1c9e1&hellip;</code> —
        that single overwrite <em>is</em> what &quot;committing advances the branch&quot; means.{' '}
        <code>git reset</code> is the same mechanism run manually: it rewrites the ref file to point at
        a different, already-existing commit, without creating anything new:
      </p>

      <CodeBlock language="bash" title="git reset --hard Just Rewrites the Same File">
{`$ cat .git/refs/heads/main
9f1c9e163102480f8da2e37ae50aecf75b94cfda

$ git reset --hard HEAD~1
HEAD is now at 5beb974 Add two identical config files in different paths

$ cat .git/refs/heads/main
5beb974b7178f5bf3bf709d496e45da77bbf282c`}
      </CodeBlock>

      <p>
        Note what this proves about &quot;undoing&quot; a commit with <code>reset</code>: the{' '}
        <code>9f1c9e1&hellip;</code> commit object itself was never deleted — it is still sitting in the
        object database, just unreferenced by any ref. Re-running the same <code>echo</code> and{' '}
        <code>commit</code> commands afterward produced a <em>different</em> hash,{' '}
        <code>29c1197&hellip;</code>, for what is otherwise an identical change:
      </p>

      <CodeBlock language="bash" title="Same Content, Different Timestamp, Different Commit Hash">
{`$ git cat-file -p 9f1c9e163102480f8da2e37ae50aecf75b94cfda
tree b2651db1bdde4be702a331b074f7c34a2338c125
parent 5beb974b7178f5bf3bf709d496e45da77bbf282c
author Demo User <demo@example.com> 1786840989 -0500
committer Demo User <demo@example.com> 1786840989 -0500

Append line two

$ git cat-file -p 29c1197
tree b2651db1bdde4be702a331b074f7c34a2338c125
parent 5beb974b7178f5bf3bf709d496e45da77bbf282c
author Demo User <demo@example.com> 1786840999 -0500
committer Demo User <demo@example.com> 1786840999 -0500

Append line two`}
      </CodeBlock>

      <p>
        Same tree hash (<code>b2651db1&hellip;</code>), same parent, same message — but the timestamp
        differs by ten seconds, and a commit object's hash covers <em>all</em> of its content, including
        author/committer timestamps. Different bytes in, different hash out. This is not a special case;
        it is the same content-addressing rule from the blob demo, applied to a bigger object.
      </p>

      <h2>The DAG: Commits Pointing to Parents</h2>

      <p>
        A branch and a merge in the same repo, then <code>git log --graph --oneline --all</code> to
        render the actual commit graph:
      </p>

      <CodeBlock language="bash" title="Building Real Divergent History">
{`$ git checkout -q -b feature
$ echo "feature work line 1" >> feature.txt
$ git add feature.txt
$ git commit -q -m "Start feature work"
$ echo "feature work line 2" >> feature.txt
$ git commit -q -am "Continue feature work"

$ git checkout -q main
$ echo "main-only change" >> greeting.txt
$ git commit -q -am "Update greeting on main"

$ git merge --no-edit feature -q

$ git log --graph --oneline --all
*   46573ae Merge branch 'feature'
|\\
| * 4ee2c86 Continue feature work
| * 1470db8 Start feature work
* | 0c07453 Update greeting on main
|/
* 29c1197 Append line two
* 5beb974 Add two identical config files in different paths
* 7400081 Add greeting.txt`}
      </CodeBlock>

      <p>
        &quot;Directed acyclic graph&quot; means exactly what the picture shows: edges only ever point
        backward from a commit to its parent(s), and there is no path that loops back to a commit you
        already visited. A merge commit is the one place a commit has <em>two</em> parent lines instead
        of one or zero — confirmed by reading the merge commit's raw object:
      </p>

      <CodeBlock language="bash" title="The Merge Commit Has Two parent Lines">
{`$ git cat-file -p HEAD
tree 66aadc7f0e871c5d84a4152d11bb74b8917fbd97
parent 0c0745379a3d7ad829b22bc6aa55f65e7dd13f38
parent 4ee2c86a766f3f8dd6842421f5799adfa2e6554f
author Demo User <demo@example.com> 1786841005 -0500
committer Demo User <demo@example.com> 1786841005 -0500

Merge branch 'feature'`}
      </CodeBlock>

      <FlowChart
        title="The Same History as a Graph"
        chart={"graph TD\n  C1[7400081 Add greeting.txt] --> C2[5beb974 Add config files]\n  C2 --> C3[29c1197 Append line two]\n  C3 --> C4[0c07453 Update greeting - main]\n  C3 --> C5[1470db8 Start feature - feature]\n  C5 --> C6[4ee2c86 Continue feature - feature]\n  C4 --> M[46573ae Merge branch feature]\n  C6 --> M"}
      />

      <p>
        Every high-level operation is now explainable in these terms: <code>git log</code> walks parent
        pointers backward from a ref; <code>git branch newname</code> writes one new small file containing
        the current commit hash; a fast-forward merge just slides a ref forward along a chain it is
        already an ancestor of; a real merge (shown above) creates one new commit object with two parents.
      </p>

      <h2>HEAD: A Pointer to a Pointer (Usually)</h2>

      <p>
        <code>HEAD</code> is not a commit hash — it is almost always a ref <em>to a branch</em>, one more
        level of indirection on top of everything above:
      </p>

      <CodeBlock language="bash" title="HEAD While on a Branch">
{`$ cat .git/HEAD
ref: refs/heads/main`}
      </CodeBlock>

      <p>
        That is the literal file content: the text <code>ref: refs/heads/main</code>, not a hash. Git
        resolves <code>HEAD</code> by following that ref, then reads the commit hash out of{' '}
        <code>refs/heads/main</code>, exactly as shown earlier. Checking out a branch name changes this
        file to point at a different branch; checking out a raw commit hash instead skips the
        indirection entirely and writes the hash straight into <code>HEAD</code> — this is{' '}
        <strong>detached HEAD</strong>:
      </p>

      <CodeBlock language="bash" title="Detached HEAD — HEAD Now Holds a Hash Directly">
{`$ git checkout -q 1470db8983dc1872872e70e8b45e607e3864dd2b

$ cat .git/HEAD
1470db8983dc1872872e70e8b45e607e3864dd2b

$ git status
HEAD detached at 1470db8
nothing to commit, working tree clean`}
      </CodeBlock>

      <p>
        Checking back out a branch name restores the indirection — <code>.git/HEAD</code> goes back to
        reading <code>ref: refs/heads/main</code>. The danger in detached HEAD is not the state itself
        (it is normal and harmless for looking around at old history); it is committing while detached.
        A commit made there advances nothing but the bare <code>HEAD</code> file, and it belongs to no
        branch. Switch to a branch afterward without first running <code>git branch
        rescue-name</code> and that commit becomes unreachable from any ref — still sitting in the
        object database exactly like <code>9f1c9e1&hellip;</code> did above, recoverable via{' '}
        <code>git reflog</code> for a while, but headed for garbage collection if nothing ever points
        at it again. (One naming caveat: modern Git splits <code>checkout</code>&apos;s two unrelated
        jobs into <code>git switch</code> for moving HEAD — <code>git switch --detach &lt;hash&gt;</code>{' '}
        is the above — and <code>git restore</code> for discarding file changes; <code>checkout</code>{' '}
        is not deprecated and Git&apos;s own BreakingChanges document keeps all three, and it is used
        here precisely because it makes the HEAD-file mechanism visible.)
      </p>

      <h2>Quick Reference</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>I want to&hellip;</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Run</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>What it actually does</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>See an object's type</td>
            <td style={{ padding: '0.75rem' }}><code>git cat-file -t &lt;hash&gt;</code></td>
            <td style={{ padding: '0.75rem' }}>Reads the object's header — blob, tree, commit, or tag</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>See an object's content</td>
            <td style={{ padding: '0.75rem' }}><code>git cat-file -p &lt;hash&gt;</code></td>
            <td style={{ padding: '0.75rem' }}>Pretty-prints the raw stored bytes for that type</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Find what commit a branch points at</td>
            <td style={{ padding: '0.75rem' }}><code>git rev-parse &lt;name&gt;</code> (or <code>git show-ref &lt;name&gt;</code>)</td>
            <td style={{ padding: '0.75rem' }}>Asks Git to resolve the ref, whatever storage it lives in. <code>cat .git/refs/heads/&lt;name&gt;</code> shows the same hash <em>only</em> while the ref is still a loose file — see the note below</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Find what HEAD currently resolves to</td>
            <td style={{ padding: '0.75rem' }}><code>git rev-parse HEAD</code>; <code>git symbolic-ref -q HEAD</code> for the branch name</td>
            <td style={{ padding: '0.75rem' }}>Prints the commit hash; <code>symbolic-ref</code> prints <code>refs/heads/&lt;name&gt;</code>, or fails (exit 1) when detached. <code>cat .git/HEAD</code> shows the raw <code>ref: refs/heads/&lt;name&gt;</code> line on the default backend</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Visualize the whole commit DAG</td>
            <td style={{ padding: '0.75rem' }}><code>git log --graph --oneline --all</code></td>
            <td style={{ padding: '0.75rem' }}>Walks every ref's parent pointers and draws the ASCII graph</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Recover a commit orphaned by reset or detached HEAD</td>
            <td style={{ padding: '0.75rem' }}><code>git reflog</code></td>
            <td style={{ padding: '0.75rem' }}>Lists recent hashes HEAD/branches pointed at, even if unreachable now</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="warning" title="Read Refs With Git, Not With cat — the File May Not Be There">
        <p>
          The loose-file demos above are the clearest way to <em>see</em> the model, and everything they
          show is real. But &quot;one ref, one file&quot; is only the storage layout Git happens to start
          with. Run <code>git pack-refs --all</code> (which <code>git gc</code> does for you, and which
          every <code>git clone</code> has already done) and the loose files are deleted, their contents
          folded into a single <code>.git/packed-refs</code> table. Here is the scratch repo from the tag
          section above, one <code>pack-refs</code> later:
        </p>
        <CodeBlock language="bash" title="Same repo at the tag stage, after pack-refs — the ref file is simply gone">
{`$ git pack-refs --all
$ cat .git/refs/heads/main
cat: .git/refs/heads/main: No such file or directory

$ git rev-parse main
7400081f72e20afa0a40bf05d93c751cd719f480
$ git show-ref main
7400081f72e20afa0a40bf05d93c751cd719f480 refs/heads/main

$ cat .git/packed-refs
# pack-refs with: peeled fully-peeled sorted
7400081f72e20afa0a40bf05d93c751cd719f480 refs/heads/main
7400081f72e20afa0a40bf05d93c751cd719f480 refs/tags/lightweight-v1
052e3aa231baf2d2d93feaacfc73c01794b14f9c refs/tags/v1.0
^7400081f72e20afa0a40bf05d93c751cd719f480`}
        </CodeBlock>
        <p>
          <code>git rev-parse</code> and <code>git show-ref</code> keep working because they ask Git to
          resolve the name; <code>cat</code> only works if it guesses the current storage layout right.
          That gap gets permanent with the <strong>reftable</strong> backend
          (<code>git init --ref-format=reftable</code>), a binary format that Git 3.0 makes the default
          for new repositories. There, <code>.git/refs/heads</code> holds no per-branch loose ref files —
          verified on git 2.50.1, it&apos;s a single 41-byte placeholder file (not even a directory)
          reading <code>this repository uses the reftable format</code>, no matter how many branches
          actually exist — and <code>.git/HEAD</code> is a fixed stub reading{' '}
          <code>ref: refs/heads/.invalid</code>, even on a perfectly healthy repo sitting on{' '}
          <code>main</code>, so <code>cat</code> cannot ever report the truth. Verified on git 2.50.1: in
          a reftable repo <code>git rev-parse --symbolic-full-name HEAD</code> correctly printed{' '}
          <code>refs/heads/main</code> while <code>cat .git/HEAD</code> printed the{' '}
          <code>.invalid</code> stub. Use <code>cat</code> to learn the model; use the porcelain
          commands in scripts.
        </p>
      </InfoBox>

      <p>
        With the object model and the pointer files settled, the next lesson builds directly on top of
        this: branching's low cost is a direct consequence of a branch being one small file, and merge
        versus rebase are two different ways of adding commits and rewriting which hash a ref points at.
      </p>

      <InteractiveChallenge
        question={"You run git commit on the main branch. In terms of what actually changes on disk, which is most accurate?"}
        options={[
          "Git rewrites the entire .git/refs/heads/main file's content to be the new commit's hash — a small text-file overwrite, nothing else in prior history is touched",
          "Git recalculates and rewrites every previous commit object to include the new one in a chain",
          "Git creates a brand new 'main' object that replaces the old one",
          "Nothing changes until you run git push"
        ]}
        correctIndex={0}
        explanation={"Demonstrated directly: cat .git/refs/heads/main read 5beb974b7178f5bf3bf709d496e45da77bbf282c before a commit and 9f1c9e163102480f8da2e37ae50aecf75b94cfda after — the file's entire content was overwritten with the new commit hash. Every earlier commit object was untouched; only the small pointer file changed."}
      />

      <InteractiveChallenge
        question={"You copy an existing 50KB file to a brand-new path and commit it unchanged. How much does Git's object store grow?"}
        options={[
          "Another full 50KB — Git always stores a fresh copy per path",
          "Roughly nothing — Git hashes the content, finds a blob with that hash already exists (as demonstrated with two identical app.conf files both hashing to 95c8bb63...), and the new tree entry just references the existing blob",
          "It depends on the file extension",
          "Git refuses to commit an exact duplicate"
        ]}
        correctIndex={1}
        explanation={"Content-addressable storage means the hash is derived purely from content — src/config/app.conf and lib/settings/app.conf, with identical text, both hashed to 95c8bb63928321e7d1793928ceae6211d58a2bd3, and git ls-tree -r HEAD confirmed both paths in the committed tree point at that same single blob object. No duplicate blob was stored."}
      />

      <InteractiveChallenge
        question={"You run git checkout <commit-hash> directly (not a branch name), make a new commit, then git checkout main. What happens to that new commit?"}
        options={[
          "It gets automatically merged into main",
          "Git refuses to let you switch branches until you handle it",
          "It becomes unreachable from any ref — .git/HEAD held the raw hash while detached (verified: cat .git/HEAD printed 1470db8983dc1872872e70e8b45e607e3864dd2b, not a ref: line), so nothing points at the new commit once HEAD moves elsewhere; it's recoverable via git reflog for a while, then eligible for garbage collection",
          "The commit is deleted immediately"
        ]}
        correctIndex={2}
        explanation={"Detached HEAD means HEAD itself holds a commit hash instead of 'ref: refs/heads/<branch>'. Committing there advances only that raw HEAD value. Since no branch ref was ever updated, switching to main leaves the new commit with zero incoming refs — same fate as the reset-away 9f1c9e1 commit shown earlier: still a real object, just unreferenced, and only reflog keeps it findable."}
      />
    </LessonLayout>
  );
}
