'use strict';

const merge = require('../lib/merge');

describe('merge', () => {
  describe('basic attribute merging', () => {
    it('should merge patches with different attributes', () => {
      const patch1 = { a: 'b' };
      const patch2 = { b: 'c' };

      expect(merge(patch1, patch2)).toStrictEqual({ a: 'b', b: 'c' });
    });

    it('should take last patch attributes for rewriting', () => {
      const patch1 = { a: 'b' };
      const patch2 = { a: 'c' };

      expect(merge(patch1, patch2)).toStrictEqual({ a: 'c' });
    });

    it('should take last patch attributes and keep other attributes', () => {
      const patch1 = { a: 'b', b: 'd' };
      const patch2 = { a: 'c' };

      expect(merge(patch1, patch2)).toStrictEqual({ a: 'c', b: 'd' });
    });
  });

  describe('null handling', () => {
    it('should keep null attributes for deleting', () => {
      const patch1 = { a: null };
      const patch2 = { b: 'c' };

      expect(merge(patch1, patch2)).toStrictEqual({ a: null, b: 'c' });
    });

    it('should replace null with newer attribute', () => {
      const patch1 = { a: null };
      const patch2 = { a: 'b' };

      expect(merge(patch1, patch2)).toStrictEqual({ a: 'b' });
    });

    it('should replace an attribute with null if newer', () => {
      const patch1 = { a: 'b' };
      const patch2 = { a: null };

      expect(merge(patch1, patch2)).toStrictEqual({ a: null });
    });

    it('should replace object with null value', () => {
      const patch1 = { a: 'b' };
      const patch2 = null;

      expect(merge(patch1, patch2)).toStrictEqual(null);
    });

    it('should replace null with patch', () => {
      const patch1 = null;
      const patch2 = { a: 'b' };

      expect(merge(patch1, patch2)).toStrictEqual({ a: 'b' });
    });
  });

  describe('type conversion', () => {
    it('should replace an array with an object', () => {
      const patch1 = [];
      const patch2 = { a: 'b' };

      expect(merge(patch1, patch2)).toStrictEqual({ a: 'b' });
    });

    it('should replace an object with an array', () => {
      const patch1 = { a: 'b' };
      const patch2 = [];

      expect(merge(patch1, patch2)).toStrictEqual([]);
    });
  });

  describe('recursive merging', () => {
    it('should merge sub objects', () => {
      const patch1 = { a: { b: { c: 'd' } }, d: 'e' };
      const patch2 = { a: { b: 'a' } };

      expect(merge(patch1, patch2)).toStrictEqual({ a: { b: 'a' }, d: 'e' });
    });

    it('should merge recursively while preserving structure', () => {
      const patch1 = { a: { b: { c: 'd' }, d: 'e' } };
      const patch2 = { a: { b: { c: 'e' } } };

      expect(merge(patch1, patch2)).toStrictEqual({
        a: { b: { c: 'e' }, d: 'e' },
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty objects', () => {
      const patch1 = {};
      const patch2 = {};

      expect(merge(patch1, patch2)).toStrictEqual({});
    });

    it('should handle undefined values', () => {
      const patch1 = { a: undefined };
      const patch2 = { b: undefined };

      expect(merge(patch1, patch2)).toStrictEqual({
        a: undefined,
        b: undefined,
      });
    });

    it('should handle non-object values with same key', () => {
      const patch1 = { a: 'same', b: 'different' };
      const patch2 = { a: 'same', b: 'value' };

      expect(merge(patch1, patch2)).toStrictEqual(patch2);
    });
  });

  describe('array handling', () => {
    it('should merge arrays of different lengths', () => {
      const patch1 = { arr: [1, 2, 3] };
      const patch2 = { arr: [1, 2] };

      expect(merge(patch1, patch2)).toStrictEqual({ arr: [1, 2] });
    });

    it('should handle nested arrays', () => {
      const patch1 = {
        arr: [
          [1, 2],
          [3, 4],
        ],
      };
      const patch2 = {
        arr: [
          [1, 5],
          [3, 4],
        ],
      };

      expect(merge(patch1, patch2)).toStrictEqual({
        arr: [
          [1, 5],
          [3, 4],
        ],
      });
    });

    it('should merge mixed type arrays', () => {
      const patch1 = { arr: [1, 'string', { a: 1 }] };
      const patch2 = { arr: [1, 'new', { b: 2 }] };

      expect(merge(patch1, patch2)).toStrictEqual({
        arr: [1, 'new', { b: 2 }],
      });
    });
  });

  describe('special values', () => {
    it('should handle NaN values', () => {
      const patch1 = { a: 1 };
      const patch2 = { a: NaN };

      expect(merge(patch1, patch2)).toStrictEqual({ a: NaN });
    });

    it('should handle Infinity values', () => {
      const patch1 = { a: 1 };
      const patch2 = { a: Infinity };

      expect(merge(patch1, patch2)).toStrictEqual({ a: Infinity });
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-01');
      const patch1 = { date: 'old' };
      const patch2 = { date };

      expect(merge(patch1, patch2)).toStrictEqual({
        date,
      });
    });

    it('should handle RegExp objects', () => {
      const patch1 = { pattern: /old/ };
      const patch2 = { pattern: /new/ };

      expect(merge(patch1, patch2)).toStrictEqual({ pattern: /new/ });
    });
  });

  describe('complex merging', () => {
    it('should handle deep mixed type changes', () => {
      const patch1 = {
        str: 'old',
        num: 123,
        obj: { a: 1 },
        arr: [1, 2],
      };
      const patch2 = {
        str: 'new',
        num: '123',
        obj: [1, 2],
        arr: { a: 1 },
      };

      expect(merge(patch1, patch2)).toStrictEqual({
        str: 'new',
        num: '123',
        obj: [1, 2],
        arr: { a: 1 },
      });
    });

    it('should handle multiple levels of null replacements', () => {
      const patch1 = {
        a: { b: { c: 'value' } },
        x: { y: 'keep' },
      };
      const patch2 = {
        a: { b: null },
        x: { z: 'new' },
      };

      expect(merge(patch1, patch2)).toStrictEqual({
        a: { b: null },
        x: { y: 'keep', z: 'new' },
      });
    });
  });

  describe('error cases', () => {
    it('should handle prototype pollution attempts', () => {
      const patch1 = { regular: 'value' };
      const patch2 = { __proto__: { malicious: true } };
      const result = merge(patch1, patch2);

      expect(result.malicious).toBeUndefined();
      expect(result.regular).toBe('value');
    });
  });

  describe('boundary cases', () => {
    it('should handle very deep objects', () => {
      const patch1 = {};
      const patch2 = {};
      let current1 = patch1;
      let current2 = patch2;

      for (let i = 0; i < 100; i++) {
        current1.next = { value: 'old' };
        current2.next = { value: 'new' };
        current1 = current1.next;
        current2 = current2.next;
      }

      const result = merge(patch1, patch2);

      expect(result.next.next.next.value).toBe('new');
    });

    it('should handle very wide objects', () => {
      const patch1 = {};
      const patch2 = {};

      for (let i = 0; i < 1000; i++) {
        patch1[`key${i}`] = 'old';
        patch2[`key${i}`] = 'new';
      }

      const result = merge(patch1, patch2);

      expect(result.key0).toBe('new');
      expect(result.key999).toBe('new');
    });
  });
});
