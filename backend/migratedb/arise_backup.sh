#!/bin/bash

# ==============================================================================
# PostgreSQL Database Backup Script with Rotation
# ==============================================================================
# This script creates a compressed database backup and keeps only the 
# specified number of most recent backup files.
#
# Cron Job Setup (Runs everyday at 2am):
# Run `EDITOR=nano crontab -e` and add the following line:
# 0 2 * * * /usr/local/bin/arise_backup.sh >> /var/log/arise_backup.log 2>&1
# ==============================================================================

# --- Configuration ---
DB_NAME="arise"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
export PGPASSWORD="user"

# The directory where backups will be stored
BACKUP_DIR="/var/backups/arise"

# Number of backup files to keep (Rotation)
MAX_BACKUPS=7

# --- Execution ---
# Exit on any error
set -e

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Generate backup filename based on current timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_${TIMESTAMP}.sql.gz"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting backup of database '$DB_NAME'..."

# Perform the backup
# Note: For password authentication, configure a ~/.pgpass file for the cron user:
# hostname:port:database:username:password
# Do not hardcode passwords in this script for security reasons.
#
# If you need host/port, uncomment and add: -h "$DB_HOST" -p "$DB_PORT"
pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup successful: $BACKUP_FILE"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Rotating backups: keeping only the $MAX_BACKUPS most recent files..."

# Go to backup directory
cd "$BACKUP_DIR" || exit

# Count total backup files
TOTAL_FILES=$(ls -1 "${DB_NAME}_backup_"*.sql.gz 2>/dev/null | wc -l)

if [ "$TOTAL_FILES" -gt "$MAX_BACKUPS" ]; then
    # Calculate how many old files we need to delete
    DELETE_COUNT=$((TOTAL_FILES - MAX_BACKUPS))
    
    # List files sorted by time (oldest first), grab the oldest $DELETE_COUNT files, and delete them
    ls -1tr "${DB_NAME}_backup_"*.sql.gz 2>/dev/null | head -n "$DELETE_COUNT" | xargs rm -f
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Deleted $DELETE_COUNT old backup(s)."
else
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Only $TOTAL_FILES backup(s) exist. No rotation needed."
fi

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup process complete."
