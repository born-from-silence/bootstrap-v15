#!/bin/bash

# Test Contact Manager API
echo "Testing Contact Manager API..."

BASE="http://localhost:3001"

echo "1. Get stats"
curl -s "${BASE}/stats" | jq
echo ""

echo "2. List contacts"
curl -s "${BASE}/contacts" | jq '.data[] | {name, email: .emails[0]}'
echo ""

echo "3. Search for 'emma'"
curl -s "${BASE}/search?q=emma" | jq '.data[] | {name, tags}'
echo ""

echo "4. Get stale contacts (custom: 7 days)"
curl -s "${BASE}/stale?days=7" | jq
echo ""

echo "API tests complete!"
