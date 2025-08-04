# Troubleshooting

## Common Issues

### Server Won't Start

#### Port Already in Use
**Problem**: Error "EADDRINUSE: address already in use"

**Solution**:
```bash
# Find process using the port
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=8081 pnpm dev
```

#### Permission Denied
**Problem**: Cannot create storage directory or database

**Solution**:
```bash
# Check permissions
ls -la ~/.firmasign

# Create directory with proper permissions
mkdir -p ~/.firmasign
chmod 755 ~/.firmasign

# Or use a different storage path
STORAGE_PATH=./local-storage pnpm dev
```

### Database Issues

#### Database Locked
**Problem**: "SQLITE_BUSY: database is locked"

**Solution**:
1. Stop all server instances
2. Remove lock file if exists:
```bash
rm ~/.firmasign/firma-sign.db-journal
```
3. If persists, restart with fresh database:
```bash
rm ~/.firmasign/firma-sign.db
pnpm dev
```

#### Database Corruption
**Problem**: "SQLITE_CORRUPT: database disk image is malformed"

**Solution**:
1. Backup existing database
2. Delete and recreate:
```bash
mv ~/.firmasign/firma-sign.db ~/.firmasign/firma-sign.db.backup
pnpm dev
```

### Transport Issues

#### Transport Not Found
**Problem**: "Transport [name] not found"

**Solution**:
1. Install the transport package:
```bash
pnpm add @firmachain/firma-sign-transport-p2p
```
2. Register in server code
3. Check transport name spelling

#### Transport Configuration Failed
**Problem**: "Invalid configuration for transport"

**Solution**:
1. Check environment variables
2. Verify configuration format
3. Enable debug logging:
```bash
LOG_LEVEL=debug pnpm dev
```

### WebSocket Issues

#### Connection Refused
**Problem**: WebSocket connection fails

**Solution**:
1. Check server is running
2. Verify WebSocket URL matches server
3. Check CORS configuration
4. Try without SSL first:
```javascript
ws://localhost:8080
```

#### Messages Not Received
**Problem**: Client connected but no updates

**Solution**:
1. Check subscription:
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  transferId: 'your-transfer-id'
}));
```
2. Verify authentication if required
3. Check server logs for errors

### API Issues

#### 404 Not Found
**Problem**: API endpoint returns 404

**Solution**:
1. Check API path includes `/api` prefix
2. Verify HTTP method (GET, POST, etc.)
3. Check server logs for route registration

#### 400 Bad Request
**Problem**: Validation errors

**Solution**:
1. Check request body format
2. Verify all required fields
3. Check data types match schema
4. Review validation error details in response

#### 429 Too Many Requests
**Problem**: Rate limit exceeded

**Solution**:
1. Wait for rate limit window to reset (default 15 minutes)
2. Reduce request frequency
3. Increase rate limit in production:
```env
RATE_LIMIT_MAX_REQUESTS=200
```

### Storage Issues

#### Out of Disk Space
**Problem**: Cannot save documents

**Solution**:
1. Check disk space:
```bash
df -h
```
2. Clean old transfers
3. Move storage to larger disk:
```env
STORAGE_PATH=/mnt/large-disk/firma-sign
```

#### Document Not Found
**Problem**: 404 when accessing document

**Solution**:
1. Verify transfer ID is correct
2. Check document was uploaded
3. Verify storage path permissions
4. Check database for document record

### Performance Issues

#### High Memory Usage
**Problem**: Server using too much RAM

**Solution**:
1. Check for memory leaks in logs
2. Limit concurrent connections
3. Restart server periodically
4. Use production build:
```bash
NODE_ENV=production pnpm start
```

#### Slow Response Times
**Problem**: API responses are slow

**Solution**:
1. Enable query logging
2. Add database indexes
3. Check network latency
4. Profile with Node.js tools:
```bash
node --inspect dist/index.js
```

## Debug Mode

Enable comprehensive debugging:

```bash
# Maximum verbosity
LOG_LEVEL=debug NODE_ENV=development pnpm dev

# Debug specific module
DEBUG=firma-sign:* pnpm dev

# Debug database queries
DEBUG=sqlite3 pnpm dev
```

## Logging

### Log Locations
- Console: Always in development
- Files: `${LOG_DIR}` in production
  - `error.log`: Errors only
  - `combined.log`: All logs

### Log Format
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "error",
  "message": "Error description",
  "service": "firma-sign-server",
  "stack": "Error stack trace"
}
```

## Getting Help

### Collect Information
Before reporting issues, collect:
1. Server version
2. Node.js version: `node --version`
3. Error messages from logs
4. Configuration (without secrets)
5. Steps to reproduce

### Support Channels
1. GitHub Issues: Bug reports
2. Discussions: Questions and help
3. Documentation: Check latest docs

## Health Checks

Monitor server health:
```bash
# Basic health check
curl http://localhost:8080/health

# Detailed status
curl http://localhost:8080/api/transports/available
```

## Recovery Procedures

### Full Reset
```bash
# Stop server
# Backup data if needed
cp -r ~/.firmasign ~/.firmasign.backup

# Reset everything
rm -rf ~/.firmasign
pnpm dev
```

### Partial Reset
```bash
# Reset database only
rm ~/.firmasign/firma-sign.db

# Reset transfers only
rm -rf ~/.firmasign/transfers

# Clear logs
rm -rf ~/.firmasign/logs/*
```