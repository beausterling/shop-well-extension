---
allowed-tools: Bash(git stash:*), Bash(git status:*), Bash(git diff:*), Bash(git clean:*), Bash(git ls-files:*)
description: Reset working directory to match the most recent commit, discarding all uncommitted changes
argument-hint:
---

I'll help you safely reset your working directory to match the most recent commit. Your uncommitted changes will be saved to a stash for potential recovery.

**⚠️ WARNING: This will revert your working directory to the last commit state.**

First, let me check what changes will be stashed:

!`git status`

!`git diff --stat`

!`git diff --cached --stat`

Now I'll stash your uncommitted changes with a timestamp for easy recovery:

!`git stash push -u -m "Undo stash: $(date +%Y-%m-%d\ %H:%M:%S)"`

!`git clean -fd`

!`git status`

✅ **Working directory has been reset to match the most recent commit!**

Your changes have been safely saved to the stash. Here's how to recover them if needed:

**Recovery options:**
- `git stash list` - View all saved stashes
- `git stash pop` - Restore the most recent stash and remove it from the stash list
- `git stash apply` - Restore the most recent stash but keep it in the stash list
- `git stash apply stash@{n}` - Restore a specific stash by number

**What was stashed:**
- All modified files (staged and unstaged)
- All untracked files (-u flag)
- Timestamped for easy identification

Your working tree is now clean and matches the last commit.
