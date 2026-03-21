#!/bin/bash

###############################################################################
# CoinNova Trading Platform - Database Backup Script
# 
# This script creates automated backups of the database
#
# Usage:
#   ./scripts/backup-database.sh [environment]
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
LOG_FILE="$PROJECT_ROOT/logs/backup_${TIMESTAMP}.log"

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
# Backup Functions
###############################################################################

backup_database() {
    log "Creating database backup for $ENVIRONMENT..."
    
    DB_PATH="$PROJECT_ROOT/database/coinnova.db"
    BACKUP_DIR="$PROJECT_ROOT/database/backups"
    BACKUP_FILE="$BACKUP_DIR/coinnova_${ENVIRONMENT}_${TIMESTAMP}.db"
    
    # Check if database exists
    if [ ! -f "$DB_PATH" ]; then
        error "Database file not found: $DB_PATH"
        exit 1
    fi
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Get database size
    DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
    log "Database size: $DB_SIZE"
    
    # Create backup
    cp "$DB_PATH" "$BACKUP_FILE"
    
    if [ -f "$BACKUP_FILE" ]; then
        success "Backup created: $BACKUP_FILE"
        
        # Verify backup
        if [ -r "$BACKUP_FILE" ]; then
            BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            log "Backup size: $BACKUP_SIZE"
            success "Backup verified successfully"
        else
            error "Backup verification failed"
            exit 1
        fi
    else
        error "Backup creation failed"
        exit 1
    fi
}

cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    BACKUP_DIR="$PROJECT_ROOT/database/backups"
    RETENTION_DAYS=${RETENTION_DAYS:-30}
    KEEP_COUNT=${KEEP_COUNT:-10}
    
    # Remove backups older than retention period
    DELETED_COUNT=$(find "$BACKUP_DIR" -name "coinnova_${ENVIRONMENT}_*.db" -mtime +$RETENTION_DAYS -delete -print | wc -l)
    
    if [ "$DELETED_COUNT" -gt 0 ]; then
        log "Deleted $DELETED_COUNT backup(s) older than $RETENTION_DAYS days"
    fi
    
    # Keep only last N backups
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/coinnova_${ENVIRONMENT}_*.db 2>/dev/null | wc -l)
    
    if [ "$BACKUP_COUNT" -gt "$KEEP_COUNT" ]; then
        REMOVE_COUNT=$((BACKUP_COUNT - KEEP_COUNT))
        ls -t "$BACKUP_DIR"/coinnova_${ENVIRONMENT}_*.db | tail -n $REMOVE_COUNT | xargs -r rm
        log "Removed $REMOVE_COUNT old backup(s) (keeping last $KEEP_COUNT)"
    fi
    
    # Show remaining backups
    REMAINING=$(ls -1 "$BACKUP_DIR"/coinnova_${ENVIRONMENT}_*.db 2>/dev/null | wc -l)
    success "Backup cleanup completed ($REMAINING backups remaining)"
}

compress_backup() {
    log "Compressing backup..."
    
    BACKUP_FILE="$BACKUP_DIR/coinnova_${ENVIRONMENT}_${TIMESTAMP}.db"
    COMPRESSED_FILE="${BACKUP_FILE}.gz"
    
    if command -v gzip &> /dev/null; then
        gzip -c "$BACKUP_FILE" > "$COMPRESSED_FILE"
        
        if [ -f "$COMPRESSED_FILE" ]; then
            ORIGINAL_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            COMPRESSED_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
            
            success "Backup compressed: $COMPRESSED_SIZE (original: $ORIGINAL_SIZE)"
            
            # Remove uncompressed backup
            rm "$BACKUP_FILE"
            log "Removed uncompressed backup"
        else
            warning "Compression failed, keeping uncompressed backup"
        fi
    else
        warning "gzip not available, skipping compression"
    fi
}

generate_backup_report() {
    log "Generating backup report..."
    
    BACKUP_DIR="$PROJECT_ROOT/database/backups"
    REPORT_FILE="$BACKUP_DIR/backup_report_${ENVIRONMENT}.txt"
    
    {
        echo "CoinNova Database Backup Report"
        echo "================================"
        echo "Environment: $ENVIRONMENT"
        echo "Timestamp: $(date +'%Y-%m-%d %H:%M:%S')"
        echo ""
        echo "Latest Backup:"
        echo "  File: coinnova_${ENVIRONMENT}_${TIMESTAMP}.db"
        echo "  Size: $(du -h "$BACKUP_DIR"/coinnova_${ENVIRONMENT}_${TIMESTAMP}.db* 2>/dev/null | cut -f1 || echo 'N/A')"
        echo ""
        echo "Backup History:"
        ls -lh "$BACKUP_DIR"/coinnova_${ENVIRONMENT}_*.db* 2>/dev/null | tail -n 10 || echo "  No backups found"
        echo ""
        echo "Total Backups: $(ls -1 "$BACKUP_DIR"/coinnova_${ENVIRONMENT}_*.db* 2>/dev/null | wc -l)"
        echo "Total Size: $(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo 'N/A')"
    } > "$REPORT_FILE"
    
    success "Backup report generated: $REPORT_FILE"
}

###############################################################################
# Main Backup Flow
###############################################################################

main() {
    log "========================================="
    log "CoinNova Database Backup"
    log "Environment: $ENVIRONMENT"
    log "Timestamp: $TIMESTAMP"
    log "========================================="
    
    backup_database
    
    if [ "$COMPRESS" = "true" ]; then
        compress_backup
    fi
    
    cleanup_old_backups
    generate_backup_report
    
    success "========================================="
    success "Backup completed successfully!"
    success "Environment: $ENVIRONMENT"
    success "Log file: $LOG_FILE"
    success "========================================="
}

###############################################################################
# Parse Arguments
###############################################################################

if [ $# -eq 0 ]; then
    echo "Usage: $0 [environment] [options]"
    echo ""
    echo "Environments: development, staging, production"
    echo ""
    echo "Options:"
    echo "  --compress           Compress backup with gzip"
    echo "  --retention-days N   Keep backups for N days (default: 30)"
    echo "  --keep-count N       Keep last N backups (default: 10)"
    exit 1
fi

ENVIRONMENT=$1
shift

# Default options
COMPRESS=false
RETENTION_DAYS=30
KEEP_COUNT=10

while [[ $# -gt 0 ]]; do
    case $1 in
        --compress)
            COMPRESS=true
            shift
            ;;
        --retention-days)
            RETENTION_DAYS=$2
            shift 2
            ;;
        --keep-count)
            KEEP_COUNT=$2
            shift 2
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Run backup
main
