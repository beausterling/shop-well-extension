---
allowed-tools: Bash(git add:*), Bash(git commit:*), Bash(git status:*), Bash(git diff:*)
description: Stage all changes and create a git commit with best practices
argument-hint: [commit message]
---

I'll help you stage all changes and create a git commit following best practices.

First, let me check the current status and show you what will be committed:

!`git status`

!`git diff --cached`

!`git diff`

Now I'll stage all changes and create a commit with your message:

!`git add -A`

!`git commit -m "$ARGUMENTS

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"`

!`git status`

Your changes have been committed successfully! The commit includes:
- All modified files have been staged
- All new files have been added
- All deleted files have been removed from tracking
- Commit message: "$ARGUMENTS"
- Includes Claude Code signature for traceability

Use `/push` to push these changes to the remote repository.