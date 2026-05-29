import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Git() {
  return (
    <LessonLayout
      title="Git Commands Cheat Sheet"
      sectionId="devops"
      lessonIndex={0}
      prev={null}
      next={{ path: '/devops/branching', label: 'Branching Strategies' }}
    >
      <h2>Setup &amp; Configuration</h2>
      <p>
        First-day essentials: configure your identity, initialize repos, and clone existing projects.
      </p>

      <CodeBlock language="bash" title="Initial Setup">
{`# Set your identity (use --global for all repos)
git config --global user.name "Your Name"
git config --global user.email "you@company.com"

# Useful global settings
git config --global core.editor "code --wait"
git config --global init.defaultBranch main
git config --global pull.rebase true
git config --global fetch.prune true

# Initialize a new repo
git init my-project

# Clone an existing repo
git clone https://github.com/org/repo.git
git clone git@github.com:org/repo.git --depth 1  # shallow clone`}
      </CodeBlock>

      <h2>Staging &amp; Unstaging</h2>
      <p>
        The staging area (index) is where you craft your next commit. Master these commands to
        control exactly what goes into each commit.
      </p>

      <CodeBlock language="bash" title="Staging Commands">
{`# Stage specific files
git add src/main.js src/utils.js

# Stage all changes in current directory
git add .

# Stage hunks interactively (choose which parts of a file to stage)
git add -p

# Unstage a file (keep changes in working directory)
git reset HEAD src/main.js
git restore --staged src/main.js   # modern equivalent

# Stash changes for later
git stash                          # stash tracked files
git stash -u                       # include untracked files
git stash push -m "WIP: feature"   # named stash
git stash list                     # see all stashes
git stash pop                      # apply and remove latest stash
git stash apply stash@{2}          # apply specific stash, keep it
git stash drop stash@{0}           # remove a stash`}
      </CodeBlock>

      <InfoBox variant="tip" title="Interactive Add">
        <code>git add -p</code> lets you stage individual hunks within a file. This is the
        secret to clean, atomic commits. Use <code>s</code> to split hunks further, <code>y</code> to
        stage, <code>n</code> to skip.
      </InfoBox>

      <h2>Committing</h2>
      <p>
        Commits are the building blocks of your project history. Write clear messages and
        keep commits focused on a single logical change.
      </p>

      <CodeBlock language="bash" title="Commit Commands">
{`# Commit staged changes
git commit -m "feat: add user authentication"

# Stage all tracked files and commit in one step
git commit -am "fix: resolve null pointer in parser"

# Amend the last commit (message or content)
git commit --amend -m "feat: add user authentication with OAuth"
git commit --amend --no-edit   # add staged changes, keep message

# Revert a commit (creates a new undo commit)
git revert abc1234
git revert HEAD~3              # revert 3 commits back

# Cherry-pick a commit from another branch
git cherry-pick abc1234
git cherry-pick abc1234 --no-commit   # stage changes without committing`}
      </CodeBlock>

      <h2>Branching &amp; Merging</h2>

      <CodeBlock language="bash" title="Branch Operations">
{`# List branches
git branch           # local branches
git branch -r        # remote branches
git branch -a        # all branches

# Create and switch to a new branch
git checkout -b feature/login
git switch -c feature/login    # modern equivalent

# Switch branches
git checkout main
git switch main                # modern equivalent

# Merge a branch into current
git merge feature/login
git merge --no-ff feature/login   # force merge commit

# Rebase current branch onto main
git rebase main
git rebase -i HEAD~5              # interactive rebase last 5 commits

# Delete branches
git branch -d feature/login       # safe delete (merged only)
git branch -D feature/login       # force delete
git push origin --delete feature/login   # delete remote branch`}
      </CodeBlock>

      <h2>Remote Operations</h2>

      <CodeBlock language="bash" title="Working with Remotes">
{`# List remotes
git remote -v

# Add a remote
git remote add upstream https://github.com/original/repo.git

# Fetch updates (download but don't merge)
git fetch origin
git fetch --all             # fetch from all remotes

# Pull (fetch + merge/rebase)
git pull origin main
git pull --rebase origin main

# Push
git push origin feature/login
git push -u origin feature/login   # set upstream tracking
git push --force-with-lease         # safe force push (won't overwrite others' work)

# Sync fork with upstream
git fetch upstream
git merge upstream/main`}
      </CodeBlock>

      <InfoBox variant="warning" title="Never git push --force">
        Always use <code>--force-with-lease</code> instead of <code>--force</code>. It
        refuses to push if someone else has pushed commits you haven&apos;t seen, preventing
        you from accidentally overwriting their work.
      </InfoBox>

      <h2>Inspection &amp; History</h2>

      <CodeBlock language="bash" title="Inspecting History">
{`# View commit log
git log --oneline --graph --all
git log --oneline -20                 # last 20 commits
git log --author="Your Name" --since="2 weeks ago"
git log -- src/auth/                  # commits touching a directory

# Diff changes
git diff                              # unstaged changes
git diff --staged                     # staged changes
git diff main..feature/login          # branch comparison
git diff HEAD~3..HEAD -- src/api.js   # specific file over last 3 commits

# Blame (who changed each line)
git blame src/main.js
git blame -L 50,70 src/main.js       # specific line range

# Show a specific commit
git show abc1234
git show HEAD:src/main.js             # file at specific commit

# Reflog (your safety net)
git reflog                            # shows all HEAD movements
git checkout HEAD@{5}                 # recover a previous state`}
      </CodeBlock>

      <InfoBox variant="danger" title="Reflog Is Your Safety Net">
        Accidentally deleted a branch or did a bad rebase? <code>git reflog</code> shows every
        position HEAD has been in. Find the commit hash before your mistake and
        use <code>git reset --hard HEAD@&#123;N&#125;</code> to recover.
      </InfoBox>

      <h2>Cleanup</h2>

      <CodeBlock language="bash" title="Cleanup Commands">
{`# Remove untracked files
git clean -n          # dry run (see what would be deleted)
git clean -fd         # force delete untracked files and directories

# Prune stale remote-tracking branches
git remote prune origin

# Garbage collection (optimize repo)
git gc --aggressive

# Remove file from tracking but keep on disk
git rm --cached secrets.env`}
      </CodeBlock>

      <h2>Advanced: Interactive Rebase</h2>
      <p>
        Interactive rebase is the most powerful tool for cleaning up commit history before merging.
      </p>

      <FlowChart
        title="Interactive Rebase Workflow"
        chart={"graph TD\nA[Start: git rebase -i HEAD~N] --> B[Editor opens with commit list]\nB --> C{Choose action per commit}\nC --> D[pick - keep as-is]\nC --> E[reword - change message]\nC --> F[squash - combine with previous]\nC --> G[fixup - combine, discard message]\nC --> H[edit - pause to amend]\nC --> I[drop - remove commit]\nD --> J[Save and close editor]\nE --> J\nF --> J\nG --> J\nH --> J\nI --> J\nJ --> K[Git replays commits with changes]\nK --> L[Resolve conflicts if any]\nL --> M[git rebase --continue]\nM --> N[Clean history ready for PR]"}
      />

      <CodeBlock language="bash" title="Interactive Rebase Example">
{`# Rebase last 4 commits
git rebase -i HEAD~4

# Editor shows:
# pick abc1234 feat: add login form
# pick def5678 fix typo
# pick ghi9012 WIP debugging
# pick jkl3456 feat: add validation

# Change to:
# pick abc1234 feat: add login form
# fixup def5678 fix typo
# drop ghi9012 WIP debugging
# pick jkl3456 feat: add validation

# Result: clean 2-commit history`}
      </CodeBlock>

      <h2>Advanced: Bisect, Worktree &amp; Subtree</h2>

      <CodeBlock language="bash" title="Advanced Commands">
{`# Bisect: find the commit that introduced a bug
git bisect start
git bisect bad                 # current commit has the bug
git bisect good v1.2.0         # this tag was known good
# Git checks out a middle commit — test and mark:
git bisect good                # or git bisect bad
# Repeat until Git finds the culprit
git bisect reset               # return to original state

# Worktree: work on multiple branches simultaneously
git worktree add ../hotfix-branch hotfix/urgent-fix
git worktree list
git worktree remove ../hotfix-branch

# Subtree: include another repo inside yours
git subtree add --prefix=lib/shared https://github.com/org/shared.git main --squash
git subtree pull --prefix=lib/shared https://github.com/org/shared.git main --squash`}
      </CodeBlock>

      <h2>Recommended Git Aliases</h2>

      <CodeBlock language="bash" title="Productivity Aliases">
{`# Add these to your ~/.gitconfig under [alias]
git config --global alias.st "status -sb"
git config --global alias.co "checkout"
git config --global alias.br "branch"
git config --global alias.ci "commit"
git config --global alias.lg "log --oneline --graph --all --decorate"
git config --global alias.last "log -1 HEAD --stat"
git config --global alias.unstage "reset HEAD --"
git config --global alias.undo "reset --soft HEAD~1"
git config --global alias.amend "commit --amend --no-edit"
git config --global alias.wip "stash push -m 'WIP'"
git config --global alias.aliases "config --get-regexp alias"`}
      </CodeBlock>

      <InteractiveChallenge
        question={"You committed sensitive credentials in your last commit (not yet pushed). What's the safest way to remove it?"}
        options={[
          "git revert HEAD",
          "git reset --soft HEAD~1, then fix and recommit",
          "git push --force",
          "Delete the file and commit again"
        ]}
        correctIndex={1}
        explanation={"git reset --soft HEAD~1 moves HEAD back one commit but keeps your changes staged. You can then remove the sensitive file, update .gitignore, and create a clean commit. git revert would still keep the credentials in history."}
        language="bash"
      />

      <InfoBox variant="note" title="Commit Message Convention">
        Most teams use Conventional Commits: <code>type(scope): description</code>.
        Common types: <code>feat</code>, <code>fix</code>, <code>docs</code>, <code>style</code>,
        <code>refactor</code>, <code>test</code>, <code>chore</code>, <code>ci</code>.
        Example: <code>feat(auth): add OAuth2 login flow</code>.
      </InfoBox>
    </LessonLayout>
  );
}

export default function GitPage() {
  return <Git />;
}
