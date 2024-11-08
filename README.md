# json-merge-patch - JSON Merge Patch (RFC 7396)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![codecov](https://codecov.io/gh/TimotejKovacka/json-merge-patch/branch/main/graph/badge.svg)](https://codecov.io/gh/USERNAME/REPO)

A minimal implementation of JSON Merge Patch ([RFC 7396](https://datatracker.ietf.org/doc/html/rfc7396)) for Node.js, providing utilities for generating and applying patches to JSON documents. Inspired by the popular [json-merge-patch](https://www.npmjs.com/package/json-merge-patch) package but with improved features and security.

## Features

- Full RFC 7396 compliance
- Single dependency ([fast-deep-equal](https://www.npmjs.com/package/fast-deep-equal))
- Works with any valid JSON structure
- Handles RegExp, Function value objects (except at top-level)
- Protection against prototype pollution
- TypeScript definitions included
- Comprehensive test coverage
- Performant implementation

## Installation

```bash
npm install json-merge-patch
# or
yarn add json-merge-patch
# or
pnpm add json-merge-patch
```

## Usage

### Basic Usage

```javascript
const { apply, generate } = require('json-merge-patch');

// Generate a patch
const original = { a: 'b', c: 'd' };
const modified = { a: 'x', d: 'e' };
const patch = generate(original, modified);
// patch = { a: 'x', c: null, d: 'e' }

// Apply a patch
const target = { a: 'b', c: 'd' };
const result = apply(target, patch);
// result = { a: 'x', d: 'e' }
```

### Advanced Usage

#### Merging Patches (Experimental)

```javascript
const { merge } = require('json-merge-patch');

const patch1 = { a: 'b', c: null };
const patch2 = { a: 'c', d: 'e' };
const merged = merge(patch1, patch2);
// merged = { a: 'c', c: null, d: 'e' }
```

> ⚠️ Warning: The merge operation is not defined in RFC 7396 and should be used with caution. It may lead to unexpected results when patches are designed to be applied sequentially.

### API

#### generate(before, after)

Generates a JSON Merge Patch representing the changes needed to transform `before` into `after`. In set theory notation, this represents B \ A (set-theoretic difference) where A is the 'before' state and B is the 'after' state.

```javascript
const patch = generate(
  { a: 'b', c: 'd' }, // before
  { a: 'x', d: 'e' }, // after
);
// patch = { a: 'x', c: null, d: 'e' }
```

#### apply(target, patch)

Applies a JSON Merge Patch to a target document. Given target A and patch P, produces A ∪ P (set-theoretic union with patch precedence). Modifies the target document in place.

```javascript
const result = apply(
  { a: 'b', c: 'd' }, // target
  { a: 'x', c: null }, // patch
);
// result = { a: 'x' }
```

#### merge(patch1, patch2) [Experimental]

Merges two JSON Merge Patches into a single patch. Represents patch1 ∪ patch2 (set-theoretic union of the changes), with patch2 taking precedence in case of conflicts.

### Behavior

- Null values in patches indicate property deletion
- Arrays are handled atomically (entire array is replaced)
- RegExp objects are preserved
- Functions throw errors when used as values
- Includes protection against prototype pollution
- Objects are merged recursively
- Handles all JSON-compatible data types

### Examples

#### Complex Objects

```javascript
const before = {
  title: 'Hello',
  author: { name: 'John' },
  tags: ['a', 'b'],
};

const after = {
  title: 'Hello World',
  author: { name: 'John', email: 'john@example.com' },
  tags: ['a', 'c'],
};

const patch = generate(before, after);
// patch = {
// title: 'Hello World',
// author: { email: 'john@example.com' },
// tags: ['a', 'c']
// }
```

### Error Handling

```javascript
try {
  apply(target, { fn: () => {} });
} catch (error) {
  // Throws: invalid argument type: function
}
```

### Contributing

Contributions are welcome! Please read our contributing guide for details on our code of conduct and the process for submitting pull requests.

### License

MIT License - see the LICENSE file for details

### See Also

- [RFC 7396 - JSON Merge Patch](https://datatracker.ietf.org/doc/html/rfc7396)
- [RFC 6902 - JavaScript Object Notation (JSON) Patch](https://datatracker.ietf.org/doc/html/rfc6902)
