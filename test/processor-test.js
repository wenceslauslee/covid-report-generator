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
});
