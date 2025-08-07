# Firma-Sign

> **Zero‑friction digital signatures — anywhere, any device, no lock‑in.**  
> Decentralized document signing with multi-protocol transport support.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run frontend application
pnpm -F frontend dev

# Build all packages
pnpm build
```

## 📦 Project Structure

```
firma-sign/
├── packages/
│   ├── frontend/                         # React 19 web app ✅
│   ├── server/                          # Backend server ❌ (not implemented)
│   └── @firmachain/                     # NPM packages
│       ├── firma-sign-core/             # Interfaces & utils ✅
│       ├── firma-sign-documents/        # PDF editor ✅
│       ├── firma-sign-database-sqlite/  # SQLite adapter ✅
│       ├── firma-sign-storage-local/    # File storage ✅
│       └── firma-sign-transport-p2p/    # P2P transport ✅
```

## ✅ What's Implemented

| Package             | Status         | Description                             |
| ------------------- | -------------- | --------------------------------------- |
| **Frontend**        | ✅ Complete    | React 19 app with PDF upload and editor |
| **Core**            | ✅ Complete    | Base interfaces for transport/storage   |
| **Documents**       | ✅ Complete    | PDF viewer/editor with 15+ components   |
| **Database**        | ✅ Complete    | SQLite with repositories                |
| **Storage**         | ✅ Complete    | Secure local filesystem storage         |
| **P2P Transport**   | ✅ Complete    | libp2p with NAT traversal               |
| **Server**          | ❌ Not Started | Only stubs exist                        |
| **Email Transport** | ❌ Not Started | Planned                                 |
| **Blockchain**      | ❌ Not Started | Planned                                 |

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4
- **PDF**: pdf.js, react-pdf, pdf-lib
- **P2P**: libp2p (TCP/WebSocket/WebRTC)
- **Database**: SQLite with better-sqlite3
- **Build**: pnpm workspaces, tsup, Vitest

## 📚 Documentation

Each package has comprehensive documentation:

- `packages/*/README.md` - Package overview
- `packages/*/docs/` - Detailed documentation
- `CLAUDE.md` - AI assistant context

## 🏗️ Architecture

### Multi-Protocol Transport

```
Application
    ↓
Transport Manager
    ├── P2P (libp2p) ✅
    ├── Email (SMTP/IMAP) ❌
    ├── Discord Bot ❌
    └── Web Links ❌
```

### Storage Abstraction

```
Application
    ↓
Storage Manager
    ├── Local Filesystem ✅
    ├── AWS S3 ❌
    ├── Azure Blob ❌
    └── IPFS ❌
```

## 💻 Development

```bash
# Development commands
pnpm dev        # Run in dev mode
pnpm build      # Build all packages
pnpm test       # Run tests
pnpm lint       # Check code quality

# Package-specific commands
pnpm -F frontend dev              # Run frontend only
pnpm -F @firmachain/* build       # Build all @firmachain packages
```

### Important Rules

1. **Always use pnpm** for package management
2. **TypeScript strict mode** required
3. **No unnecessary comments** in code
4. Run `pnpm lint` before committing

## 📦 NPM Packages

Published under `@firmachain` organization:

- `@firmachain/firma-sign-core`
- `@firmachain/firma-sign-documents`
- `@firmachain/firma-sign-database-sqlite`
- `@firmachain/firma-sign-storage-local`
- `@firmachain/firma-sign-transport-p2p`

## 🎯 Current Focus

The project has a modular architecture with most packages implemented. The main missing piece is the **server package** that ties everything together. Frontend and all supporting packages are ready.

## 📄 License

MIT
