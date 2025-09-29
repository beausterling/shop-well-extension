---
allowed-tools: Bash(git checkout:*), Bash(git merge:*), Bash(git branch:*), Bash(git status:*), Bash(git pull:*), Bash(git push:*)
description: Merge current feature branch with main and switch back to main
argument-hint:
---

I'll help you merge your current feature branch with main and switch back to main for continued development.

First, let me check the current branch and status:

!`git branch --show-current`

!`git status`

Let me store the current branch name and ensure all changes are committed:

!`CURRENT_BRANCH=$(git branch --show-current) && echo "Current branch: $CURRENT_BRANCH"`

Now I'll switch to main and ensure it's up to date:

!`git checkout main`

!`git pull origin main`

Merging your feature branch into main:

!`CURRENT_BRANCH=$(git branch --show-current) && FEATURE_BRANCH=$(git for-each-ref --format='%(refname:short)' refs/heads | grep -v main | tail -1) && git merge $FEATURE_BRANCH --no-ff`

!`git status`

Pushing the merged changes to remote:

!`git push origin main`

Cleaning up the feature branch (optional - removes local branch):

!`FEATURE_BRANCH=$(git for-each-ref --format='%(refname:short)' refs/heads | grep -v main | tail -1) && git branch -d $FEATURE_BRANCH`

Merge completed successfully!

What happened:
- Switched to main branch
- Updated main with latest remote changes
- Merged your feature branch using --no-ff (preserves branch history)
- Pushed merged changes to remote main
- Cleaned up the local feature branch
- You're now back on main and ready for the next feature

You can now:
1. Create a new feature branch with `/branch "new-feature-name"`
2. Continue development on main
3. The merged feature is now part of the main branch history