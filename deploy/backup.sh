#!/bin/bash

# This script creates a backup of the PostgreSQL database
# It should be run on the server, typically as a scheduled cron job

# Exit on any error
set -e

# Configuration
BACKUP_DIR="/var/backups/tablify"
CONTAINER_NAME="tablify-postgres"
DB_NAME="tablify"
DB_USER="postgres"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="$BACKUP_DIR/tablify-backup-$TIMESTAMP.sql"
RETENTION_DAYS=14  # Keep backups for 14 days

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create database backup
echo "Creating database backup..."
docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# Compress the backup
echo "Compressing backup..."
gzip $BACKUP_FILE

# Remove old backups
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "tablify-backup-*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed: ${BACKUP_FILE}.gz"

# Optionally, upload to remote storage
# Uncomment and configure the following lines to enable
#
# S3_BUCKET="your-s3-bucket"
# AWS_PROFILE="your-aws-profile"
#
# echo "Uploading backup to S3..."
# aws s3 cp ${BACKUP_FILE}.gz s3://$S3_BUCKET/backups/ --profile $AWS_PROFILE

# Check backup size
BACKUP_SIZE=$(du -h ${BACKUP_FILE}.gz | cut -f1)
echo "Backup size: $BACKUP_SIZE"