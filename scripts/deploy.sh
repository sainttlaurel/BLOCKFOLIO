#!/bin/bash

###############################################################################
# CoinNova Trading Platform - Deployment Script
# 
# This script automates the deployment process for different environments
# with pre-deployment checks, validation, and rollback capabilities.
#
# Usage:
#   ./scripts/deploy.sh [environment] [options]
#
# Environments:
#   development, staging, production
#
# Options:
#   --skip-checks    Skip pre-deployment validation
#   --skip-backup    Skip database backup
#   --dry-run        Show what would be deployed without executing
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$PROJECT_ROOT/logs/deploy_${TIMESTAMP}.log"

# Default options
SKIP_CHECKS=false
SKIP_BACKUP=false
DRY_RUN=false

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
# Pre-deployment Checks
###############################################################################

check_environment() {
    log "Checking environment: $ENVIRONMENT"
    
    if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
        error "Invalid environment: $ENVIRONMENT"
        error "Must be one of: development, staging, production"
        exit 1
    fi
    
    success "Environment validated: $ENVIRONMENT"
}

check_dependencies() {
    log "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    success "Node.js $(node --version) found"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        exit 1
    fi
    success "npm $(npm --version) found"
    
    # Check git
    if ! command -v git &> /dev/null; then
        warning "git is not installed (optional)"
    else
        success "git $(git --version | cut -d' ' -f3) found"
    fi
}

check_configuration() {
    log "Validating configuration for $ENVIRONMENT..."
    
    ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
    
    if [ ! -f "$ENV_FILE" ]; then
        error "Environment file not found: $ENV_FILE"
        exit 1
    fi
    success "Environment file found: $ENV_FILE"
    
    # Run configuration validation
    if ! NODE_ENV=$ENVIRONMENT node -e "require('$PROJECT_ROOT/server/config/env.config').initializeConfig()" 2>&1 | tee -a "$LOG_FILE"; then
        error "Configuration validation failed"
        exit 1
    fi
    success "Configuration validated successfully"
}

check_disk_space() {
    log "Checking disk space..."
    
    AVAILABLE_SPACE=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | sed 's/G//')
    REQUIRED_SPACE=1
    
    if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
        error "Insufficient disk space. Available: ${AVAILABLE_SPACE}GB, Required: ${REQUIRED_SPACE}GB"
        exit 1
    fi
    success "Disk space available: ${AVAILABLE_SPACE}GB"
}

check_ports() {
    log "Checking port availability..."
    
    # Load port from environment file
    PORT=$(grep "^PORT=" "$PROJECT_ROOT/.env.$ENVIRONMENT" | cut -d'=' -f2)
    PORT=${PORT:-5000}
    
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        warning "Port $PORT is already in use"
        if [ "$ENVIRONMENT" = "production" ]; then
            log "This is expected if updating an existing deployment"
        fi
    else
        success "Port $PORT is available"
    fi
}

###############################################################################
# Backup Functions
###############################################################################

backup_database() {
    log "Creating database backup..."
    
    DB_PATH="$PROJECT_ROOT/database/coinnova.db"
    BACKUP_DIR="$PROJECT_ROOT/database/backups"
    BACKUP_FILE="$BACKUP_DIR/coinnova_${ENVIRONMENT}_${TIMESTAMP}.db"
    
    if [ ! -f "$DB_PATH" ]; then
        warning "Database file not found: $DB_PATH"
        return 0
    fi
    
    mkdir -p "$BACKUP_DIR"
    
    if $DRY_RUN; then
        log "DRY RUN: Would backup $DB_PATH to $BACKUP_FILE"
    else
        cp "$DB_PATH" "$BACKUP_FILE"
        success "Database backed up to: $BACKUP_FILE"
        
        # Keep only last 10 backups
        ls -t "$BACKUP_DIR"/coinnova_${ENVIRONMENT}_*.db | tail -n +11 | xargs -r rm
        log "Cleaned up old backups (keeping last 10)"
    fi
}

backup_env_file() {
    log "Backing up environment file..."
    
    ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
    BACKUP_DIR="$PROJECT_ROOT/.env.backups"
    BACKUP_FILE="$BACKUP_DIR/.env.${ENVIRONMENT}_${TIMESTAMP}"
    
    mkdir -p "$BACKUP_DIR"
    
    if $DRY_RUN; then
        log "DRY RUN: Would backup $ENV_FILE to $BACKUP_FILE"
    else
        cp "$ENV_FILE" "$BACKUP_FILE"
        success "Environment file backed up"
    fi
}

###############################################################################
# Deployment Functions
###############################################################################

install_dependencies() {
    log "Installing dependencies..."
    
    cd "$PROJECT_ROOT"
    
    if $DRY_RUN; then
        log "DRY RUN: Would run npm ci"
        return 0
    fi
    
    # Install root dependencies
    npm ci --loglevel=error 2>&1 | tee -a "$LOG_FILE"
    success "Root dependencies installed"
    
    # Install server dependencies
    cd "$PROJECT_ROOT/server"
    npm ci --loglevel=error 2>&1 | tee -a "$LOG_FILE"
    success "Server dependencies installed"
    
    # Install client dependencies
    cd "$PROJECT_ROOT/client"
    npm ci --loglevel=error 2>&1 | tee -a "$LOG_FILE"
    success "Client dependencies installed"
    
    cd "$PROJECT_ROOT"
}

build_application() {
    log "Building application for $ENVIRONMENT..."
    
    cd "$PROJECT_ROOT/client"
    
    if $DRY_RUN; then
        log "DRY RUN: Would build application"
        return 0
    fi
    
    # Build client
    NODE_ENV=$ENVIRONMENT npm run build 2>&1 | tee -a "$LOG_FILE"
    success "Client build completed"
    
    # Verify build output
    if [ ! -d "$PROJECT_ROOT/client/build" ]; then
        error "Build directory not found"
        exit 1
    fi
    success "Build artifacts verified"
    
    cd "$PROJECT_ROOT"
}

run_tests() {
    log "Running tests..."
    
    if $DRY_RUN; then
        log "DRY RUN: Would run tests"
        return 0
    fi
    
    cd "$PROJECT_ROOT/client"
    
    # Run tests with coverage
    CI=true npm test -- --coverage --watchAll=false 2>&1 | tee -a "$LOG_FILE" || {
        warning "Some tests failed"
        if [ "$ENVIRONMENT" = "production" ]; then
            error "Cannot deploy to production with failing tests"
            exit 1
        fi
    }
    
    success "Tests completed"
    cd "$PROJECT_ROOT"
}

deploy_application() {
    log "Deploying application..."
    
    if $DRY_RUN; then
        log "DRY RUN: Would deploy application"
        return 0
    fi
    
    # Copy environment file
    cp "$PROJECT_ROOT/.env.$ENVIRONMENT" "$PROJECT_ROOT/.env"
    success "Environment file activated"
    
    # Set environment variable
    export NODE_ENV=$ENVIRONMENT
    success "NODE_ENV set to $ENVIRONMENT"
}

start_application() {
    log "Starting application..."
    
    if $DRY_RUN; then
        log "DRY RUN: Would start application"
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    # Check if PM2 is available
    if command -v pm2 &> /dev/null; then
        log "Using PM2 process manager"
        
        # Stop existing process if running
        pm2 stop coinnova-api 2>/dev/null || true
        
        # Start with PM2
        NODE_ENV=$ENVIRONMENT pm2 start server/index.js --name coinnova-api --update-env
        pm2 save
        
        success "Application started with PM2"
    else
        warning "PM2 not found. Starting with node..."
        NODE_ENV=$ENVIRONMENT node server/index.js &
        echo $! > "$PROJECT_ROOT/.pid"
        success "Application started (PID: $(cat $PROJECT_ROOT/.pid))"
    fi
}

###############################################################################
# Health Check
###############################################################################

health_check() {
    log "Running health check..."
    
    if $DRY_RUN; then
        log "DRY RUN: Would run health check"
        return 0
    fi
    
    # Wait for application to start
    sleep 5
    
    # Get port from environment
    PORT=$(grep "^PORT=" "$PROJECT_ROOT/.env.$ENVIRONMENT" | cut -d'=' -f2)
    PORT=${PORT:-5000}
    
    # Try health check endpoint
    for i in {1..10}; do
        if curl -f -s "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
            success "Health check passed"
            return 0
        fi
        log "Waiting for application to start... ($i/10)"
        sleep 2
    done
    
    error "Health check failed after 10 attempts"
    return 1
}

###############################################################################
# Rollback Function
###############################################################################

rollback() {
    error "Deployment failed. Initiating rollback..."
    
    # Restore database backup
    if [ -f "$BACKUP_FILE" ]; then
        cp "$BACKUP_FILE" "$PROJECT_ROOT/database/coinnova.db"
        success "Database restored from backup"
    fi
    
    # Stop application
    if command -v pm2 &> /dev/null; then
        pm2 stop coinnova-api 2>/dev/null || true
    elif [ -f "$PROJECT_ROOT/.pid" ]; then
        kill $(cat "$PROJECT_ROOT/.pid") 2>/dev/null || true
        rm "$PROJECT_ROOT/.pid"
    fi
    
    error "Rollback completed. Please check logs: $LOG_FILE"
    exit 1
}

###############################################################################
# Main Deployment Flow
###############################################################################

main() {
    log "========================================="
    log "CoinNova Deployment Script"
    log "Environment: $ENVIRONMENT"
    log "Timestamp: $TIMESTAMP"
    log "========================================="
    
    # Pre-deployment checks
    if ! $SKIP_CHECKS; then
        check_environment
        check_dependencies
        check_configuration
        check_disk_space
        check_ports
    else
        warning "Skipping pre-deployment checks"
    fi
    
    # Backup
    if ! $SKIP_BACKUP; then
        backup_database
        backup_env_file
    else
        warning "Skipping backups"
    fi
    
    # Deployment
    install_dependencies || rollback
    build_application || rollback
    
    if [ "$ENVIRONMENT" != "development" ]; then
        run_tests || rollback
    fi
    
    deploy_application || rollback
    start_application || rollback
    
    # Post-deployment verification
    if health_check; then
        success "========================================="
        success "Deployment completed successfully!"
        success "Environment: $ENVIRONMENT"
        success "Log file: $LOG_FILE"
        success "========================================="
    else
        rollback
    fi
}

###############################################################################
# Parse Arguments
###############################################################################

if [ $# -eq 0 ]; then
    echo "Usage: $0 [environment] [options]"
    echo ""
    echo "Environments:"
    echo "  development, staging, production"
    echo ""
    echo "Options:"
    echo "  --skip-checks    Skip pre-deployment validation"
    echo "  --skip-backup    Skip database backup"
    echo "  --dry-run        Show what would be deployed without executing"
    exit 1
fi

ENVIRONMENT=$1
shift

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-checks)
            SKIP_CHECKS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Run main deployment
main
