#!/bin/bash

###############################################################################
# CoinNova Trading Platform - Pre-Deployment Check Script
# 
# This script performs comprehensive pre-deployment validation
#
# Usage:
#   ./scripts/pre-deploy-check.sh [environment]
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

# Counters
PASSED=0
FAILED=0
WARNINGS=0

###############################################################################
# Utility Functions
###############################################################################

log() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

success() {
    echo -e "${GREEN}✓ PASS${NC} $1"
    ((PASSED++))
}

error() {
    echo -e "${RED}✗ FAIL${NC} $1"
    ((FAILED++))
}

warning() {
    echo -e "${YELLOW}⚠ WARN${NC} $1"
    ((WARNINGS++))
}

###############################################################################
# Check Functions
###############################################################################

check_node_version() {
    log "Checking Node.js version..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        return 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
        success "Node.js version: v$NODE_VERSION (>= v$REQUIRED_VERSION)"
    else
        error "Node.js version v$NODE_VERSION is below required v$REQUIRED_VERSION"
        return 1
    fi
}

check_npm_version() {
    log "Checking npm version..."
    
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        return 1
    fi
    
    NPM_VERSION=$(npm --version)
    success "npm version: v$NPM_VERSION"
}

check_environment_file() {
    log "Checking environment file..."
    
    ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
    
    if [ ! -f "$ENV_FILE" ]; then
        error "Environment file not found: $ENV_FILE"
        return 1
    fi
    
    success "Environment file exists: $ENV_FILE"
}

check_required_env_vars() {
    log "Checking required environment variables..."
    
    ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
    REQUIRED_VARS=(
        "NODE_ENV"
        "PORT"
        "JWT_SECRET"
        "CORS_ORIGIN"
        "REACT_APP_API_URL"
    )
    
    MISSING_VARS=()
    
    for var in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^${var}=" "$ENV_FILE"; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -eq 0 ]; then
        success "All required environment variables present"
    else
        error "Missing environment variables: ${MISSING_VARS[*]}"
        return 1
    fi
}

check_jwt_secret() {
    log "Checking JWT secret security..."
    
    ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
    JWT_SECRET=$(grep "^JWT_SECRET=" "$ENV_FILE" | cut -d'=' -f2)
    
    if [ -z "$JWT_SECRET" ]; then
        error "JWT_SECRET is empty"
        return 1
    fi
    
    if [ "$ENVIRONMENT" = "production" ]; then
        if [ ${#JWT_SECRET} -lt 32 ]; then
            error "JWT_SECRET is too short for production (< 32 characters)"
            return 1
        fi
        
        if [[ "$JWT_SECRET" =~ (REPLACE|CHANGE|SECRET|KEY|EXAMPLE|TEST) ]]; then
            error "JWT_SECRET contains placeholder text"
            return 1
        fi
        
        success "JWT_SECRET is secure (${#JWT_SECRET} characters)"
    else
        success "JWT_SECRET is set"
    fi
}

check_cors_origin() {
    log "Checking CORS origin..."
    
    ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
    CORS_ORIGIN=$(grep "^CORS_ORIGIN=" "$ENV_FILE" | cut -d'=' -f2)
    
    if [ -z "$CORS_ORIGIN" ]; then
        error "CORS_ORIGIN is not set"
        return 1
    fi
    
    if [ "$ENVIRONMENT" = "production" ]; then
        if [[ "$CORS_ORIGIN" =~ localhost ]]; then
            error "CORS_ORIGIN contains 'localhost' in production"
            return 1
        fi
        
        if [[ ! "$CORS_ORIGIN" =~ ^https:// ]]; then
            warning "CORS_ORIGIN should use HTTPS in production"
        fi
    fi
    
    success "CORS_ORIGIN is configured: $CORS_ORIGIN"
}

check_disk_space() {
    log "Checking disk space..."
    
    AVAILABLE=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | sed 's/G//')
    REQUIRED=5
    
    if [ "$AVAILABLE" -lt "$REQUIRED" ]; then
        error "Insufficient disk space: ${AVAILABLE}GB available, ${REQUIRED}GB required"
        return 1
    fi
    
    success "Disk space available: ${AVAILABLE}GB"
}

check_port_availability() {
    log "Checking port availability..."
    
    ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
    PORT=$(grep "^PORT=" "$ENV_FILE" | cut -d'=' -f2)
    PORT=${PORT:-5000}
    
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        if [ "$ENVIRONMENT" = "production" ]; then
            warning "Port $PORT is in use (may be existing deployment)"
        else
            error "Port $PORT is already in use"
            return 1
        fi
    else
        success "Port $PORT is available"
    fi
}

check_database_directory() {
    log "Checking database directory..."
    
    DB_DIR="$PROJECT_ROOT/database"
    
    if [ ! -d "$DB_DIR" ]; then
        error "Database directory not found: $DB_DIR"
        return 1
    fi
    
    if [ ! -w "$DB_DIR" ]; then
        error "Database directory is not writable"
        return 1
    fi
    
    success "Database directory is accessible and writable"
}

check_backup_directory() {
    log "Checking backup directory..."
    
    BACKUP_DIR="$PROJECT_ROOT/database/backups"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        success "Created backup directory: $BACKUP_DIR"
    else
        success "Backup directory exists"
    fi
    
    if [ ! -w "$BACKUP_DIR" ]; then
        error "Backup directory is not writable"
        return 1
    fi
}

check_logs_directory() {
    log "Checking logs directory..."
    
    LOGS_DIR="$PROJECT_ROOT/logs"
    
    if [ ! -d "$LOGS_DIR" ]; then
        mkdir -p "$LOGS_DIR"
        success "Created logs directory: $LOGS_DIR"
    else
        success "Logs directory exists"
    fi
    
    if [ ! -w "$LOGS_DIR" ]; then
        error "Logs directory is not writable"
        return 1
    fi
}

check_dependencies() {
    log "Checking dependencies..."
    
    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        warning "Root dependencies not installed"
    fi
    
    if [ ! -d "$PROJECT_ROOT/server/node_modules" ]; then
        warning "Server dependencies not installed"
    fi
    
    if [ ! -d "$PROJECT_ROOT/client/node_modules" ]; then
        warning "Client dependencies not installed"
    fi
    
    success "Dependencies check completed"
}

check_git_status() {
    log "Checking git status..."
    
    if ! command -v git &> /dev/null; then
        warning "git is not installed"
        return 0
    fi
    
    if [ ! -d "$PROJECT_ROOT/.git" ]; then
        warning "Not a git repository"
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    if [ -n "$(git status --porcelain)" ]; then
        warning "Working directory has uncommitted changes"
    else
        success "Working directory is clean"
    fi
    
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    success "Current branch: $BRANCH"
}

check_security_settings() {
    log "Checking security settings..."
    
    ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Check HELMET_ENABLED
        HELMET=$(grep "^HELMET_ENABLED=" "$ENV_FILE" | cut -d'=' -f2)
        if [ "$HELMET" != "true" ]; then
            warning "HELMET_ENABLED should be true in production"
        fi
        
        # Check BCRYPT_ROUNDS
        BCRYPT_ROUNDS=$(grep "^BCRYPT_ROUNDS=" "$ENV_FILE" | cut -d'=' -f2)
        if [ -n "$BCRYPT_ROUNDS" ] && [ "$BCRYPT_ROUNDS" -lt 12 ]; then
            warning "BCRYPT_ROUNDS should be >= 12 in production"
        fi
        
        # Check LOG_LEVEL
        LOG_LEVEL=$(grep "^LOG_LEVEL=" "$ENV_FILE" | cut -d'=' -f2)
        if [ "$LOG_LEVEL" = "debug" ]; then
            warning "LOG_LEVEL should not be 'debug' in production"
        fi
    fi
    
    success "Security settings checked"
}

check_api_keys() {
    log "Checking API keys..."
    
    ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        COINGECKO_KEY=$(grep "^COINGECKO_API_KEY=" "$ENV_FILE" | cut -d'=' -f2)
        
        if [ -z "$COINGECKO_KEY" ]; then
            warning "COINGECKO_API_KEY not set (recommended for production)"
        else
            success "COINGECKO_API_KEY is configured"
        fi
    else
        success "API keys check completed"
    fi
}

###############################################################################
# Main Check Flow
###############################################################################

main() {
    echo ""
    echo "========================================="
    echo "CoinNova Pre-Deployment Check"
    echo "Environment: $ENVIRONMENT"
    echo "========================================="
    echo ""
    
    # System checks
    check_node_version || true
    check_npm_version || true
    echo ""
    
    # Environment checks
    check_environment_file || true
    check_required_env_vars || true
    check_jwt_secret || true
    check_cors_origin || true
    echo ""
    
    # Security checks
    check_security_settings || true
    check_api_keys || true
    echo ""
    
    # Resource checks
    check_disk_space || true
    check_port_availability || true
    echo ""
    
    # Directory checks
    check_database_directory || true
    check_backup_directory || true
    check_logs_directory || true
    echo ""
    
    # Dependency checks
    check_dependencies || true
    check_git_status || true
    echo ""
    
    # Summary
    echo "========================================="
    echo "Pre-Deployment Check Summary"
    echo "========================================="
    echo -e "${GREEN}Passed:${NC}   $PASSED"
    echo -e "${RED}Failed:${NC}   $FAILED"
    echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
    echo "========================================="
    echo ""
    
    if [ "$FAILED" -gt 0 ]; then
        echo -e "${RED}✗ Pre-deployment checks FAILED${NC}"
        echo "Please fix the issues above before deploying."
        exit 1
    elif [ "$WARNINGS" -gt 0 ]; then
        echo -e "${YELLOW}⚠ Pre-deployment checks passed with WARNINGS${NC}"
        echo "Review warnings before proceeding with deployment."
        exit 0
    else
        echo -e "${GREEN}✓ All pre-deployment checks PASSED${NC}"
        echo "Ready for deployment!"
        exit 0
    fi
}

###############################################################################
# Parse Arguments
###############################################################################

if [ $# -eq 0 ]; then
    echo "Usage: $0 [environment]"
    echo ""
    echo "Environments: development, staging, production"
    exit 1
fi

ENVIRONMENT=$1

# Run checks
main
