# Core Package Architecture

## Overview

The `@firmachain/firma-sign-core` package provides the foundational interfaces and utilities for the Firma-Sign transport system. It defines the contracts that all transport implementations must follow and provides common utilities.

## Design Principles

### 1. Interface-First Design
All major components are defined as TypeScript interfaces, allowing for:
- Multiple implementations
- Easy testing with mocks
- Clear contracts between components

### 2. Transport Agnostic
The core package doesn't implement any specific transport. It only defines:
- What a transport must do
- How data flows through transports
- Common data structures

### 3. Minimal Dependencies
Only essential dependencies are included:
- `zod` for runtime validation
- Native Node.js crypto for hashing

## Package Structure

```
src/
├── interfaces/          # Core interfaces
│   ├── transport.ts     # Transport interface
│   ├── document.ts      # Document types
│   ├── transfer.ts      # Transfer types
│   └── handler.ts       # Handler types
├── utils/              # Utility functions
│   ├── hash.ts         # Hashing utilities
│   ├── encryption.ts   # Encryption utilities
│   ├── validation.ts   # Validation functions
│   └── document-preparation.ts
└── index.ts           # Main exports
```

## Key Components

### Transport Interface
The central abstraction that enables multiple communication protocols:

```
Transport
├── Lifecycle (initialize, shutdown)
├── Operations (send, receive)
├── Metadata (name, version, capabilities)
└── Validation (validateConfig, getStatus)
```

### Document Model
Standardized document representation:

```
Document
├── Identification (id, fileName)
├── Content (data, mimeType, size)
├── Security (hash)
└── Metadata (custom fields)
```

### Transfer Flow
How documents move through the system:

```
OutgoingTransfer → Transport → Network → Transport → IncomingTransfer
      ↓                                                      ↓
DocumentPreparation                                   TransferHandler
```

## Type System

### Core Types
- **Value Objects**: Simple data carriers (Document, Recipient)
- **Interfaces**: Behavior contracts (Transport, Handler)
- **Type Aliases**: Convenience types (TransferStatus, ErrorCode)

### Type Safety
- Strict TypeScript configuration
- Runtime validation with Zod schemas
- Type guards for safe casting

## Utility Design

### Hash Utilities
- SHA-256 for document integrity
- Consistent hash format (hex string)
- Streaming support for large files

### Encryption Utilities
- RSA for key exchange
- AES for document encryption
- Forward secrecy considerations

### Validation Utilities
- ID format validation
- Hash format validation
- Document structure validation

## Extension Points

### Custom Transports
Implement the Transport interface:
1. Define capabilities
2. Implement lifecycle methods
3. Handle send/receive operations
4. Validate configuration

### Custom Handlers
Implement handler interfaces:
1. Process incoming transfers
2. Handle errors appropriately
3. Emit events as needed

## Error Handling

### Error Types
```
TransportError
├── code: Specific error code
├── transport: Which transport failed
├── message: Human-readable message
└── details: Additional context
```

### Error Codes
Standardized codes for common failures:
- Configuration errors
- Network failures
- Validation errors
- Encryption failures

## Performance Considerations

### Streaming
- Support for streaming large documents
- Chunked transfer capabilities
- Memory-efficient processing

### Async Operations
- All I/O operations are async
- Promise-based API
- Proper error propagation

## Security Architecture

### Data Protection
- Document hashing for integrity
- Encryption utilities for confidentiality
- Key management abstractions

### Validation
- Input validation at boundaries
- Type-safe internal operations
- Runtime schema validation

## Testing Strategy

### Unit Testing
- Pure functions in utils
- Interface compliance tests
- Error handling scenarios

### Integration Testing
- Transport implementation validation
- End-to-end transfer flows
- Performance benchmarks

## Future Considerations

### Planned Enhancements
1. Compression utilities
2. Signature verification
3. Progress callbacks
4. Batch operations

### Extensibility
- Plugin system for utilities
- Custom validation rules
- Middleware support

## Dependencies

### Runtime Dependencies
- `zod`: Schema validation

### Development Dependencies
- TypeScript toolchain
- Testing framework
- Build tools (tsup)

## Versioning

Follows semantic versioning:
- Major: Breaking interface changes
- Minor: New features, backward compatible
- Patch: Bug fixes

Breaking changes will be documented in migration guides.