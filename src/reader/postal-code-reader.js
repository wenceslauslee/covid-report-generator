const csv = require('csv-parser');
const fs = require('fs');
const states = require('us-state-codes');

function parse() {
  return new Promise((resolve, reject) => {
    const results = {};
    const set = new Set();
    const customMapping = getCustomMapping();

    fs.createReadStream('data/postal-code-to-county-state.csv')
      .pipe(csv())
      .on('data', data => {
        var countyNameRaw = data.countyname;
        if (countyNameRaw.endsWith(' County') || countyNameRaw.endsWith(' Parish')) {
          countyNameRaw = countyNameRaw.substring(0, countyNameRaw.length - 7);
        }

        if (Object.prototype.hasOwnProperty.call(customMapping, data.stcountyfp)) {
          countyNameRaw = customMapping[data.stcountyfp];
        } else {
          countyNameRaw = `${countyNameRaw}|${states.getStateNameByStateCode(data.state)}`;
        }

        if (!Object.prototype.hasOwnProperty.call(results, countyNameRaw)) {
          results[countyNameRaw] = [];
        }

        if (!set.has(data.zip)) {
          results[countyNameRaw].push(data.zip);
          set.add(data.zip);
        }
      })
      .on('end', () => {
        console.log(`Completed parsing ${Object.keys(results).length} rows of postal code data.`);
        resolve(results);
      })
      .on('error', error => {
        console.log(error);
        reject(error);
      });
  });
}

/* eslint-disable quote-props */
function getCustomMapping() {
  return {
    '36005': 'New York City|New York',
    '36047': 'New York City|New York',
    '36061': 'New York City|New York',
    '36081': 'New York City|New York',
    '36085': 'New York City|New York',
    '35013': 'Doña Ana|New Mexico',
    '02020': 'Anchorage|Alaska',
    '02195': 'Petersburg Borough|Alaska',
    '22059': 'LaSalle|Louisiana'
  };
}
/* eslint-enable quote-props */

module.exports = {
  parse: parse
};
