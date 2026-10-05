# API Documentation

Mother-Root provides a simple API for root-level operations management.

## Core Module

### `mothRoot.version`

Returns the current version of Mother-Root.

**Type:** `String`

**Example:**
```javascript
const mothRoot = require('mother-root');
console.log(mothRoot.version); // '0.1.0'
```

## Configuration

Configuration is managed through `config/example.json`. Copy this file to `config/config.json` for production use.

### Configuration Properties

| Property | Type | Description |
|----------|------|-------------|
| `environment` | string | Development or production |
| `debug` | boolean | Enable debug logging |
| `logLevel` | string | Log level (info, warn, error) |
| `port` | number | Server port |
| `features` | object | Feature flags |

## Examples

### Basic Setup

```javascript
const mothRoot = require('mother-root');
console.log('Mother-Root version:', mothRoot.version);
```

### Configuration

```json
{
  "environment": "production",
  "debug": false,
  "logLevel": "error",
  "port": 8080
}
```

## Advanced Topics

- [Custom Plugins](./PLUGINS.md)
- [Performance Optimization](./PERFORMANCE.md)
- [Security Best Practices](./SECURITY.md)
