# CoinNova Deployment Scripts

This directory contains automated deployment and maintenance scripts for the CoinNova Trading Platform.

## Available Scripts

### 1. deploy.sh

Main deployment script with comprehensive automation.

**Features:**
- Pre-deployment validation
- Dependency installation
- Application build
- Database backup
- Health checks
- Automatic rollback on failure

**Usage:**
```bash
./scripts/deploy.sh [environment] [options]

# Examples:
./scripts/deploy.sh production
./scripts/deploy.sh staging --skip-backup
./scripts/deploy.sh development --dry-run
```

**Options:**
- `--skip-checks` - Skip pre-deployment validation
- `--skip-backup` - Skip database backup
- `--dry-run` - Preview deployment without executing

### 2. rollback.sh

Rollback to a previous deployment state.

**Usage:**
```bash
# List available backups
./scripts/rollback.sh production --list

# Rollback to specific backup
./scripts/rollback.sh production 20240115_143022
```

### 3. health-check.sh

Comprehensive health check script.

**Usage:**
```bash
./scripts/health-check.sh [environment]

# Example:
./scripts/health-check.sh production
```

**Checks:**
- API health endpoint
- System information
- Database connectivity
- Process status
- Disk space
- Log files
- Security headers
- Response time

### 4. backup-database.sh

Database backup script with compression and retention management.

**Usage:**
```bash
./scripts/backup-database.sh [environment] [options]

# Examples:
./scripts/backup-database.sh production --compress
./scripts/backup-database.sh staging --retention-days 60 --keep-count 20
```

**Options:**
- `--compress` - Compress backup with gzip
- `--retention-days N` - Keep backups for N days (default: 30)
- `--keep-count N` - Keep last N backups (default: 10)

### 5. pre-deploy-check.sh

Pre-deployment validation script.

**Usage:**
```bash
./scripts/pre-deploy-check.sh [environment]

# Example:
./scripts/pre-deploy-check.sh production
```

**Checks:**
- Node.js and npm versions
- Environment file existence
- Required environment variables
- JWT secret security
- CORS configuration
- Disk space
- Port availability
- Directory permissions
- Dependencies
- Git status
- Security settings

## Quick Start

### First-Time Setup

```bash
# 1. Make scripts executable (Linux/macOS)
chmod +x scripts/*.sh

# 2. Install dependencies
npm run install-all

# 3. Configure environment
cp .env.example .env.production
nano .env.production

# 4. Validate configuration
npm run env:validate:prod
```

### Standard Deployment

```bash
# 1. Pre-deployment check
./scripts/pre-deploy-check.sh production

# 2. Deploy
./scripts/deploy.sh production

# 3. Verify
./scripts/health-check.sh production
```

### Emergency Rollback

```bash
# 1. List backups
./scripts/rollback.sh production --list

# 2. Rollback
./scripts/rollback.sh production [TIMESTAMP]

# 3. Verify
./scripts/health-check.sh production
```

## NPM Script Shortcuts

You can also use npm scripts for convenience:

```bash
# Deployment
npm run deploy:dev
npm run deploy:staging
npm run deploy:prod

# Health checks
npm run health:check production

# Database backup
npm run backup:db production

# Rollback
npm run rollback production --list
npm run rollback production [TIMESTAMP]

# Pre-deployment check
npm run deploy:check production
```

## Automated Scheduling

### Cron Jobs

Add to crontab for automated tasks:

```bash
# Edit crontab
crontab -e

# Add scheduled tasks:

# Daily database backup at 2 AM
0 2 * * * /path/to/scripts/backup-database.sh production --compress

# Health check every 5 minutes
*/5 * * * * /path/to/scripts/health-check.sh production >> /var/log/coinnova-health.log 2>&1

# Weekly cleanup at 3 AM Sunday
0 3 * * 0 find /path/to/database/backups -mtime +30 -delete
```

## CI/CD Integration

### GitHub Actions

Scripts are integrated with GitHub Actions workflow (`.github/workflows/deploy.yml`).

Deployment triggers:
- Push to `main` → Production
- Push to `staging` → Staging
- Push to `develop` → Development

### GitLab CI

Scripts are integrated with GitLab CI pipeline (`.gitlab-ci.yml`).

Manual deployment jobs available for each environment.

## Docker Support

### Build and Deploy with Docker

```bash
# Build image
docker build -t coinnova-api:latest .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Logging

All scripts create detailed logs in the `logs/` directory:

- `deploy_[TIMESTAMP].log` - Deployment logs
- `rollback_[TIMESTAMP].log` - Rollback logs
- `backup_[TIMESTAMP].log` - Backup logs

## Error Handling

All scripts include:
- Comprehensive error checking
- Automatic rollback on failure
- Detailed error messages
- Exit codes for CI/CD integration

## Best Practices

1. **Always run pre-deployment checks** before deploying
2. **Test in staging** before production deployment
3. **Create backups** before major changes
4. **Monitor logs** during and after deployment
5. **Verify health checks** after deployment
6. **Document issues** and update runbook
7. **Keep scripts updated** with project changes

## Troubleshooting

### Scripts Won't Execute

```bash
# Make executable
chmod +x scripts/*.sh

# Check shebang
head -n 1 scripts/deploy.sh
```

### Permission Denied

```bash
# Check file permissions
ls -la scripts/

# Fix permissions
chmod 755 scripts/*.sh
```

### Command Not Found

```bash
# Check PATH
echo $PATH

# Run with full path
/path/to/scripts/deploy.sh production
```

### Script Fails Silently

```bash
# Run with bash -x for debugging
bash -x scripts/deploy.sh production

# Check logs
cat logs/deploy_*.log
```

## Security Considerations

- Scripts handle sensitive data (database, environment files)
- Backups contain production data
- Logs may contain sensitive information
- Ensure proper file permissions (600 for sensitive files)
- Never commit secrets to version control
- Use secure channels for script execution

## Maintenance

### Regular Updates

- Review and update scripts quarterly
- Test scripts in staging before production use
- Keep documentation synchronized with scripts
- Update error handling as needed
- Add new checks as requirements evolve

### Script Versioning

Scripts are versioned with the project. Check git history for changes:

```bash
git log scripts/deploy.sh
```

## Support

For issues or questions:

1. Check script logs in `logs/` directory
2. Review documentation in `docs/`
3. Run with debug mode: `bash -x script.sh`
4. Contact DevOps team
5. Create issue in project repository

## Additional Resources

- [Deployment Guide](../docs/DEPLOYMENT.md)
- [Deployment Runbook](../docs/DEPLOYMENT_RUNBOOK.md)
- [Environment Configuration](../ENVIRONMENT_CONFIGURATION.md)
- [Deployment Checklist](../DEPLOYMENT_CHECKLIST.md)

---

**Last Updated**: 2024
**Version**: 1.0.0
