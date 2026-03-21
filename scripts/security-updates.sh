#!/bin/bash

###############################################################################
# Security Updates Script
# Automates security vulnerability scanning and dependency updates
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/security-updates.log"
REPORT_FILE="$PROJECT_ROOT/logs/security-report-$(date +%Y%m%d-%H%M%S).json"

# Ensure logs directory exists
mkdir -p "$PROJECT_ROOT/logs"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run npm audit
run_npm_audit() {
    local dir=$1
    local name=$2
    
    log "Running npm audit for $name..."
    
    cd "$dir"
    
    # Run audit and capture output
    if npm audit --json > "$PROJECT_ROOT/logs/audit-$name.json" 2>&1; then
        log_success "No vulnerabilities found in $name"
        return 0
    else
        local audit_level=$(npm audit --audit-level=moderate 2>&1 || true)
        
        if echo "$audit_level" | grep -q "found 0 vulnerabilities"; then
            log_success "No significant vulnerabilities in $name"
            return 0
        else
            log_warning "Vulnerabilities found in $name"
            return 1
        fi
    fi
}

# Function to fix vulnerabilities
fix_vulnerabilities() {
    local dir=$1
    local name=$2
    local auto_fix=${3:-false}
    
    log "Checking for fixable vulnerabilities in $name..."
    
    cd "$dir"
    
    if [ "$auto_fix" = true ]; then
        log "Attempting automatic fixes for $name..."
        
        # Try npm audit fix (non-breaking changes only)
        if npm audit fix --dry-run 2>&1 | grep -q "fixed"; then
            npm audit fix
            log_success "Applied automatic fixes to $name"
        else
            log "No automatic fixes available for $name"
        fi
    else
        log "Auto-fix disabled. Run with --fix to apply automatic fixes"
    fi
}

# Function to check for outdated packages
check_outdated() {
    local dir=$1
    local name=$2
    
    log "Checking for outdated packages in $name..."
    
    cd "$dir"
    
    if npm outdated --json > "$PROJECT_ROOT/logs/outdated-$name.json" 2>&1; then
        log_success "All packages up to date in $name"
    else
        log_warning "Outdated packages found in $name"
        npm outdated || true
    fi
}

# Function to generate security report
generate_report() {
    log "Generating security report..."
    
    local report="{
  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"scans\": {
    \"root\": $(cat "$PROJECT_ROOT/logs/audit-root.json" 2>/dev/null || echo '{}'),
    \"server\": $(cat "$PROJECT_ROOT/logs/audit-server.json" 2>/dev/null || echo '{}'),
    \"client\": $(cat "$PROJECT_ROOT/logs/audit-client.json" 2>/dev/null || echo '{}')
  },
  \"outdated\": {
    \"root\": $(cat "$PROJECT_ROOT/logs/outdated-root.json" 2>/dev/null || echo '{}'),
    \"server\": $(cat "$PROJECT_ROOT/logs/outdated-server.json" 2>/dev/null || echo '{}'),
    \"client\": $(cat "$PROJECT_ROOT/logs/outdated-client.json" 2>/dev/null || echo '{}')
  }
}"
    
    echo "$report" > "$REPORT_FILE"
    log_success "Security report generated: $REPORT_FILE"
}

# Function to send alert if critical vulnerabilities found
send_alert() {
    local severity=$1
    local message=$2
    
    log_warning "SECURITY ALERT [$severity]: $message"
    
    # Log to system log if available
    if command_exists logger; then
        logger -t "coinnova-security" -p user.warning "$message"
    fi
    
    # Could integrate with notification systems here
    # Example: send email, Slack notification, etc.
}

# Function to backup package files before updates
backup_packages() {
    log "Backing up package files..."
    
    local backup_dir="$PROJECT_ROOT/logs/package-backups-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    cp "$PROJECT_ROOT/package.json" "$backup_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/package-lock.json" "$backup_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/server/package.json" "$backup_dir/server-package.json" 2>/dev/null || true
    cp "$PROJECT_ROOT/server/package-lock.json" "$backup_dir/server-package-lock.json" 2>/dev/null || true
    cp "$PROJECT_ROOT/client/package.json" "$backup_dir/client-package.json" 2>/dev/null || true
    cp "$PROJECT_ROOT/client/package-lock.json" "$backup_dir/client-package-lock.json" 2>/dev/null || true
    
    log_success "Package files backed up to $backup_dir"
}

# Main execution
main() {
    log "========================================="
    log "Security Updates Check Started"
    log "========================================="
    
    # Parse arguments
    AUTO_FIX=false
    CHECK_OUTDATED=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --fix)
                AUTO_FIX=true
                shift
                ;;
            --check-outdated)
                CHECK_OUTDATED=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --fix              Automatically fix vulnerabilities (non-breaking)"
                echo "  --check-outdated   Check for outdated packages"
                echo "  --help             Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Check if npm is installed
    if ! command_exists npm; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Backup package files if auto-fix is enabled
    if [ "$AUTO_FIX" = true ]; then
        backup_packages
    fi
    
    # Track if any vulnerabilities found
    VULNERABILITIES_FOUND=false
    
    # Scan root project
    if ! run_npm_audit "$PROJECT_ROOT" "root"; then
        VULNERABILITIES_FOUND=true
        fix_vulnerabilities "$PROJECT_ROOT" "root" "$AUTO_FIX"
    fi
    
    # Scan server
    if [ -d "$PROJECT_ROOT/server" ]; then
        if ! run_npm_audit "$PROJECT_ROOT/server" "server"; then
            VULNERABILITIES_FOUND=true
            fix_vulnerabilities "$PROJECT_ROOT/server" "server" "$AUTO_FIX"
        fi
    fi
    
    # Scan client
    if [ -d "$PROJECT_ROOT/client" ]; then
        if ! run_npm_audit "$PROJECT_ROOT/client" "client"; then
            VULNERABILITIES_FOUND=true
            fix_vulnerabilities "$PROJECT_ROOT/client" "client" "$AUTO_FIX"
        fi
    fi
    
    # Check for outdated packages if requested
    if [ "$CHECK_OUTDATED" = true ]; then
        check_outdated "$PROJECT_ROOT" "root"
        [ -d "$PROJECT_ROOT/server" ] && check_outdated "$PROJECT_ROOT/server" "server"
        [ -d "$PROJECT_ROOT/client" ] && check_outdated "$PROJECT_ROOT/client" "client"
    fi
    
    # Generate report
    generate_report
    
    # Send alert if critical vulnerabilities found
    if [ "$VULNERABILITIES_FOUND" = true ]; then
        send_alert "HIGH" "Security vulnerabilities detected. Review report: $REPORT_FILE"
    fi
    
    log "========================================="
    log "Security Updates Check Completed"
    log "========================================="
    
    # Return exit code based on vulnerabilities
    if [ "$VULNERABILITIES_FOUND" = true ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main "$@"
