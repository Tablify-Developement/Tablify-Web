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
REPO_URL="your-git-repo-url"  # Change this to your actual repo URL

echo "Deploying Tablify to $SERVER..."

# Create a temporary deployment directory
DEPLOY_DIR=$(mktemp -d)
echo "Using temporary directory: $DEPLOY_DIR"

# Clone the repository
echo "Cloning repository..."
git clone --depth 1 $REPO_URL $DEPLOY_DIR

# Create .env file from example if needed
if [ -f "$DEPLOY_DIR/.env.example" ] && [ ! -f "$DEPLOY_DIR/.env" ]; then
    echo "Creating .env file from example..."
    cp $DEPLOY_DIR/.env.example $DEPLOY_DIR/.env

    # Prompt for environment variables
    read -p "Enter PostgreSQL password: " db_password
    read -p "Enter JWT secret: " jwt_secret

    # Update .env file
    sed -i "s/your_strong_password/$db_password/g" $DEPLOY_DIR/.env
    sed -i "s/your_jwt_secret_key_change_in_production/$jwt_secret/g" $DEPLOY_DIR/.env
fi

# Compress the deployment package
echo "Creating deployment package..."
DEPLOY_PACKAGE=$(mktemp)
tar -czf $DEPLOY_PACKAGE -C $DEPLOY_DIR .

# Copy the deployment package to the server
echo "Uploading deployment package to server..."
scp $DEPLOY_PACKAGE $SERVER:/tmp/tablify-deploy.tar.gz

# Execute deployment commands on the server
echo "Deploying on server..."
ssh $SERVER << EOF
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

echo "Deployment completed successfully!"