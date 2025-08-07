# Server Configuration

## Overview

The server uses a hierarchical configuration system to manage settings for itself and the loaded packages. Configuration can be provided through environment variables, JSON files, or defaults.

## Configuration Hierarchy

```
Environment Variables (Highest Priority)
         ↓
Configuration File (config.json)
         ↓
Default Values (Lowest Priority)
```

## Quick Start

```bash
# Copy example configuration
cp .env.example .env

# Start server with environment config
pnpm start

# Or use custom config file
CONFIG_PATH=./my-config.json pnpm start
```

## Server-Specific Configuration

### Core Server Settings

| Environment Variable      | Config Key                        | Default                 | Description                |
| ------------------------- | --------------------------------- | ----------------------- | -------------------------- |
| `NODE_ENV`                | -                                 | `development`           | Environment mode           |
| `PORT`                    | `server.port`                     | `8080`                  | HTTP server port           |
| `HOST`                    | `server.host`                     | `0.0.0.0`               | Server bind address        |
| `CORS_ORIGIN`             | `server.corsOrigin`               | `http://localhost:5173` | Allowed CORS origin        |
| `SESSION_SECRET`          | `server.sessionSecret`            | (generated)             | JWT signing secret         |
| `RATE_LIMIT_WINDOW_MS`    | `server.rateLimiting.windowMs`    | `900000`                | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `server.rateLimiting.maxRequests` | `100`                   | Max requests per window    |

### Storage Path Configuration

| Environment Variable | Config Key         | Default        |
| -------------------- | ------------------ | -------------- |
| `STORAGE_PATH`       | `storage.basePath` | `~/.firmasign` |

This path is used by both:

- **Database Package**: SQLite file location (`firma-sign.db`)
- **Storage Package**: Document storage root

### Logging

| Environment Variable | Config Key          | Default  |
| -------------------- | ------------------- | -------- |
| `LOG_LEVEL`          | `logging.level`     | `info`   |
| `LOG_DIR`            | `logging.directory` | `./logs` |

## Package Configuration

The server passes configuration to loaded packages. Each package has its own configuration requirements:

### Database Package Configuration

The server uses [@firmachain/firma-sign-database-sqlite](../../@firmachain/firma-sign-database-sqlite/README.md) with automatic configuration:

```javascript
// Server automatically configures:
{
	database: path.join(STORAGE_PATH, 'firma-sign.db');
}
```

### Storage Package Configuration

The server uses [@firmachain/firma-sign-storage-local](../../@firmachain/firma-sign-storage-local/README.md) with:

```javascript
// Server automatically configures:
{
  basePath: path.join(STORAGE_PATH, 'storage'),
  maxFileSize: 100 * 1024 * 1024,  // 100MB
  ensureDirectories: true,
  useChecksum: true
}
```

### Transport Package Configuration

Transport packages are configured based on installed packages and environment variables:

#### P2P Transport

When [@firmachain/firma-sign-transport-p2p](../../@firmachain/firma-sign-transport-p2p/docs/API.md) is installed:

| Environment Variable | Config Key                  | Default |
| -------------------- | --------------------------- | ------- |
| `P2P_PORT`           | `transports.p2p.port`       | `9090`  |
| `P2P_ENABLE_DHT`     | `transports.p2p.enableDHT`  | `true`  |
| `P2P_ENABLE_MDNS`    | `transports.p2p.enableMDNS` | `true`  |

See [P2P Transport Configuration](../../@firmachain/firma-sign-transport-p2p/docs/API.md#p2ptransportconfig) for full options.

#### Email Transport (Future)

When email transport package is installed:

| Environment Variable | Config Key                        |
| -------------------- | --------------------------------- |
| `SMTP_HOST`          | `transports.email.smtp.host`      |
| `SMTP_PORT`          | `transports.email.smtp.port`      |
| `SMTP_USER`          | `transports.email.smtp.auth.user` |
| `SMTP_PASS`          | `transports.email.smtp.auth.pass` |

## Configuration File Format

### Complete Example

```json
{
	"server": {
		"port": 8080,
		"host": "0.0.0.0",
		"corsOrigin": "https://app.example.com",
		"sessionSecret": "your-secret-key",
		"rateLimiting": {
			"windowMs": 900000,
			"maxRequests": 100
		}
	},
	"storage": {
		"basePath": "/var/firma-sign"
	},
	"transports": {
		"p2p": {
			"port": 9090,
			"enableDHT": true,
			"bootstrapNodes": ["/ip4/1.2.3.4/tcp/9090/p2p/QmBootstrapNode"]
		}
	},
	"logging": {
		"level": "info",
		"directory": "/var/log/firma-sign"
	}
}
```

## Environment-Specific Configurations

### Development

```bash
# .env.development
NODE_ENV=development
PORT=8080
LOG_LEVEL=debug
STORAGE_PATH=./dev-storage
P2P_ENABLE_DHT=false  # Use mDNS for local dev
```

### Production

```bash
# .env.production
NODE_ENV=production
PORT=8080
SESSION_SECRET=${SECRET_FROM_VAULT}
STORAGE_PATH=/var/firma-sign
LOG_LEVEL=info
P2P_ENABLE_DHT=true
P2P_PORT=9090
```

### Docker

```yaml
# docker-compose.yml
services:
  server:
    image: firmachain/firma-sign-server
    environment:
      - NODE_ENV=production
      - STORAGE_PATH=/data
      - P2P_PORT=9090
    volumes:
      - ./data:/data
      - ./config.json:/app/config.json:ro
    ports:
      - '8080:8080'
      - '9090:9090'
```

## Dynamic Transport Loading

The server automatically discovers installed transport packages. To add a transport:

```bash
# Install transport package
pnpm add @firmachain/firma-sign-transport-email

# Configure via environment
SMTP_HOST=smtp.gmail.com pnpm start

# Or via config.json
{
  "transports": {
    "email": {
      "smtp": { /* ... */ }
    }
  }
}
```

## Configuration Validation

The server validates configuration on startup using schemas from ConfigManager:

```bash
$ pnpm start
[ERROR] Configuration validation failed:
  - transports.p2p.port: Expected number, received string
```

## Security Notes

### Sensitive Values

Never commit these to version control:

- `SESSION_SECRET`
- `SMTP_PASS`
- `DISCORD_BOT_TOKEN`
- Private keys

### Best Practices

1. Use environment variables for secrets
2. Use `.env.local` (gitignored) for local development
3. Use secret management services in production
4. Rotate secrets regularly

## Troubleshooting Configuration

Enable debug logging to see loaded configuration:

```bash
LOG_LEVEL=debug pnpm start
```

This will show:

- Which config sources were loaded
- Final merged configuration
- Which transport packages were discovered
- Package initialization status

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common configuration issues.
