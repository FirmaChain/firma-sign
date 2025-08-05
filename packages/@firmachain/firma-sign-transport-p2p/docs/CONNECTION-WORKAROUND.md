# P2P Connection Multiaddr Resolution

## Issue (Resolved)

The libp2p library expects a `Multiaddr` object when dialing peers. Previously, the `@multiformats/multiaddr` package was not included as a dependency, which caused the error:

```
TypeError: multiaddrs[0].getPeerId is not a function
```

## Solution Implemented

The issue has been resolved by adding `@multiformats/multiaddr` as a dependency in package.json:

```json
"dependencies": {
  "@multiformats/multiaddr": "^12.3.4"
}
```

## Current Implementation

The P2PTransport class now properly uses the multiaddr package:

```typescript
import { multiaddr } from '@multiformats/multiaddr';

// In connectToPeer method:
const ma = multiaddr(multiaddrStr);
const connection = await this.node.dial(ma);
```

The connection flow now works as follows:

1. **Direct Peer ID Connection**: If the peer is already known (via discovery), try connecting using just the peer ID
2. **Multiaddr Parsing**: Parse the multiaddr string using the proper multiaddr package
3. **Connection**: Dial the peer using the parsed Multiaddr object

## Testing

Use the test-connection script to verify connectivity:

```bash
pnpm tsx scripts/test-connection.ts /ip4/127.0.0.1/tcp/9090/p2p/12D3KooW...
```

This script implements the same workaround strategies to help diagnose connection issues.