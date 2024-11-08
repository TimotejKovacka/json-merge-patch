'use strict';

const equal = require('fast-deep-equal');

/**
 * Merges two JSON Merge Patches into a single patch that represents the combined changes.
 * The resulting patch represents `patch1 ∪ patch2` (set-theoretic union of the changes),
 * with patch2 taking precedence in case of conflicts.
 *
 * @warning This operation is not defined in RFC 7396 and may lead to unexpected results
 * when patches are designed to be applied sequentially. Use with caution and verify
 * the resulting patches meet your requirements.
 *
 * Key behaviors:
 * - patch2 values take precedence over patch1
 * - null values propagate through the merge (indicating deletion)
 * - Arrays are treated as atomic values
 * - RegExp objects are preserved
 * - Objects are merged recursively
 * - Non-matching types result in patch2's value being used
 *
 * @param {Object|Array|string|number|boolean|null} patch1 - The first patch to merge
 * @param {Object|Array|string|number|boolean|null} patch2 - The second patch to merge (takes precedence)
 * @returns {Object|Array|string|number|boolean|null} A merged patch combining both sets of changes
 *
 * @example
 * merge({ a: 'b' }, { c: 'd' })
 * // Returns: { a: 'b', c: 'd' }
 *
 * @example
 * merge({ a: 'b' }, { a: 'c' })
 * // Returns: { a: 'c' }
 *
 * @example
 * merge({ a: 'b' }, { a: null })
 * // Returns: { a: null }
 *
 * @example
 * merge({ a: { b: 'c' } }, { a: { d: 'e' } })
 * // Returns: { a: { b: 'c', d: 'e' } }
 *
 * @see {@link https://tools.ietf.org/html/rfc7396|RFC 7396 - JSON Merge Patch}
 */
module.exports = function merge(patch1, patch2) {
  if (patch2 === null) {
    return null;
  }

  if (
    patch1 === null ||
    typeof patch1 !== typeof patch2 ||
    Array.isArray(patch1) !== Array.isArray(patch2) ||
    patch2 instanceof RegExp ||
    equal(patch1, patch2)
  ) {
    return patch2;
  }

  if (Array.isArray(patch1)) {
    if (patch1.length !== patch2.length) {
      return patch2;
    }

    for (let i = 0; i < patch1.length; i++) {
      if (!equal(patch1[i], patch2[i])) {
        return patch2;
      }
    }
  }

  const patch = {};
  const patch1Keys = Object.keys(patch1);
  const patch2Keys = Object.keys(patch2);

  for (let i = 0; i < patch2Keys.length; i++) {
    if (patch1Keys.indexOf(patch2Keys[i]) === -1) {
      patch[patch2Keys[i]] = patch2[patch2Keys[i]];
    }
  }

  for (let i = 0; i < patch1Keys.length; i++) {
    const key = patch1Keys[i];

    if (patch2Keys.indexOf(key) === -1) {
      patch[key] = patch1[key];
    } else {
      if (patch1[key] !== null && typeof patch1[key] === 'object') {
        patch[key] = merge(patch1[key], patch2[key]);
      } else {
        patch[key] = patch2[key];
      }
    }
  }

  return patch;
};
