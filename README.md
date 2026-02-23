# Mashed Project

Online party game: players make sounds → others select GIF + caption to match.

## Status
- **Phase**: Initial setup
- **Design Agent**: Running (Kimi Code)
- **DevOps Agent**: Running (Claude Code)
- **Backend Agent**: Pending
- **Frontend Agent**: Pending

## Location
- Local: `/root/.openclaw/workspace/projects/mashed/`
- GitHub: https://github.com/shinramenisbae/mashed
- Tasks: `/root/.openclaw/workspace/projects/mashed/tasks.json`

## Cron Monitoring
- **Job ID**: 8908abda-6d75-48d4-a783-9c7363764e5b
- **Schedule**: Every hour at :00 (Pacific/Auckland)
- **Action**: Check progress, spawn agents for pending tasks

## Game Concept
1. Player A records a sound
2. Sound passed to Player B
3. Player B selects GIF + caption
4. Group votes on best matches

## Tech Stack
- Frontend: React
- Backend: Node.js + WebSocket
- Hosting: Separate VPS (post-local testing)

## Tasks
See tasks.json for full task list (11 tasks total).
