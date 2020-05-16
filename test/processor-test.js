const chai = require('chai');
const assert = chai.assert;
const processor = require('../src/processor');

describe('processor', () => {
  describe('getPastDays', () => {
    it(`should return correct values`, () => {
      const pastDays = processor.getPastDays('2020-05-30', '2020-01-01');

      assert.strictEqual(pastDays.length, 151); // 151 days between those two dates
      assert.strictEqual(pastDays[0], '2020-05-30');
      assert.strictEqual(pastDays[30], '2020-04-30');
      assert.strictEqual(pastDays[60], '2020-03-31');
      assert.strictEqual(pastDays[91], '2020-02-29');
      assert.strictEqual(pastDays[120], '2020-01-31');
      assert.strictEqual(pastDays[150], '2020-01-01');
    });
  });

  describe('getUpToNthRecentUpdate', () => {
    it(`should return correct values`, () => {
      const pastResults = {
        'Middlesex|MA': {
          '2020-05-30': 'a1',
          '2020-05-29': 'a2',
          '2020-05-28': 'a3'
        },
        'Boston|MA': {
          '2020-05-30': 'a1',
          '2020-05-29': 'a2'
        }
      };
      const pastDays = ['2020-05-30', '2020-05-29', '2020-05-28', '2020-05-27'];

      var results = processor.getUpToNthRecentUpdate(pastResults['Middlesex|MA'], pastDays, 1);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0], 'a1');

      results = processor.getUpToNthRecentUpdate(pastResults['Middlesex|MA'], pastDays, 5);

      assert.strictEqual(results.length, 3);
      assert.strictEqual(results[0], 'a1');
      assert.strictEqual(results[1], 'a2');
      assert.strictEqual(results[2], 'a3');

      results = processor.getUpToNthRecentUpdate(pastResults['Boston|MA'], pastDays, 3);

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0], 'a1');
      assert.strictEqual(results[1], 'a2');
    });
  });
});
