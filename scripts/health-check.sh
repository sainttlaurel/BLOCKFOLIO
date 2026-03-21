#!/bin/bash

###############################################################################
# CoinNova Trading Platform - Health Check Script
# 
# This script performs comprehensive health checks on the deployed application
#
# Usage:
#   ./scripts/health-check.sh [environment]
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

###############################################################################
# Utility Functions
###############################################################################

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

###############################################################################
# Health Check Functions
###############################################################################

check_api_health() {
    log "Checking API health endpoint..."
    
    RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:$PORT/api/health" 2>/dev/null || echo "000")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        success "API health check passed (HTTP $HTTP_CODE)"
        return 0
    else
        error "API health check failed (HTTP $HTTP_CODE)"
        return 1
    fi
}

check_api_system() {
    log "Checking system information..."
    
    RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:$PORT/api/system" 2>/dev/null || echo "000")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        success "System endpoint accessible"
        
        # Parse and display system info
        if command -v jq &> /dev/null; then
            ENV=$(echo "$BODY" | jq -r '.environment // "unknown"')
            VERSION=$(echo "$BODY" | jq -r '.version // "unknown"')
            log "  Environment: $ENV"
            log "  Version: $VERSION"
        fi
        return 0
    else
        error "System endpoint failed (HTTP $HTTP_CODE)"
        return 1
    fi
}

check_database() {
    log "Checking database connection..."
    
    DB_PATH="$PROJECT_ROOT/database/coinnova.db"
    
    if [ ! -f "$DB_PATH" ]; then
        error "Database file not found: $DB_PATH"
        return 1
    fi
    
    if [ ! -r "$DB_PATH" ]; then
        error "Database file is not readable"
        return 1
    fi
    
    success "Database file accessible"
    
    # Check database size
    DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
    log "  Database size: $DB_SIZE"
    
    return 0
}

check_process() {
    log "Checking application process..."
    
    if command -v pm2 &> /dev/null; then
        if pm2 list | grep -q "coinnova-api"; then
            STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="coinnova-api") | .pm2_env.status')
            if [ "$STATUS" = "online" ]; then
                success "Application running (PM2: $STATUS)"
                
                # Get process info
                UPTIME=$(pm2 jlist | jq -r '.[] | select(.name=="coinnova-api") | .pm2_env.pm_uptime')
                MEMORY=$(pm2 jlist | jq -r '.[] | select(.name=="coinnova-api") | .monit.memory')
                CPU=$(pm2 jlist | jq -r '.[] | select(.name=="coinnova-api") | .monit.cpu')
                
                if [ "$MEMORY" != "null" ]; then
                    MEMORY_MB=$((MEMORY / 1024 / 1024))
                    log "  Memory: ${MEMORY_MB}MB"
                fi
                if [ "$CPU" != "null" ]; then
                    log "  CPU: ${CPU}%"
                fi
                
                return 0
            else
                error "Application not running (PM2: $STATUS)"
                return 1
            fi
        else
            error "Application not found in PM2"
            return 1
        fi
    elif [ -f "$PROJECT_ROOT/.pid" ]; then
        PID=$(cat "$PROJECT_ROOT/.pid")
        if kill -0 "$PID" 2>/dev/null; then
            success "Application running (PID: $PID)"
            return 0
        else
            error "Application not running (stale PID file)"
            return 1
        fi
    else
        warning "Cannot determine process status"
        return 1
    fi
}

check_disk_space() {
    log "Checking disk space..."
    
    AVAILABLE=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | sed 's/G//')
    USED_PERCENT=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $5}' | sed 's/%//')
    
    log "  Available: ${AVAILABLE}GB"
    log "  Used: ${USED_PERCENT}%"
    
    if [ "$AVAILABLE" -lt 1 ]; then
        error "Low disk space: ${AVAILABLE}GB available"
        return 1
    elif [ "$USED_PERCENT" -gt 90 ]; then
        warning "Disk usage high: ${USED_PERCENT}%"
        return 0
    else
        success "Disk space adequate"
        return 0
    fi
}

check_logs() {
    log "Checking log files..."
    
    LOG_DIR="$PROJECT_ROOT/logs"
    
    if [ ! -d "$LOG_DIR" ]; then
        warning "Log directory not found"
        return 1
    fi
    
    # Check for recent errors
    RECENT_ERRORS=$(find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep -i "error" {} \; 2>/dev/null | wc -l)
    
    if [ "$RECENT_ERRORS" -gt 0 ]; then
        warning "Found $RECENT_ERRORS error entries in recent logs"
    else
        success "No recent errors in logs"
    fi
    
    # Check log file sizes
    LARGE_LOGS=$(find "$LOG_DIR" -name "*.log" -size +100M 2>/dev/null)
    if [ -n "$LARGE_LOGS" ]; then
        warning "Large log files detected (>100MB)"
        echo "$LARGE_LOGS" | while read -r log; do
            SIZE=$(du -h "$log" | cut -f1)
            log "  $(basename $log): $SIZE"
        done
    fi
    
    return 0
}

check_security_headers() {
    log "Checking security headers..."
    
    HEADERS=$(curl -s -I "http://localhost:$PORT" 2>/dev/null || echo "")
    
    if echo "$HEADERS" | grep -qi "X-Content-Type-Options"; then
        success "X-Content-Type-Options header present"
    else
        warning "X-Content-Type-Options header missing"
    fi
    
    if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
        success "X-Frame-Options header present"
    else
        warning "X-Frame-Options header missing"
    fi
    
    if echo "$HEADERS" | grep -qi "Strict-Transport-Security"; then
        success "HSTS header present"
    else
        if [ "$ENVIRONMENT" = "production" ]; then
            warning "HSTS header missing (recommended for production)"
        fi
    fi
    
    return 0
}

check_response_time() {
    log "Checking API response time..."
    
    START=$(date +%s%N)
    curl -s "http://localhost:$PORT/api/health" > /dev/null 2>&1
    END=$(date +%s%N)
    
    RESPONSE_TIME=$(( (END - START) / 1000000 ))
    
    log "  Response time: ${RESPONSE_TIME}ms"
    
    if [ "$RESPONSE_TIME" -lt 100 ]; then
        success "Response time excellent (<100ms)"
    elif [ "$RESPONSE_TIME" -lt 500 ]; then
        success "Response time good (<500ms)"
    elif [ "$RESPONSE_TIME" -lt 1000 ]; then
        warning "Response time acceptable (<1s)"
    else
        error "Response time slow (>1s)"
        return 1
    fi
    
    return 0
}

###############################################################################
# Main Health Check Flow
###############################################################################

main() {
    log "========================================="
    log "CoinNova Health Check"
    log "Environment: $ENVIRONMENT"
    log "========================================="
    echo ""
    
    FAILED_CHECKS=0
    
    # Run all checks
    check_process || ((FAILED_CHECKS++))
    echo ""
    
    check_api_health || ((FAILED_CHECKS++))
    echo ""
    
    check_api_system || ((FAILED_CHECKS++))
    echo ""
    
    check_database || ((FAILED_CHECKS++))
    echo ""
    
    check_disk_space || ((FAILED_CHECKS++))
    echo ""
    
    check_logs || ((FAILED_CHECKS++))
    echo ""
    
    check_security_headers || ((FAILED_CHECKS++))
    echo ""
    
    check_response_time || ((FAILED_CHECKS++))
    echo ""
    
    # Summary
    log "========================================="
    if [ "$FAILED_CHECKS" -eq 0 ]; then
        success "All health checks passed!"
    else
        error "$FAILED_CHECKS health check(s) failed"
        exit 1
    fi
    log "========================================="
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

# Load port from environment file
ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
    error "Environment file not found: $ENV_FILE"
    exit 1
fi

PORT=$(grep "^PORT=" "$ENV_FILE" | cut -d'=' -f2)
PORT=${PORT:-5000}

# Run health checks
main
