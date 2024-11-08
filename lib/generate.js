'use strict';

const equal = require('fast-deep-equal');
const { serialize } = require('./utils');

/**
 * Generates a JSON Merge Patch (RFC 7396) by computing `B \ A` (set-theoretic difference),
 * where A is the 'before' state and B is the 'after' state of a JSON document.
 * The patch represents the changes needed to transform the 'before' value into the 'after' value.
 *
 * Key behaviors:
 * - If properties exist in 'after' but not in 'before', they are added to the patch
 * - If properties exist in 'before' but not in 'after', they are set to null in the patch
 * - If properties exist in both but with different values, the 'after' value is used
 * - Arrays are treated as atomic values - if they differ, the entire 'after' array is used
 * - RegExp objects are preserved in the patch
 * - Functions are not allowed and will throw an error
 *
 * @param {Object|Array|string|number|boolean|null} before - The source value to compare from
 * @param {Object|Array|string|number|boolean|null} after - The target value to compare to
 * @throws {Error} If either argument is a function
 * @returns {Object|Array|string|number|boolean|null} A JSON Merge Patch that transforms 'before' into 'after'
 *
 * @example
 * generate({ a: 'b' }, { a: 'c' })
 * // Returns: { a: 'c' }
 *
 * @example
 * generate({ a: 'b' }, { a: 'b', b: 'c' })
 * // Returns: { b: 'c' }
 *
 * @example
 * generate({ a: 'b' }, {})
 * // Returns: { a: null }
 *
 * @example
 * generate([1, 2], [1, 3])
 * // Returns: [1, 3]
 *
 * @see {@link https://tools.ietf.org/html/rfc7396|RFC 7396 - JSON Merge Patch}
 */
module.exports = function generate(before, after) {
  if ([before, after].some((arg) => typeof arg === 'function')) {
    throw new Error('invalid argument type: function');
  }

  if (after === null) {
    return null;
  }

  before = serialize(before);
  after = serialize(after);

  if (
    before === null ||
    typeof before !== typeof after ||
    Array.isArray(before) !== Array.isArray(after) ||
    after instanceof RegExp
  ) {
    return after;
  }

  if (equal(before, after)) {
    return {};
  }

  if (Array.isArray(before)) {
    if (before.length !== after.length) {
      return after;
    }

    for (let i = 0; i < before.length; i++) {
      if (!equal(before[i], after[i])) {
        return after;
      }
    }
  }

  const patch = {};
  const beforeKeys = Object.keys(before);
  const afterKeys = Object.keys(after);

  for (let i = 0; i < afterKeys.length; i++) {
    if (beforeKeys.indexOf(afterKeys[i]) === -1) {
      patch[afterKeys[i]] = serialize(after[afterKeys[i]]);
    }
  }

  for (let i = 0; i < beforeKeys.length; i++) {
    const key = beforeKeys[i];

    if (afterKeys.indexOf(key) === -1) {
      patch[key] = null;
    } else {
      if (before[key] !== null && typeof before[key] === 'object') {
        patch[key] = generate(before[key], after[key]);
      } else if (before[key] !== after[key]) {
        patch[key] = serialize(after[key]);
      }
    }
  }

  return patch;
};
