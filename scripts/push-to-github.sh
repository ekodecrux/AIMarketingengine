#!/bin/bash
# Auto-push to GitHub after each checkpoint
# Usage: ./scripts/push-to-github.sh "commit message"

set -e

MSG="${1:-Auto-push: $(date '+%Y-%m-%d %H:%M')}"

cd "$(dirname "$0")/.."

# Ensure github remote exists
git remote get-url github 2>/dev/null || git remote add github https://github.com/ekodecrux/AIMarketingengine.git

# Stage any uncommitted changes
git add -A

# Only commit if there are staged changes
if ! git diff --cached --quiet; then
  git commit -m "$MSG"
fi

# Push to GitHub
git push github main

echo "✅ Pushed to GitHub: ekodecrux/AIMarketingengine"
