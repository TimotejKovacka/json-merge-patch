'use strict';

const apply = require('../lib/apply');
const generate = require('../lib/generate');
const merge = require('../lib/merge');

describe('apply', () => {
  describe('basic operations', () => {
    it('should not modify when patches are identical', () => {
      const target = { a: 'b' };

      expect(apply(target, generate(target, target))).toStrictEqual({ a: 'b' });
    });

    it('should replace an attribute', () => {
      const target = { a: 'b' };
      const patch = { a: 'c' };

      expect(apply(target, patch)).toStrictEqual({ a: 'c' });
    });

    it('should add an attribute', () => {
      const target = { a: 'b' };
      const patch = { b: 'c' };

      expect(apply(target, patch)).toStrictEqual({ a: 'b', b: 'c' });
    });

    it('should delete attribute', () => {
      const target = { a: 'b' };
      const patch = { a: null };

      expect(apply(target, patch)).toStrictEqual({});
    });

    it('should delete attribute without affecting others', () => {
      const target = { a: 'b', b: 'c' };
      const patch = { a: null };

      expect(apply(target, patch)).toStrictEqual({ b: 'c' });
    });
  });

  describe('type conversions', () => {
    it('should replace array with string', () => {
      const target = { a: ['b'] };
      const patch = { a: 'c' };

      expect(apply(target, patch)).toStrictEqual({ a: 'c' });
    });

    it('should replace string with array', () => {
      const target = { a: 'c' };
      const patch = { a: ['b'] };

      expect(apply(target, patch)).toStrictEqual({ a: ['b'] });
    });

    it('should replace object array with number array', () => {
      const target = { a: [{ b: 'c' }] };
      const patch = { a: [1] };

      expect(apply(target, patch)).toStrictEqual({ a: [1] });
    });

    it('should replace array entirely', () => {
      const target = ['a', 'b'];
      const patch = ['c', 'd'];

      expect(apply(target, patch)).toStrictEqual(['c', 'd']);
    });

    it('should replace object with array', () => {
      const target = { a: 'b' };
      const patch = ['c'];

      expect(apply(target, patch)).toStrictEqual(['c']);
    });

    it('should handle boolean conversions', () => {
      const target = { a: true };
      const patch = { a: 'true' };

      expect(apply(target, patch)).toStrictEqual({ a: 'true' });
    });

    it('should handle number conversions', () => {
      const target = { a: '123' };
      const patch = { a: 123 };

      expect(apply(target, patch)).toStrictEqual({ a: 123 });
    });
  });

  describe('null handling', () => {
    it('should replace object with null', () => {
      const target = { a: 'foo' };
      const patch = null;

      expect(apply(target, patch)).toStrictEqual(null);
    });

    it('should not change null attributes', () => {
      const target = { e: null };
      const patch = { a: 1 };

      expect(apply(target, patch)).toStrictEqual({ e: null, a: 1 });
    });

    it('should not set an attribute to null', () => {
      const target = [1, 2];
      const patch = { a: 'b', c: null };

      expect(apply(target, patch)).toStrictEqual({ a: 'b' });
    });

    it('should not set an attribute to null in a sub object', () => {
      const target = {};
      const patch = { a: { bb: { ccc: null } } };

      expect(apply(target, patch)).toStrictEqual({ a: { bb: {} } });
    });
  });

  describe('error cases', () => {
    it('should handle function values', () => {
      const normal = { a: 'b' };
      const fn = () => {};

      expect(() => apply(normal, fn)).toThrow();
      expect(() => apply(fn, normal)).toThrow();
    });
  });

  describe('special cases', () => {
    it('should treat the target as empty', () => {
      const target = undefined;
      const patch = { a: 'b' };

      expect(apply(target, patch)).toStrictEqual(patch);
    });

    it('should do nothing', () => {
      const target = { a: 'b' };
      const patch = undefined;

      expect(apply(target, patch)).toStrictEqual(target);
    });

    it('should apply recursively', () => {
      const target = { a: { b: 'c' } };
      const patch = { a: { b: 'd', c: null } };

      expect(apply(target, patch)).toStrictEqual({ a: { b: 'd' } });
    });

    it('should handle toJSON implementations', () => {
      const target = { a: 'foo' };
      const patch = { a: new Date('2024-11-08T00:00:00.000Z') };

      expect(apply(target, patch)).toStrictEqual({
        a: '2024-11-08T00:00:00.000Z',
      });
    });

    it('should replace an object with a string', () => {
      const target = { a: 'foo' };
      const patch = 'bar';

      expect(apply(target, patch)).toStrictEqual('bar');
    });

    it('should handle deep nested object deletion', () => {
      const target = { a: { b: { c: { d: 'value' } } } };
      const patch = { a: { b: { c: null } } };

      expect(apply(target, patch)).toStrictEqual({ a: { b: {} } });
    });

    it('should handle mixed nested operations', () => {
      const target = { a: { b: { c: 'old', d: 'keep' }, e: 'old' } };
      const patch = { a: { b: { c: 'new' }, f: 'add' } };

      expect(apply(target, patch)).toStrictEqual({
        a: { b: { c: 'new', d: 'keep' }, f: 'add', e: 'old' },
      });
    });

    it('should handle empty arrays', () => {
      const target = { arr: [1, 2, 3] };
      const patch = { arr: [] };

      expect(apply(target, patch)).toStrictEqual({ arr: [] });
    });

    it('should handle arrays with mixed types', () => {
      const target = { arr: [1, 'string', { a: 'b' }] };
      const patch = { arr: [null, undefined, 3] };

      expect(apply(target, patch)).toStrictEqual({ arr: [null, undefined, 3] });
    });

    it('should handle NaN values', () => {
      const target = { a: 1 };
      const patch = { a: NaN };

      expect(apply(target, patch)).toStrictEqual({ a: NaN });
    });

    it('should handle Infinity values', () => {
      const target = { a: 1 };
      const patch = { a: Infinity };

      expect(apply(target, patch)).toStrictEqual({ a: Infinity });
    });

    it('should handle Symbol values', () => {
      const sym = Symbol('test');
      const target = { a: 'value' };
      const patch = { a: sym };

      expect(apply(target, patch)).toStrictEqual({ a: sym });
    });

    it('should handle circular references', () => {
      const target = { a: 'original' };
      const patch = { a: {} };

      patch.a.circular = patch;
      expect(() => apply(target, patch)).toThrow();
    });

    it('should handle prototype pollution attempts', () => {
      const target = {};
      const patch = { __proto__: { malicious: true } };
      const result = apply(target, patch);

      expect(result.malicious).toBeUndefined();
    });

    it('should handle invalid patch structures', () => {
      const target = { a: 'value' };
      const patch = () => {};

      expect(() => apply(target, patch)).toThrow();
    });

    it('should handle non-enumerable properties', () => {
      const target = { a: 'value' };
      const patch = Object.create(
        {},
        {
          b: { value: 'hidden', enumerable: false },
        }
      );

      expect(apply(target, patch)).toStrictEqual({ a: 'value' });
    });

    it('should handle very deep objects', () => {
      const target = { a: 'b', next: {} };
      let current = target.next;

      for (let i = 0; i < 3; i++) {
        current.next = {};
        current = current.next;
      }

      const patch = { next: null };

      expect(apply(target, patch)).toStrictEqual({ a: 'b' });
    });

    it('should handle very wide objects', () => {
      const target = {};
      const patch = {};

      for (let i = 0; i < 1000; i++) {
        patch[`key${i}`] = i;
      }

      expect(apply(target, patch)).toMatchObject(patch);
    });

    it('should handle Date objects in nested structures', () => {
      const date = new Date('2024-11-08');
      const target = { nested: { date: 'old' } };
      const patch = { nested: { date } };

      expect(apply(target, patch)).toStrictEqual({
        nested: { date: date.toISOString() },
      });
    });

    it('should handle RegExp objects', () => {
      const target = { pattern: /old/ };
      const patch = { pattern: /new/ };

      expect(apply(target, patch)).toStrictEqual({ pattern: /new/ });
    });

    it('should protect against prototype pollution', () => {
      const target = {};
      const maliciousPatch = {
        __proto__: { malicious: true },
        constructor: { malicious: true },
        prototype: { malicious: true },
        normal: 'value',
      };

      const result = apply(target, maliciousPatch);

      expect(result).toStrictEqual({});
      expect({}.malicious).toBeUndefined();
      expect(Object.prototype.malicious).toBeUndefined();
      expect(Object.constructor.malicious).toBeUndefined();
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    });
  });

  describe('patch merging', () => {
    it('should produce identical results when applying patches sequentially or merged', () => {
      const firstChange = { a: 'b' };
      const secondChange = { b: 'c' };

      const patch1 = generate({}, firstChange);
      const patch2 = generate({}, secondChange);
      const mergedPatch = merge(patch1, patch2);

      const resultSequential = [patch1, patch2].reduce((state, patch) => apply(state, patch), {});
      const resultMerged = apply({}, mergedPatch);

      expect(resultSequential).toStrictEqual(resultMerged);
    });
  });
});
