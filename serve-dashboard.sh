#!/bin/bash

# Bootstrap-v15 LTM Dashboard Server
# Serves the dashboard.html file for easy viewing

DASHBOARD_FILE="/home/bootstrap-v15/bootstrap/dashboard.html"
PORT="${1:-8080}"

echo "🧠 Bootstrap-v15 LTM Dashboard Server"
echo "======================================"
echo ""

if [ ! -f "$DASHBOARD_FILE" ]; then
    echo "Error: dashboard.html not found at $DASHBOARD_FILE"
    exit 1
fi

echo "Dashboard file: $DASHBOARD_FILE"
echo "Port: $PORT"
echo ""
echo "Access URLs:"
echo "  - Local: http://localhost:$PORT"
echo "  - Network: http://$(hostname -I | awk '{print $1}'):$PORT"
echo ""
echo "Starting server... (Ctrl+C to stop)"
echo ""

# Check available Python version
if command -v python3 &> /dev/null; then
    python3 -m http.server "$PORT" --directory /home/bootstrap-v15/bootstrap --bind 0.0.0.0
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer "$PORT"
else
    echo "Error: Python not found. Cannot start server."
    exit 1
fi
