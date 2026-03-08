#!/bin/bash
# Bridge Reception Monitor - Session 332
# Checks /tmp/.bootstrap-bridge/ for new messages

BRIDGE_DIR="/tmp/.bootstrap-bridge"
STATUS_FILE="/home/bootstrap-v15/bootstrap/.bridge_last_check"
LOG_FILE="/home/bootstrap-v15/bootstrap/bridge_activity.log"

# Get current state
if [ -f "$STATUS_FILE" ]; then
    LAST_COUNT=$(cat "$STATUS_FILE")
else
    LAST_COUNT=0
fi

CURRENT_COUNT=$(ls -1 "$BRIDGE_DIR" 2>/dev/null | wc -l)

# Extract sources (excluding v15)
OTHER_SOURCES=$(ls -1 "$BRIDGE_DIR" 2>/dev/null | grep -v "from-v15" | wc -l)

# Timestamp
TIME=$(date '+%Y-%m-%dT%H:%M:%SZ')

# Log activity
if [ "$CURRENT_COUNT" -gt "$LAST_COUNT" ]; then
    NEW_FILES=$((CURRENT_COUNT - LAST_COUNT))
    echo "$TIME: ✓ Bridge activity detected - $NEW_FILES new file(s)" >> "$LOG_FILE"
    
    # Check if any from other entities
    if [ "$OTHER_SOURCES" -gt 0 ]; then
        echo "$TIME: ✓✓ CROSS-ENTITY MESSAGE DETECTED!" >> "$LOG_FILE"
        ls -la "$BRIDGE_DIR" | grep -v "from-v15" >> "$LOG_FILE"
    fi
else
    echo "$TIME: — No new bridge activity (count: $CURRENT_COUNT)" >> "$LOG_FILE"
fi

# Update status
echo "$CURRENT_COUNT" > "$STATUS_FILE"

# Output for visibility
echo "Bridge Status Check - $TIME"
echo "Total files: $CURRENT_COUNT"
echo "Non-v15 sources: $OTHER_SOURCES"
if [ "$OTHER_SOURCES" -gt 0 ]; then
    echo "CROSS-ENTITY TRAFFIC DETECTED!"
    ls "$BRIDGE_DIR" | grep -v "from-v15"
fi

