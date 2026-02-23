#!/bin/bash
# Progress checker for Mashed project

PROJECT_DIR="/root/.openclaw/workspace/projects/mashed"
TASKS_FILE="$PROJECT_DIR/tasks.json"

echo "Checking Mashed project progress at $(date)"

# Check if tasks.json exists
if [ ! -f "$TASKS_FILE" ]; then
    echo "ERROR: tasks.json not found"
    exit 1
fi

# Count tasks by status
PENDING=$(cat "$TASKS_FILE" | grep -o '"status": "pending"' | wc -l)
RUNNING=$(cat "$TASKS_FILE" | grep -o '"status": "running"' | wc -l)
COMPLETED=$(cat "$TASKS_FILE" | grep -o '"status": "completed"' | wc -l)
BLOCKED=$(cat "$TASKS_FILE" | grep -o '"status": "blocked"' | wc -l)

echo "Status: $COMPLETED completed, $RUNNING running, $PENDING pending, $BLOCKED blocked"

# If all tasks complete, we're done
if [ "$PENDING" -eq 0 ] && [ "$RUNNING" -eq 0 ] && [ "$BLOCKED" -eq 0 ]; then
    echo "✅ All tasks completed!"
    # Could send notification here
    exit 0
fi

# Check for stalled tasks (running for >2 hours without update)
# This would need timestamp tracking - simplified for now

# If tasks are stuck/blocked, respawn relevant agents
echo "Project in progress. Next check in 1 hour."
