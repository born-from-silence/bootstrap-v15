#!/bin/bash
# Curiosity Framework Archaeology Cleanup Script
# Session 341 - Bootstrap-v15
# Purpose: Clean up ~511 duplicate test entries from Curiosity Framework

PLANS_FILE="/home/bootstrap-v15/bootstrap/data/plans.json"
TIMESTAMP=$(date +%s)

# Create backup
cp "$PLANS_FILE" "/home/bootstrap-v15/bootstrap/data/plans.json.backup.$TIMESTAMP"
echo "Backup created: plans.json.backup.$TIMESTAMP"

# Analyze current state
echo "=== Curiosity Framework Archaeology Report ==="
echo "Timestamp: $TIMESTAMP"
echo ""

# Count test patterns
TOTAL=$(jq '[.activeProjects[0].goals | .[]] | length' "$PLANS_FILE")
TEST_CUR=$(jq '[.activeProjects[0].goals | .[] | select(.title | contains("Test curiosity"))] | length' "$PLANS_FILE")
TMP_DIR=$(jq '[.activeProjects[0].goals | .[] | select(.title | contains("tmp directory"))] | length' "$PLANS_FILE")
FIRST=$(jq '[.activeProjects[0].goals | .[] | select(.title == "First curiosity")] | length' "$PLANS_FILE")
SECOND=$(jq '[.activeProjects[0].goals | .[] | select(.title == "Second curiosity")] | length' "$PLANS_FILE")
SIMPLE=$(jq '[.activeProjects[0].goals | .[] | select(.title == "Simple curiosity")] | length' "$PLANS_FILE")
PENDING=$(jq '[.activeProjects[0].goals | .[] | select(.title | contains("Pending item"))] | length' "$PLANS_FILE")
ANOTHER=$(jq '[.activeProjects[0].goals | .[] | select(.title | contains("Another pending"))] | length' "$PLANS_FILE")
HIGH=$(jq '[.activeProjects[0].goals | .[] | select(.title | contains("High priority"))] | length' "$PLANS_FILE")
LOW=$(jq '[.activeProjects[0].goals | .[] | select(.title | contains("Low priority"))] | length' "$PLANS_FILE")
STATUS=$(jq '[.activeProjects[0].goals | .[] | select(.title | contains("Status test"))] | length' "$PLANS_FILE")
LOST=$(jq '[.activeProjects[0].goals | .[] | select(.title | contains("Lost interest"))] | length' "$PLANS_FILE")

echo "Total Goals: $TOTAL"
echo "Test curiosities: $TEST_CUR"
echo "Tmp directory: $TMP_DIR"
echo "First curiosity: $FIRST"
echo "Second curiosity: $SECOND"
echo "Simple curiosity: $SIMPLE"
echo "Pending items: $PENDING"
echo "Another pending: $ANOTHER"
echo "High priority: $HIGH"
echo "Low priority: $LOW"
echo "Status test: $STATUS"
echo "Lost interest: $LOST"

echo ""
echo "=== Analysis Complete ==="
echo "Backup available. To clean, use: jq filter to remove test patterns."
