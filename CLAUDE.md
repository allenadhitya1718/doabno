# Instructions for AI assistants working in this repo

1. **Read `ROADMAP.md` first, every session.** Files and folders listed under "In progress" belong to someone else right now. Do not edit, reformat, move or delete them, even to fix something small. If you think a change is needed there, add a line under "Requests" in `ROADMAP.md` instead and work on something unclaimed.
2. **Claim before you start:** add a row for your files to `ROADMAP.md`, commit and push it first, then do the work. When done, move it to "Done" and push.
3. `git pull` before you begin and push small commits often. Never force-push, and never rewrite history on `redesign-v2` or `main`.
4. Do not push to `main` unless the user explicitly asks.
5. Do not commit secrets. The Supabase publishable (anon) key may be in `assets/config.js`; a `service_role` key, database password or any API secret must never be in the repo.
