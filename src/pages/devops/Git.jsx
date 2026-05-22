import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function DevopsGit() {
  return (
    <LessonLayout
      title="Git Workflow"
      sectionId="devops"
      lessonIndex={0}
      prev={{ path: "/testing/bestpractices", label: "Testing Best Practices" }}
      next={{ path: "/devops/branching", label: "Branching Strategies" }}
    >
      <p>Git is the universal version control system. Mastering its core operations — commits, branches, rebasing, and resolving conflicts — is essential for every developer.</p>
      <CodeBlock language="bash" title="Git Essential Commands">
{`# === SETUP ===
git config --global user.name "Alice Smith"
git config --global user.email "alice@example.com"
git config --global core.editor "code --wait"   # VS Code
git config --global pull.rebase true             # rebase by default on pull

# === DAILY WORKFLOW ===
git status                          # see what's changed
git diff                            # unstaged changes
git diff --staged                   # staged changes

git add -p                          # interactive stage — choose hunks
git commit -m "feat: add user authentication"
git commit --amend --no-edit        # fix last commit (before push)

# === BRANCHES ===
git checkout -b feature/user-auth   # create and switch
git switch -c feature/user-auth     # modern syntax
git branch -d feature/user-auth     # delete local (merged)
git branch -D feature/user-auth     # force delete

# === REMOTE ===
git fetch --all --prune             # fetch all remotes, remove stale tracking
git pull --rebase origin main       # fetch + rebase (cleaner history)
git push -u origin feature/auth     # push and set upstream
git push --force-with-lease         # force push safely (fails if remote changed)

# === REBASE ===
git rebase main                     # replay your commits on top of main
git rebase -i HEAD~3                # interactive: squash/reorder last 3 commits
git rebase --abort                  # bail out of a rebase
git rebase --continue               # after resolving conflict

# === UNDOING ===
git restore file.java               # discard unstaged changes
git restore --staged file.java      # unstage (keep changes)
git reset HEAD~1 --soft             # undo last commit, keep staged
git reset HEAD~1 --mixed            # undo last commit, keep unstaged
git reset HEAD~1 --hard             # undo last commit, DISCARD changes
git revert HEAD                     # safe undo — creates new commit

# === USEFUL ===
git log --oneline --graph --all     # visual branch graph
git stash push -m "WIP auth"        # save work in progress
git stash pop                       # restore stash
git cherry-pick abc1234             # apply specific commit to current branch
git bisect start                    # binary search for bug-introducing commit`}
      </CodeBlock>
      <InfoBox variant="tip" title="Commit Message Convention">
        <p>Use Conventional Commits: type(scope): description. Types: feat (new feature), fix (bug fix), refactor, test, docs, chore, perf. Example: "feat(auth): add JWT refresh token rotation". This enables automatic changelog generation and semantic versioning with tools like semantic-release.</p>
      </InfoBox>
      <InteractiveChallenge
        question="What is the difference between git reset --soft and git reset --hard?"
        options={["--soft is faster", "--soft undoes the commit but keeps changes staged; --hard discards all changes permanently", "--hard is the default", "--soft only works on the last commit"]}
        correctIndex={1}
        explanation="git reset --soft HEAD~1 moves HEAD back one commit but leaves your file changes staged — perfect for undoing a commit to rework it. git reset --hard HEAD~1 moves HEAD back and also discards all file changes — use with caution (changes are unrecoverable without git reflog)."
      />

    </LessonLayout>
  );
}
