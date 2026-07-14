---
name: External git sync can overwrite in-progress work
description: An outside push (different tool/IDE/repo) landed in this workspace mid-session and replaced files being actively edited.
---

While mid-implementation of a Clerk-auth landing/login flow, the repo's git history advanced several commits from an external source (real author name/email, Vercel deployment config, Supabase auth) without any action from the agent. This replaced package.json deps, app.ts wiring, and added whole new pages/branding that hadn't been discussed in the conversation.

**Why:** the user (or a tool acting on their behalf) can push to the connected git remote independently of the agent session; the workspace reflects the current HEAD, not a snapshot frozen at conversation start.

**How to apply:** if file contents, git log, or package.json look inconsistent with what you last read/wrote — especially after a long edit sequence — run `git log --oneline -15` and diff against expectations before continuing. Don't assume your own edits are the only changes in flight. If a large unexplained divergence is found, stop and surface it to the user with specifics (new commits, new deps, new auth mechanism) rather than silently reconciling or overwriting it.
