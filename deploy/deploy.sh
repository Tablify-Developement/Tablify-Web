#!/bin/bash

# This script deploys the Tablify application to a VPS
# It should be run from your local machine
# Usage: ./deploy.sh username@your-server-ip

# Exit on any error
set -e

# Check if server address is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 username@server-ip-or-domain"
    exit 1
fi

SERVER=$1
APP_DIR="/opt/tablify"
REPO_URL="https://github.com/Tablify-Developement/Tablify-Web.git"
BRANCH="production"

echo "Deploying Tablify to $SERVER from $BRANCH branch..."

# Create a temporary deployment directory
DEPLOY_DIR=$(mktemp -d)
echo "Using temporary directory: $DEPLOY_DIR"

# Clone the repository with specific branch
echo "Cloning repository from $BRANCH branch..."
git clone --depth 1 --branch $BRANCH $REPO_URL $DEPLOY_DIR

# Create .env file from example if needed
if [ -f "$DEPLOY_DIR/.env.example" ] && [ ! -f "$DEPLOY_DIR/.env" ]; then
    echo "Creating .env file from example..."
    cp $DEPLOY_DIR/.env.example $DEPLOY_DIR/.env

    # Prompt for environment variables
    read -p "Enter PostgreSQL password: " db_password
    read -p "Enter JWT secret: " jwt_secret
    read -p "Enter API URL (e.g., https://api.yourdomain.com/api): " api_url

    # Update .env file
    sed -i "s/your_strong_password/$db_password/g" $DEPLOY_DIR/.env
    sed -i "s/your_jwt_secret_key_change_in_production/$jwt_secret/g" $DEPLOY_DIR/.env
    sed -i "s|http://localhost:3001/api|$api_url|g" $DEPLOY_DIR/.env
fi

# Compress the deployment package
echo "Creating deployment package..."
cd $DEPLOY_DIR/backend
npm install
cd ../..
DEPLOY_PACKAGE=$(mktemp)
tar -czf $DEPLOY_PACKAGE -C $DEPLOY_DIR .

# Copy the deployment package to the server
echo "Uploading deployment package to server..."
scp -P 49152 $DEPLOY_PACKAGE $SERVER:/tmp/tablify-deploy.tar.gz

# Execute deployment commands on the server
echo "Deploying on server..."
ssh -p 49152 $SERVER << EOF
  # Stop any running containers
  if [ -d "$APP_DIR" ] && [ -f "$APP_DIR/docker-compose.yml" ]; then
    cd $APP_DIR
    docker-compose down
  else
    mkdir -p $APP_DIR
  fi

  # Extract the new code
  tar -xzf /tmp/tablify-deploy.tar.gz -C $APP_DIR

  # Start the application
  cd $APP_DIR
  docker-compose build
  docker-compose up -d

  # Clean up
  rm /tmp/tablify-deploy.tar.gz
EOF

# Clean up local temporary files
echo "Cleaning up temporary files..."
rm $DEPLOY_PACKAGE
rm -rf $DEPLOY_DIR

echo "Deployment to $BRANCH branch completed successfully!"