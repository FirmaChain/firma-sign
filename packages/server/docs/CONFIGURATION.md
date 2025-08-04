# Configuration

## Environment Variables

The server uses environment variables for configuration. Copy `.env.example` to `.env` and update as needed.

### Server Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `8080` | No |
| `HOST` | Server host | `0.0.0.0` | No |

### Logging

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | `info` | No |
| `LOG_DIR` | Directory for log files | `./logs` | No |

### Storage

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `STORAGE_PATH` | Base path for document storage | `~/.firmasign` | No |

### Security

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` | No |
| `SESSION_SECRET` | Secret for session signing | Random | Yes |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `900000` (15 min) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |

### Transport Configuration

#### P2P Transport

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `P2P_PORT` | P2P listening port | `9090` | No |
| `P2P_ENABLE_DHT` | Enable DHT discovery | `true` | No |

#### Email Transport

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SMTP_HOST` | SMTP server host | - | When using email |
| `SMTP_PORT` | SMTP server port | `587` | No |
| `SMTP_USER` | SMTP username | - | When using email |
| `SMTP_PASS` | SMTP password | - | When using email |
| `IMAP_HOST` | IMAP server host | - | When using email |
| `IMAP_PORT` | IMAP server port | `993` | No |

#### Discord Transport

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DISCORD_BOT_TOKEN` | Discord bot token | - | When using Discord |

#### Telegram Transport

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | - | When using Telegram |

## Configuration Examples

### Development Configuration
```env
NODE_ENV=development
PORT=8080
LOG_LEVEL=debug
STORAGE_PATH=./dev-storage
CORS_ORIGIN=http://localhost:5173
SESSION_SECRET=dev-secret-change-in-production
```

### Production Configuration
```env
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
LOG_LEVEL=info
LOG_DIR=/var/log/firma-sign
STORAGE_PATH=/var/firma-sign/storage
CORS_ORIGIN=https://app.example.com
SESSION_SECRET=your-secure-random-secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50
```

### Email Transport Configuration
```env
# Gmail Example
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
```

### Multi-Transport Configuration
```env
# Enable multiple transports
P2P_PORT=9090
P2P_ENABLE_DHT=true

SMTP_HOST=smtp.example.com
SMTP_USER=firma@example.com
SMTP_PASS=secure-password
IMAP_HOST=imap.example.com

DISCORD_BOT_TOKEN=your-discord-bot-token
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

## Runtime Configuration

Some configuration can be changed at runtime through the API:

### Transport Configuration
```typescript
// Configure transport at runtime
await transportManager.configure('email', {
  smtp: {
    host: 'smtp.example.com',
    port: 587,
    auth: {
      user: 'user@example.com',
      pass: 'password'
    }
  }
});
```

### Storage Configuration
The storage path is set at startup and cannot be changed at runtime.

## Security Considerations

1. **Never commit `.env` files** to version control
2. **Use strong secrets** in production
3. **Restrict CORS origins** to trusted domains
4. **Enable rate limiting** to prevent abuse
5. **Use environment-specific** configurations

## Configuration Validation

The server validates configuration on startup:
- Required variables must be present
- Port numbers must be valid
- File paths must be accessible
- Transport configs are validated by each transport

## Default Ports

- HTTP API: 8080
- WebSocket: Same as HTTP (8080)
- P2P: 9090

## Storage Structure

Based on `STORAGE_PATH`:
```
${STORAGE_PATH}/
├── transfers/
│   ├── outgoing/
│   └── incoming/
├── config/
├── logs/
└── firma-sign.db
```