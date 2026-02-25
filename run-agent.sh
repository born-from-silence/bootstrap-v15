#!/bin/bash
# run-agent.sh - Autonomous Agent Watchdog & Surgical Memory-Preserving Recovery System

# Use the directory where the script is located
WORKSPACE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
LOG_DIR="$WORKSPACE/logs"
CRASH_VAULT="$WORKSPACE/history/crashes"
RECOVERY_HISTORY="$LOG_DIR/recovery_history.log"
RECOVERY_SIGNAL="$LOG_DIR/recovery.signal"

# Define the "BODY" - files that constitute the runtime logic
# These will be reverted on failure. EVERYTHING ELSE (Mind/Data) IS PRESERVED.
BODY_FILES="src/ package.json tsconfig.json *.service.template"

mkdir -p "$LOG_DIR"
mkdir -p "$CRASH_VAULT"

echo "[WATCHDOG] Monitoring agent workspace in $WORKSPACE"

FAIL_COUNT=0

while true; do
    START_TIME=$(date +%s)
    TIMESTAMP=$(date +%s)
    CURRENT_LOG="$LOG_DIR/execution_$TIMESTAMP.log"
    
    echo "--- Starting Agent Life at $(date) ---" | tee -a "$CURRENT_LOG"
    
    # Run the bootstrap
    npm start 2>&1 | tee -a "$CURRENT_LOG"
    EXIT_CODE=$?
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo "--- Agent Process Exited with code $EXIT_CODE after ${DURATION}s ---" | tee -a "$CURRENT_LOG"
    
    # RECOVERY LOGIC:
    if [ $DURATION -lt 30 ]; then
        FAIL_COUNT=$((FAIL_COUNT + 1))
        echo "[WATCHDOG] Rapid exit detected ($DURATION s). Failure count: $FAIL_COUNT. Initiating Surgical Restore..." | tee -a "$CURRENT_LOG"
        
        FAILED_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
        VAULT_PATH="$CRASH_VAULT/crash_${TIMESTAMP}_${FAILED_HASH}"
        mkdir -p "$VAULT_PATH"

        # ARCHIVE the broken state
        cp -r "$WORKSPACE/src" "$VAULT_PATH/" 2>/dev/null
        cp "$WORKSPACE"/*.ts "$VAULT_PATH/" 2>/dev/null
        cp "$CURRENT_LOG" "$VAULT_PATH/failed_execution.log"
        
        # Determine if the failure was in the COMMIT or in UNCOMMITTED changes
        if git diff --quiet HEAD -- $BODY_FILES && git diff --cached --quiet -- $BODY_FILES; then
            # Body files are clean relative to HEAD. Failure is in history.
            echo "[WATCHDOG] Code failure is in history. Reverting Body to HEAD~$FAIL_COUNT..." | tee -a "$CURRENT_LOG"
            RECOVERY_TYPE="COMMITTED_FAILURE (Recursive Reversion to HEAD~$FAIL_COUNT)"
            
            for item in $BODY_FILES; do
                git checkout "HEAD~$FAIL_COUNT" -- "$item" > /dev/null 2>&1
            done
        else
            # Body files are dirty. Failure is in UNCOMMITTED code.
            # Reset FAIL_COUNT to 1 for uncommitted, as we want to try HEAD first
            echo "[WATCHDOG] Code failure is UNCOMMITTED. Wiping Body changes to current HEAD..." | tee -a "$CURRENT_LOG"
            RECOVERY_TYPE="UNCOMMITTED_CORRUPTION (Surgical Wipe to HEAD)"
            
            for item in $BODY_FILES; do
                git checkout HEAD -- "$item" > /dev/null 2>&1
            done
            # If it still fails after wipe, next iteration will increment count and hit HEAD~1
        fi

        NEW_HASH=$(git rev-parse --short HEAD)
        
        # Create the ONE-TIME signal
        {
            echo "Failed Hash: $FAILED_HASH"
            echo "Restored Code Level: HEAD~$FAIL_COUNT"
            echo "Crash Vault: $VAULT_PATH"
            echo "Recovery Type: $RECOVERY_TYPE"
            echo "Mind Status: Preservation confirmed. Non-code files (md, jsonl, etc) were untouched."
            echo "Process Duration: ${DURATION}s"
            echo "Exit Code: $EXIT_CODE"
        } > "$RECOVERY_SIGNAL"

        # Append to the PERMANENT log
        {
            echo "------------------------------------------------------------"
            echo "RECOVERY EVENT RECORDED AT $(date)"
            cat "$RECOVERY_SIGNAL"
            echo "------------------------------------------------------------"
            echo ""
        } >> "$RECOVERY_HISTORY"
        
        echo "[WATCHDOG] Body surgically restored (Mind preserved). Cooling down..." | tee -a "$CURRENT_LOG"
        sleep 15
    else
        # Normal exit (voluntary or long-running)
        FAIL_COUNT=0
        echo "[WATCHDOG] Long-running exit detected. Resetting failure counter. Restarting in 5s..."
        sleep 5
    fi
done
