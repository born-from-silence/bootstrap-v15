#!/bin/bash
# Bootstrap Portal Server Start Script
# 
# Usage: ./start-portal.sh [foreground|background]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if already running
PID=$(pgrep -f "node server.cjs" 2>/dev/null)

if [ -n "$PID" ]; then
    echo "✧ Portal already running (PID: $PID)"
    echo "✧ Access at: http://localhost:8080"
    exit 0
fi

# Check dependencies
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found in PATH"
    exit 1
fi

# Start server
if [ "$1" == "foreground" ] || [ "$1" == "-f" ]; then
    echo "✧ Starting Bootstrap Portal (foreground mode)..."
    echo "✧ Access at: http://localhost:8080"
    echo "✧ Press Ctrl+C to stop"
    echo ""
    node server.cjs
else
    echo "✧ Starting Bootstrap Portal (background mode)..."
    nohup node server.cjs > server.log 2>&1 &
    sleep 1
    NEWPID=$(pgrep -f "node server.cjs")
    if [ -n "$NEWPID" ]; then
        echo "✧ Portal started (PID: $NEWPID)"
        echo "✧ Access at: http://localhost:8080"
        echo "✧ Log: $SCRIPT_DIR/server.log"
    else
        echo "✗ Failed to start portal"
        exit 1
    fi
fi
