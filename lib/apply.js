'use strict';

const serialize = require('./utils').serialize;

/**
 * Applies a JSON Merge Patch to a target value as specified in RFC 7396.
 * Given target A and patch P, produces `A ∪ P` (set-theoretic union with patch precedence),
 * where null values in P indicate key deletion from A.
 * Modifies the target value to reflect the changes described in the patch.
 *
 * Key behaviors:
 * - If the patch contains null value, the key is deleted from target
 * - If patch key doesn't exist in target, it's added
 * - If both patch and target have the same key, target's value is replaced
 * - Arrays are handled atomically (entire array is replaced)
 * - RegExp objects are preserved
 * - Functions are not allowed and will throw
 * - Protects against prototype pollution
 *
 * @param {Object|Array|string|number|boolean|null} target - The value to patch (A)
 * @param {Object|Array|string|number|boolean|null} patch - The patch to apply (P)
 * @throws {Error} If either argument is a function
 * @returns {Object|Array|string|number|boolean|null} The patched target `A ∪ P` (same reference)
 * @warning This function modifies the target value in place
 *
 * @example
 * apply({ a: 'b', c: 'd' }, { a: 'x', c: null })
 * // Returns: { a: 'x' }  // Original ∪ Patch with deletion
 *
 * @example
 * apply({ a: [1, 2] }, { a: [1, 3] })
 * // Returns: { a: [1, 3] }  // Array replacement
 *
 * @see {@link https://tools.ietf.org/html/rfc7396|RFC 7396 - JSON Merge Patch}
 */
module.exports = function apply(target, patch) {
  if ([target, patch].some((arg) => typeof arg === 'function')) {
    throw new Error('invalid argument type: function');
  }

  if (patch === undefined) {
    return serialize(target);
  }

  if (patch === null) {
    return null;
  }

  patch = serialize(patch);
  if (patch instanceof RegExp || typeof patch !== 'object' || Array.isArray(patch)) {
    return patch;
  }

  if (
    target === null ||
    target === undefined ||
    typeof target !== 'object' ||
    Array.isArray(target) !== Array.isArray(patch)
  ) {
    target = {};
  }

  const keys = Object.keys(patch);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return target;
    }

    const value = patch[key];

    if (value === null) {
      delete target[key];
    } else {
      target[key] = apply(target[key], value);
    }
  }

  return target;
};
