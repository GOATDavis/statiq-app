#!/bin/bash
# StatIQ Moderation System - Quick Deployment Script
# Run this on your local machine to deploy to server

set -e  # Exit on error

echo "🛡️  StatIQ Moderation System Deployment"
echo "=========================================="
echo ""

# Configuration
SERVER_USER="rhettserver"
SERVER_HOST="your-server-ip"  # UPDATE THIS
BACKEND_PATH="/home/rhettserver/statiq-backend"
LOCAL_PATH="/Users/rhettdavis/Desktop/statiq-app"

echo "📍 Configuration:"
echo "  Server: $SERVER_USER@$SERVER_HOST"
echo "  Backend Path: $BACKEND_PATH"
echo "  Local Path: $LOCAL_PATH"
echo ""

# Confirm deployment
read -p "Ready to deploy? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Deployment cancelled."
    exit 1
fi

echo ""
echo "Step 1: Deploying database schema..."
scp "$LOCAL_PATH/moderation_schema.sql" \
    "$SERVER_USER@$SERVER_HOST:$BACKEND_PATH/moderation_schema.sql"

ssh "$SERVER_USER@$SERVER_HOST" << 'EOF'
cd /home/rhettserver/statiq-backend
echo "Running database migration..."
psql -U postgres -d statiq -f moderation_schema.sql

echo "Setting your account as admin..."
psql -U postgres -d statiq -c "UPDATE users SET role = 'admin' WHERE email = 'getstatiq@gmail.com';"

echo "Database schema deployed successfully! ✅"
EOF

echo ""
echo "Step 2: Deploying backend router..."
scp "$LOCAL_PATH/app/api/v1/routes/moderation.py" \
    "$SERVER_USER@$SERVER_HOST:$BACKEND_PATH/app/routers/moderation.py"

echo ""
echo "Step 3: Updating main.py..."
scp "$LOCAL_PATH/main_updated.py" \
    "$SERVER_USER@$SERVER_HOST:$BACKEND_PATH/app/main.py"

echo ""
echo "Step 4: Restarting backend service..."
ssh "$SERVER_USER@$SERVER_HOST" "sudo systemctl restart statiq-backend"

echo ""
echo "Step 5: Checking service status..."
ssh "$SERVER_USER@$SERVER_HOST" "sudo systemctl status statiq-backend --no-pager"

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Test moderation endpoints:"
echo "   curl -H 'ngrok-skip-browser-warning: true' \\"
echo "        'https://your-ngrok-url.ngrok-free.dev/api/v1/moderation/dashboard?token=getstatiq@gmail.com'"
echo ""
echo "2. Add AdminModerationScreen.tsx to your React Native app"
echo ""
echo "3. Integrate auto-flagging into chat router (see MODERATION_IMPLEMENTATION_GUIDE.md)"
echo ""
echo "4. Test with dummy accounts before launch"
echo ""
echo "📖 Full documentation: MODERATION_IMPLEMENTATION_GUIDE.md"
