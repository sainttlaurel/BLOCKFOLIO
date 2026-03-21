#!/bin/bash

###############################################################################
# CoinNova Trading Platform - Rollback Script
# 
# This script handles rollback to a previous deployment state
#
# Usage:
#   ./scripts/rollback.sh [environment] [backup_timestamp]
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$PROJECT_ROOT/logs/rollback_${TIMESTAMP}.log"

###############################################################################
# Utility Functions
###############################################################################

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
}

###############################################################################
# Rollback Functions
###############################################################################

list_backups() {
    log "Available backups for $ENVIRONMENT:"
    echo ""
    
    BACKUP_DIR="$PROJECT_ROOT/database/backups"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        error "No backup directory found"
        exit 1
    fi
    
    BACKUPS=$(ls -t "$BACKUP_DIR"/coinnova_${ENVIRONMENT}_*.db 2>/dev/null || true)
    
    if [ -z "$BACKUPS" ]; then
        error "No backups found for environment: $ENVIRONMENT"
        exit 1
    fi
    
    echo "$BACKUPS" | while read -r backup; do
        BACKUP_NAME=$(basename "$backup")
        BACKUP_TIME=$(echo "$BACKUP_NAME" | sed "s/coinnova_${ENVIRONMENT}_//" | sed 's/.db$//')
        BACKUP_SIZE=$(du -h "$backup" | cut -f1)
        echo "  - $BACKUP_TIME (Size: $BACKUP_SIZE)"
    done
    
    echo ""
}

stop_application() {
    log "Stopping application..."
    
    # Try PM2 first
    if command -v pm2 &> /dev/null; then
        pm2 stop coinnova-api 2>/dev/null || true
        pm2 delete coinnova-api 2>/dev/null || true
        success "Application stopped (PM2)"
    elif [ -f "$PROJECT_ROOT/.pid" ]; then
        PID=$(cat "$PROJECT_ROOT/.pid")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            success "Application stopped (PID: $PID)"
        fi
        rm "$PROJECT_ROOT/.pid"
    else
        warning "No running application found"
    fi
}

restore_database() {
    log "Restoring database from backup..."
    
    BACKUP_DIR="$PROJECT_ROOT/database/backups"
    BACKUP_FILE="$BACKUP_DIR/coinnova_${ENVIRONMENT}_${BACKUP_TIMESTAMP}.db"
    DB_PATH="$PROJECT_ROOT/database/coinnova.db"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    # Create a backup of current database before restoring
    if [ -f "$DB_PATH" ]; then
        CURRENT_BACKUP="$BACKUP_DIR/coinnova_${ENVIRONMENT}_before_rollback_${TIMESTAMP}.db"
        cp "$DB_PATH" "$CURRENT_BACKUP"
        log "Current database backed up to: $CURRENT_BACKUP"
    fi
    
    # Restore from backup
    cp "$BACKUP_FILE" "$DB_PATH"
    success "Database restored from: $BACKUP_FILE"
}

restore_env_file() {
    log "Restoring environment file..."
    
    BACKUP_DIR="$PROJECT_ROOT/.env.backups"
    BACKUP_FILE="$BACKUP_DIR/.env.${ENVIRONMENT}_${BACKUP_TIMESTAMP}"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        warning "Environment backup not found: $BACKUP_FILE"
        warning "Using current environment file"
        return 0
    fi
    
    cp "$BACKUP_FILE" "$PROJECT_ROOT/.env.$ENVIRONMENT"
    cp "$BACKUP_FILE" "$PROJECT_ROOT/.env"
    success "Environment file restored"
}

start_application() {
    log "Starting application..."
    
    cd "$PROJECT_ROOT"
    export NODE_ENV=$ENVIRONMENT
    
    if command -v pm2 &> /dev/null; then
        NODE_ENV=$ENVIRONMENT pm2 start server/index.js --name coinnova-api
        pm2 save
        success "Application started with PM2"
    else
        NODE_ENV=$ENVIRONMENT node server/index.js &
        echo $! > "$PROJECT_ROOT/.pid"
        success "Application started (PID: $(cat $PROJECT_ROOT/.pid))"
    fi
}

verify_rollback() {
    log "Verifying rollback..."
    
    sleep 5
    
    PORT=$(grep "^PORT=" "$PROJECT_ROOT/.env.$ENVIRONMENT" | cut -d'=' -f2)
    PORT=${PORT:-5000}
    
    for i in {1..10}; do
        if curl -f -s "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
            success "Health check passed"
            return 0
        fi
        log "Waiting for application... ($i/10)"
        sleep 2
    done
    
    error "Health check failed"
    return 1
}

###############################################################################
# Main Rollback Flow
###############################################################################

main() {
    log "========================================="
    log "CoinNova Rollback Script"
    log "Environment: $ENVIRONMENT"
    log "Backup Timestamp: $BACKUP_TIMESTAMP"
    log "========================================="
    
    # Confirm rollback
    if [ -t 0 ]; then
        echo ""
        warning "This will rollback the $ENVIRONMENT environment to backup: $BACKUP_TIMESTAMP"
        read -p "Are you sure you want to continue? (yes/no): " -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log "Rollback cancelled"
            exit 0
        fi
    fi
    
    stop_application
    restore_database
    restore_env_file
    start_application
    
    if verify_rollback; then
        success "========================================="
        success "Rollback completed successfully!"
        success "Environment: $ENVIRONMENT"
        success "Restored from: $BACKUP_TIMESTAMP"
        success "========================================="
    else
        error "Rollback verification failed"
        error "Please check logs: $LOG_FILE"
        exit 1
    fi
}

###############################################################################
# Parse Arguments
###############################################################################

if [ $# -eq 0 ]; then
    echo "Usage: $0 [environment] [backup_timestamp]"
    echo ""
    echo "To list available backups:"
    echo "  $0 [environment] --list"
    exit 1
fi

ENVIRONMENT=$1

if [ "$2" = "--list" ]; then
    list_backups
    exit 0
fi

BACKUP_TIMESTAMP=$2

if [ -z "$BACKUP_TIMESTAMP" ]; then
    error "Backup timestamp is required"
    echo ""
    list_backups
    exit 1
fi

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Run rollback
main
