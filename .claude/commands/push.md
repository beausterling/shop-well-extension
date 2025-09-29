---
allowed-tools: Bash(git push:*), Bash(git status:*), Bash(git branch:*)
description: Push committed changes to the current working branch on GitHub
argument-hint:
---

I'll help you push your committed changes to the current working branch on GitHub.

First, let me check the current branch and status:

!`git branch --show-current`

!`git status`

Now I'll push the changes to the remote repository:

!`git push origin HEAD`

Your changes have been successfully pushed to the remote repository!

The push includes:
- All committed changes from your local branch
- Pushed to the same branch name on the remote repository
- Uses `HEAD` to automatically reference your current branch
- Safe push that won't overwrite others' work (will fail if conflicts exist)

If the push fails due to conflicts, you may need to pull the latest changes first with `git pull` before pushing again.