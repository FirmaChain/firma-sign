# Architecture

## Overview

The Local Storage package provides a file system-based storage implementation for the Firma-Sign system. It implements the Storage interface from @firmachain/firma-sign-core and provides secure, efficient local file management.

## Design Principles

### 1. Simplicity

- Direct file system operations
- No external dependencies beyond Node.js
- Clear, predictable behavior

### 2. Security

- Path traversal prevention
- Configurable permissions
- Input sanitization

### 3. Performance

- Stream support for large files
- Efficient directory operations
- Minimal memory footprint

## Component Architecture

```
LocalStorage
├── Path Management
│   ├── Path Resolution
│   ├── Path Validation
│   └── Path Sanitization
├── File Operations
│   ├── Read/Write
│   ├── Stream Operations
│   └── Atomic Operations
├── Directory Operations
│   ├── Creation
│   ├── Listing
│   └── Deletion
└── Error Handling
    ├── File System Errors
    ├── Permission Errors
    └── Storage Errors
```

## File System Layout

### Standard Directory Structure

```
basePath/
├── transfers/
│   ├── outgoing/
│   │   └── {transferId}/
│   │       ├── documents/
│   │       ├── metadata.json
│   │       └── signed/
│   └── incoming/
│       └── {senderId}-{transferId}/
│           ├── sender.json
│           ├── documents/
│           └── signed/
├── temp/
│   └── {tempId}/
└── archive/
    └── {year}/
        └── {month}/
```

## Data Flow

### Write Operations

1. Path validation and sanitization
2. Directory creation if needed
3. Atomic write with temporary file
4. Move to final location
5. Return storage result

### Read Operations

1. Path validation
2. Check file existence
3. Read file or create stream
4. Handle errors gracefully
5. Return data or stream

## Security Model

### Path Security

- All paths are resolved relative to base path
- Prevent directory traversal attacks
- Validate path components
- Sanitize file names

### Permission Model

- Configurable file permissions
- Directory permissions inheritance
- User/group ownership preservation
- Read-only mode support

## Performance Characteristics

### File Operations

- O(1) file access by path
- Stream support for any size
- Atomic writes prevent corruption
- Efficient buffer management

### Directory Operations

- Lazy directory creation
- Batch operations support
- Recursive operations optimized
- Minimal stat calls

## Error Handling Strategy

### Error Types

1. **File Not Found**: Clear error with path
2. **Permission Denied**: Security context
3. **Disk Full**: Space management
4. **Path Invalid**: Validation errors

### Recovery Mechanisms

- Automatic retry for transient errors
- Cleanup of partial operations
- Transaction-like semantics
- Graceful degradation

## Caching Strategy

### Metadata Caching

- File existence checks cached
- Directory listings cached
- Stats cached with TTL
- Cache invalidation on write

### No Content Caching

- Files always read fresh
- Streams not buffered
- Direct filesystem access
- OS-level caching utilized

## Scalability Considerations

### File Count Limits

- Efficient with millions of files
- Directory sharding if needed
- Hierarchical organization
- Archive old transfers

### Storage Limits

- Monitor disk space
- Implement quotas
- Cleanup strategies
- Compression support

## Platform Compatibility

### Operating Systems

- Linux: Full support
- macOS: Full support
- Windows: Path handling adapted
- Docker: Volume mounting

### File Systems

- ext4: Optimal
- NTFS: Supported
- APFS: Supported
- Network FS: With limitations

## Testing Strategy

### Unit Tests

- Path manipulation
- Error conditions
- Permission handling
- Stream operations

### Integration Tests

- Full file lifecycle
- Directory operations
- Concurrent access
- Large file handling

## Future Enhancements

### Planned Features

1. File compression
2. Encryption at rest
3. Versioning support
4. Deduplication

### Performance Improvements

1. Parallel operations
2. Memory-mapped files
3. Read-ahead caching
4. Write coalescing

## Configuration Best Practices

### Development

```typescript
{
  basePath: './dev-storage',
  permissions: 0o755
}
```

### Production

```typescript
{
  basePath: '/var/lib/firma-sign',
  permissions: 0o700
}
```

### Testing

```typescript
{
  basePath: tmpdir(),
  permissions: 0o777
}
```
