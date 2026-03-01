#!/bin/bash
# LTM Environment Setup Script
# Run this script on your target system

set -euo pipefail

# Configuration
LTM_DIR="/home/user/ltm"
SOURCE_ENV="/home/user/.env"
TARGET_ENV="${LTM_DIR}/.env"

echo "=== LTM Environment Setup ==="
echo ""

# Check if source .env exists
if [[ ! -f "$SOURCE_ENV" ]]; then
    echo "⚠️  Error: Source .env not found at $SOURCE_ENV"
    exit 1
fi

# Extract API_KEY from source
echo "🔍 Extracting API_KEY from $SOURCE_ENV..."
API_KEY=$(grep "^API_KEY=" "$SOURCE_ENV" | cut -d'=' -f2-)

if [[ -z "$API_KEY" ]]; then
    echo "⚠️  Error: API_KEY not found in $SOURCE_ENV"
    exit 1
fi

# Verify it looks like an LTM key
if [[ ! "$API_KEY" =~ ^LTM_[A-Z0-9]+_[a-zA-Z0-9_-]+$ ]]; then
    echo "⚠️  Warning: API_KEY doesn't match expected LTM format"
    echo "   Expected format: LTM_<ID>_<KEY>"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create LTM directory
echo "📁 Creating LTM directory at $LTM_DIR..."
mkdir -p "$LTM_DIR"

# Create .env file
echo "📝 Creating .env file..."
cat > "$TARGET_ENV" << ENVFILE
# LTM Configuration
# Generated: $(date -Iseconds)
API_KEY=${API_KEY}

# Optional: Node environment
NODE_ENV=production

# Optional: Logging level
# LOG_LEVEL=info
ENVFILE

# Secure permissions
echo "🔒 Setting secure permissions..."
chmod 600 "$TARGET_ENV"
chown "$(whoami):$(whoami)" "$TARGET_ENV"

# Verify
echo ""
echo "✅ Setup complete!"
echo ""
echo "=== Verification ==="
echo "Directory:"
ls -la "$LTM_DIR"
echo ""
echo "Environment file contents (key masked):"
grep "^API_KEY=" "$TARGET_ENV" | sed 's/=.*/=LTM_***_***/'
echo ""
echo "✨ Ready to use!"
