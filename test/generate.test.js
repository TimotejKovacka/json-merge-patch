'use strict';

const generate = require('../lib/generate');

describe('generate', () => {
  describe('basic object operations', () => {
    it('should generate empty object when no changes', () => {
      const before = { a: 'b' };
      const after = { a: 'b' };

      expect(generate(before, after)).toStrictEqual({});
    });

    it('should generate a patch replacing an attribute', () => {
      const before = { a: 'b' };
      const after = { a: 'c' };

      expect(generate(before, after)).toStrictEqual({ a: 'c' });
    });

    it('should generate a patch adding an attribute', () => {
      const before = { a: 'b' };
      const after = { a: 'b', b: 'c' };

      expect(generate(before, after)).toStrictEqual({ b: 'c' });
    });

    it('should generate a patch deleting an attribute', () => {
      const before = { a: 'b' };
      const after = {};

      expect(generate(before, after)).toStrictEqual({ a: null });
    });

    it('should generate a patch deleting an attribute without affecting others', () => {
      const before = { a: 'b', b: 'c' };
      const after = { b: 'c' };

      expect(generate(before, after)).toStrictEqual({ a: null });
    });
  });

  describe('value comparisons', () => {
    it('should handle empty before object', () => {
      const before = {};
      const after = { a: 'b' };

      expect(generate(before, after)).toStrictEqual({ a: 'b' });
    });

    it('should handle empty after object', () => {
      const before = { a: 'b' };
      const after = {};

      expect(generate(before, after)).toStrictEqual({ a: null });
    });

    it('should handle identical values', () => {
      expect(generate({}, {})).toStrictEqual({});
      expect(generate(undefined, undefined)).toStrictEqual({});
      expect(generate(null, null)).toStrictEqual(null);
    });

    it('should handle undefined before value', () => {
      const before = undefined;
      const after = { a: 'b' };

      expect(generate(before, after)).toStrictEqual({ a: 'b' });
    });

    it('should handle undefined after value', () => {
      const before = { a: 'b' };
      const after = undefined;

      expect(generate(before, after)).toStrictEqual({ a: null });
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const before = { str: 'short' };
      const after = { str: longString };

      expect(generate(before, after)).toStrictEqual({ str: longString });
    });

    it('should handle empty string values', () => {
      const before = { str: 'content' };
      const after = { str: '' };

      expect(generate(before, after)).toStrictEqual({ str: '' });
    });

    it('should handle whitespace-only strings', () => {
      const before = { str: 'content' };
      const after = { str: '   ' };

      expect(generate(before, after)).toStrictEqual({ str: '   ' });
    });

    it('should handle objects with special number values', () => {
      const before = { a: 1, b: 2 };
      const after = { a: NaN, b: Infinity };

      expect(generate(before, after)).toStrictEqual({ a: NaN, b: Infinity });
    });
  });

  describe('type handling', () => {
    describe('primitives', () => {
      it('should generate a patch replacing with a string', () => {
        const before = { a: 'foo' };
        const after = 'bar';

        expect(generate(before, after)).toStrictEqual('bar');
      });

      it('should generate a patch replacing with null', () => {
        const before = { a: 'foo' };
        const after = null;

        expect(generate(before, after)).toStrictEqual(null);
      });

      it('should handle mixed primitive types', () => {
        const before = { a: 1, b: 'string', c: true };
        const after = { a: '1', b: 2, c: false };

        expect(generate(before, after)).toStrictEqual({
          a: '1',
          b: 2,
          c: false,
        });
      });
    });

    describe('complex types', () => {
      it('should handle RegExp objects', () => {
        const before = { pattern: /old/ };
        const after = { pattern: /new/ };

        expect(generate(before, after)).toStrictEqual({ pattern: /new/ });
      });

      const testDate = new Date('2020-05-09T00:00:00.000Z');
      const expectedDateString = '2020-05-09T00:00:00.000Z';

      it('should generate a patch replacing with an object implementing toJSON()', () => {
        const before = { a: 'foo' };
        const after = testDate;

        expect(generate(before, after)).toStrictEqual(expectedDateString);
      });

      it('should generate a patch replacing a property with an object implementing toJSON()', () => {
        const before = { a: 'foo' };
        const after = { a: testDate };

        expect(generate(before, after)).toStrictEqual({ a: expectedDateString });
      });

      it('should generate a patch adding a property with an object implementing toJSON()', () => {
        const before = {};
        const after = { b: testDate };

        expect(generate(before, after)).toStrictEqual({ b: expectedDateString });
      });

      it('should handle Set to Array conversion', () => {
        const before = { set: new Set([1, 2, 3]) };
        const after = { set: [1, 2, 3] };

        expect(generate(before, after)).toStrictEqual({ set: [1, 2, 3] });
      });

      it('should handle Map to Object conversion', () => {
        const before = { map: new Map([['key', 'value']]) };
        const after = { map: { key: 'value' } };

        expect(generate(before, after)).toStrictEqual({ map: { key: 'value' } });
      });
    });
  });

  describe('array handling', () => {
    it('should generate a patch replacing an attribute if its an array', () => {
      const before = { a: ['b'] };
      const after = { a: 'c' };

      expect(generate(before, after)).toStrictEqual({ a: 'c' });
    });

    it('should generate a patch replacing the attribute with an array', () => {
      const before = { a: 'c' };
      const after = { a: ['b'] };

      expect(generate(before, after)).toStrictEqual({ a: ['b'] });
    });

    it('should generate a patch replacing an object array with a number array', () => {
      const before = { a: [{ b: 'c' }] };
      const after = { a: [1] };

      expect(generate(before, after)).toStrictEqual({ a: [1] });
    });

    it('should generate a patch replacing whole array if one element has changed', () => {
      const before = ['a', 'b'];
      const after = ['c', 'd'];

      expect(generate(before, after)).toStrictEqual(['c', 'd']);
    });

    it('should generate a patch replacing whole array if one element has been deleted', () => {
      const before = ['a', 'b'];
      const after = ['a'];

      expect(generate(before, after)).toStrictEqual(['a']);
    });

    it('should return empty object if the array hasnt changed', () => {
      const before = [1, 2, 3];
      const after = [1, 2, 3];

      expect(generate(before, after)).toStrictEqual({});
    });

    it('should return empty array when arrays are equal but not same reference', () => {
      const before = [{ a: 'b' }];
      const after = [{ a: 'b' }];

      expect(generate(before, after)).toStrictEqual({});
    });

    it('should handle nested array modifications', () => {
      const before = { arr: [{ a: 1 }, { b: 2 }] };
      const after = { arr: [{ a: 1 }, { b: 3 }] };

      expect(generate(before, after)).toStrictEqual({
        arr: [{ a: 1 }, { b: 3 }],
      });
    });

    it('should handle array of arrays', () => {
      const before = {
        matrix: [
          [1, 2],
          [3, 4],
        ],
      };
      const after = {
        matrix: [
          [1, 2],
          [3, 5],
        ],
      };

      expect(generate(before, after)).toStrictEqual({
        matrix: [
          [1, 2],
          [3, 5],
        ],
      });
    });
  });

  describe('nested structures', () => {
    it('should work recursively', () => {
      const before = {};
      const after = { a: { bb: {} } };

      expect(generate(before, after)).toStrictEqual({ a: { bb: {} } });
    });

    it('should return empty object if the object with sub attributes hasnt changed', () => {
      const before = { a: { b: 'c' } };
      const after = { a: { b: 'c' } };

      expect(generate(before, after)).toStrictEqual({});
    });

    it('should handle deep mixed type conversions', () => {
      const before = {
        nested: {
          num: 123,
          str: 'test',
          bool: true,
          arr: [1, 2],
        },
      };
      const after = {
        nested: {
          num: '123',
          str: false,
          bool: [true],
          arr: { converted: true },
        },
      };

      expect(generate(before, after)).toStrictEqual({
        nested: {
          num: '123',
          str: false,
          bool: [true],
          arr: { converted: true },
        },
      });
    });
  });

  describe('special cases', () => {
    it('should handle function values', () => {
      const normal = { a: 'b' };
      const fn = () => {};

      expect(() => generate(normal, fn)).toThrow();
      expect(() => generate(fn, normal)).toThrow();
    });

    it('should handle inherited properties correctly', () => {
      const proto = { inherited: 'value' };
      const before = Object.create(proto);
      const after = Object.create(proto, {
        own: { value: 'new', enumerable: true },
      });

      expect(generate(before, after)).toStrictEqual({ own: 'new' });
    });
  });
});
