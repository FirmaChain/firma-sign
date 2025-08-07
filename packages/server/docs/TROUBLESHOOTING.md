# Troubleshooting Guide

## Common Issues and Solutions

### Server Startup Issues

#### Port Already in Use

**Error:**

```
Error: listen EADDRINUSE: address already in use :::8080
```

**Solution:**

1. Find the process using the port:
   ```bash
   lsof -i :8080
   ```
2. Kill the process:
   ```bash
   kill -9 <PID>
   ```
3. Or use a different port:
   ```bash
   PORT=8081 pnpm start
   ```

#### Database Initialization Failed

**Error:**

```
Error: SQLITE_CANTOPEN: unable to open database file
```

**Solution:**

1. Check directory permissions:
   ```bash
   ls -la ~/.firmasign/
   ```
2. Create directory manually:
   ```bash
   mkdir -p ~/.firmasign
   chmod 755 ~/.firmasign
   ```
3. Use a different storage path:
   ```bash
   STORAGE_PATH=/tmp/firmasign pnpm start
   ```

#### Configuration Validation Failed

**Error:**

```
Configuration validation failed: transports.email.smtp.host: Required
```

**Solution:**

1. Check your `.env` file has all required values
2. Verify environment variables are loaded:
   ```bash
   LOG_LEVEL=debug pnpm start
   ```
3. Remove invalid configuration from `config.json`

### Transport Issues

#### Transport Package Not Loading

**Symptom:** Transport not appearing in available transports list

**Debug Steps:**

1. Verify package is installed:

   ```bash
   pnpm ls @firmachain/firma-sign-transport-p2p
   ```

2. Check for loading errors:

   ```bash
   LOG_LEVEL=debug pnpm start 2>&1 | grep transport
   ```

3. Verify package exports correct interface:
   ```javascript
   // Test in Node REPL
   const transport = await import('@firmachain/firma-sign-transport-p2p');
   console.log(transport.P2PTransport);
   ```

**Solutions:**

- Reinstall the package: `pnpm add @firmachain/firma-sign-transport-p2p`
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Check package version compatibility

#### P2P Connection Failed

**Error:**

```
Transport error in p2p: Error: Connection timeout
```

**Debug Steps:**

1. Check firewall settings:

   ```bash
   # macOS
   sudo pfctl -s rules | grep 9090

   # Linux
   sudo iptables -L | grep 9090
   ```

2. Test local connectivity:

   ```bash
   telnet localhost 9090
   ```

3. Check mDNS discovery:
   ```bash
   dns-sd -B _p2p._tcp  # macOS
   avahi-browse -a      # Linux
   ```

**Solutions:**

- Allow port in firewall
- Disable DHT and use only mDNS for local testing
- Use bootstrap nodes for DHT

#### Email Transport Not Sending

**Error:**

```
SMTP Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Solutions:**

1. Use app-specific password (Gmail):
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"

2. Enable less secure apps (not recommended)

3. Use OAuth2 authentication:
   ```json
   {
   	"transports": {
   		"email": {
   			"smtp": {
   				"service": "gmail",
   				"auth": {
   					"type": "OAuth2",
   					"user": "user@gmail.com",
   					"clientId": "...",
   					"clientSecret": "...",
   					"refreshToken": "..."
   				}
   			}
   		}
   	}
   }
   ```

### Storage Issues

#### Disk Space Error

**Error:**

```
StorageError: ENOSPC: no space left on device
```

**Debug:**

```bash
# Check disk usage
df -h

# Find large files in storage
du -sh ~/.firmasign/* | sort -h

# Check transfer count
sqlite3 ~/.firmasign/firma-sign.db "SELECT COUNT(*) FROM transfers;"
```

**Solutions:**

1. Clean old transfers:

   ```sql
   DELETE FROM transfers WHERE createdAt < datetime('now', '-30 days');
   ```

2. Move storage to larger disk:

   ```bash
   STORAGE_PATH=/mnt/large-disk/firmasign pnpm start
   ```

3. Implement automatic cleanup policy

#### File Permission Denied

**Error:**

```
Error: EACCES: permission denied, open '/var/firmasign/transfers/...'
```

**Solutions:**

1. Fix ownership:

   ```bash
   sudo chown -R $(whoami):$(whoami) /var/firmasign
   ```

2. Fix permissions:

   ```bash
   chmod -R 755 /var/firmasign
   ```

3. Run with appropriate user

### Database Issues

#### Database Locked

**Error:**

```
SQLITE_BUSY: database is locked
```

**Causes:**

- Multiple server instances
- Unclosed database connections
- Long-running transactions

**Solutions:**

1. Ensure single instance:

   ```bash
   ps aux | grep "firma-sign"
   ```

2. Enable WAL mode:

   ```sql
   sqlite3 ~/.firmasign/firma-sign.db "PRAGMA journal_mode=WAL;"
   ```

3. Increase timeout:
   ```javascript
   db.configure('busyTimeout', 5000);
   ```

#### Database Corruption

**Error:**

```
SQLITE_CORRUPT: database disk image is malformed
```

**Recovery Steps:**

1. Backup corrupted database:

   ```bash
   cp ~/.firmasign/firma-sign.db ~/.firmasign/firma-sign.db.corrupt
   ```

2. Try to recover:

   ```bash
   sqlite3 ~/.firmasign/firma-sign.db.corrupt ".recover" | sqlite3 ~/.firmasign/firma-sign.db.new
   ```

3. Export and reimport:
   ```bash
   sqlite3 ~/.firmasign/firma-sign.db.corrupt .dump > backup.sql
   sqlite3 ~/.firmasign/firma-sign.db.new < backup.sql
   ```

### WebSocket Issues

#### Connection Refused

**Error in client:**

```
WebSocket connection to 'ws://localhost:8080' failed
```

**Debug:**

1. Check server is running:

   ```bash
   curl http://localhost:8080/health
   ```

2. Test WebSocket directly:
   ```bash
   wscat -c ws://localhost:8080
   ```

**Solutions:**

- Check CORS configuration matches client origin
- Verify WebSocket upgrade headers are allowed
- Check reverse proxy configuration (nginx/Apache)

#### Connection Drops

**Symptom:** WebSocket disconnects after period of inactivity

**Solutions:**

1. Implement heartbeat/ping-pong:

   ```javascript
   // Client
   setInterval(() => {
   	socket.send('ping');
   }, 30000);
   ```

2. Configure proxy timeouts (nginx):

   ```nginx
   proxy_read_timeout 86400;
   proxy_send_timeout 86400;
   ```

3. Handle reconnection in client

### API Issues

#### Rate Limit Exceeded

**Error:**

```
429 Too Many Requests
X-RateLimit-Remaining: 0
```

**Solutions:**

1. Increase rate limit:

   ```bash
   RATE_LIMIT_MAX_REQUESTS=200 pnpm start
   ```

2. Implement request queuing in client

3. Use different rate limits per endpoint

#### Request Timeout

**Error:**

```
Error: Request timeout of 30000ms exceeded
```

**Solutions:**

1. Increase timeout for large files:

   ```javascript
   axios.post('/api/transfers/create', data, {
   	timeout: 60000, // 60 seconds
   });
   ```

2. Use streaming for large uploads

3. Implement chunked upload

### Performance Issues

#### High Memory Usage

**Symptoms:**

- Server using > 1GB RAM
- Slow response times
- Out of memory errors

**Debug:**

```bash
# Monitor memory usage
node --inspect src/index.js

# Profile memory
node --heap-prof src/index.js
```

**Solutions:**

1. Limit concurrent operations:

   ```javascript
   const queue = new PQueue({ concurrency: 5 });
   ```

2. Stream large files instead of buffering

3. Implement garbage collection:
   ```javascript
   if (global.gc) {
   	setInterval(() => {
   		global.gc();
   	}, 60000);
   }
   ```

#### Slow Database Queries

**Debug:**

```sql
-- Enable query plan
EXPLAIN QUERY PLAN SELECT * FROM transfers WHERE status = 'pending';

-- Check indexes
.indexes transfers
```

**Solutions:**

1. Add indexes:

   ```sql
   CREATE INDEX idx_transfers_status ON transfers(status);
   CREATE INDEX idx_documents_transferId ON documents(transferId);
   ```

2. Optimize queries:

   ```javascript
   // Bad: N+1 query
   for (const transfer of transfers) {
   	const docs = await getDocuments(transfer.id);
   }

   // Good: Join query
   const transfersWithDocs = await getTransfersWithDocuments();
   ```

### Docker Issues

#### Container Won't Start

**Debug:**

```bash
# Check logs
docker logs firma-sign-server

# Interactive debug
docker run -it --entrypoint /bin/sh firma-sign-server
```

**Common Solutions:**

- Check environment variables are passed correctly
- Verify volume mounts have correct permissions
- Ensure all required packages are in Dockerfile

#### Container Can't Connect to Host Services

**Solution:**
Use host networking or proper DNS:

```yaml
# docker-compose.yml
services:
  server:
    network_mode: host
    # OR
    extra_hosts:
      - 'host.docker.internal:host-gateway'
```

### Logging and Debugging

#### Enable Debug Logging

```bash
# Maximum verbosity
LOG_LEVEL=debug pnpm start

# Log to file
LOG_LEVEL=debug pnpm start 2>&1 | tee debug.log

# Filter specific components
LOG_LEVEL=debug pnpm start 2>&1 | grep -i transport
```

#### Analyze Logs

```bash
# Find errors
grep ERROR logs/*.log

# Count by level
grep -c "level\":\"error" logs/*.log

# Recent errors
tail -f logs/error.log
```

#### Debug with VS Code

1. Create launch configuration:

```json
{
	"type": "node",
	"request": "launch",
	"name": "Debug Server",
	"program": "${workspaceFolder}/src/index.ts",
	"runtimeArgs": ["-r", "tsx/cjs"],
	"env": {
		"LOG_LEVEL": "debug",
		"NODE_ENV": "development"
	}
}
```

2. Set breakpoints in code
3. Start debugging (F5)

### Health Checks

#### Basic Health Check

```bash
# Check if server is running
curl http://localhost:8080/health

# Detailed health check
curl http://localhost:8080/health?detailed=true
```

#### Monitor Server

```bash
# Simple monitoring script
while true; do
  if ! curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "Server is down!"
    # Send alert or restart
  fi
  sleep 30
done
```

### Recovery Procedures

#### Full System Reset

```bash
# Stop server
pkill -f firma-sign

# Backup data
tar -czf backup-$(date +%Y%m%d).tar.gz ~/.firmasign

# Clear all data
rm -rf ~/.firmasign/*

# Restart
pnpm start
```

#### Restore from Backup

```bash
# Stop server
systemctl stop firma-sign

# Restore backup
tar -xzf backup-20240101.tar.gz -C ~/

# Start server
systemctl start firma-sign
```

### Getting Help

#### Collect Debug Information

```bash
# Create debug bundle
mkdir debug-bundle
cp ~/.firmasign/logs/*.log debug-bundle/
cp .env debug-bundle/env.txt
pnpm ls > debug-bundle/packages.txt
node -v > debug-bundle/node-version.txt
tar -czf debug-bundle.tar.gz debug-bundle/
```

#### Report Issues

When reporting issues, include:

1. Error messages and stack traces
2. Steps to reproduce
3. Environment details (OS, Node version)
4. Configuration (sanitized)
5. Recent logs

Report to: https://github.com/firmachain/firma-sign/issues
