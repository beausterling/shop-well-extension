---
allowed-tools: Bash(git branch:*), Bash(git checkout:*), Bash(git status:*), Bash(git pull:*)
description: Create a new branch and switch to it for feature development
argument-hint: [branch-name]
---

I'll help you create a new branch and switch to it for development work.

First, let me check the current status and ensure we're up to date:

!`git status`

!`git branch --show-current`

Now I'll make sure we have the latest changes from the main branch:

!`git fetch origin`

!`git pull origin main`

Creating and switching to your new branch:

!`git checkout -b $ARGUMENTS`

!`git status`

!`git branch --show-current`

Perfect! Your new branch has been created and you're now working on it.

Branch setup complete:
- Created new branch: "$ARGUMENTS"
- Switched to the new branch
- Branch is based on the latest main branch
- Ready for feature development

You can now:
1. Make your changes and commit them with `/commit "message"`
2. Push your branch with `/push`
3. When ready, merge back to main with `/merge`