const csv = require('csv-parser');
const fs = require('fs');
const _ = require('underscore');

function parse(filepath) {
  const customMapping = getCustomMapping();

  return new Promise((resolve, reject) => {
    const results = {};

    fs.createReadStream(filepath)
      .pipe(csv())
      .on('data', data => {
        var fips = [];

        if (data.date.length === 0 || data.state.length === 0 || data.cases.length === 0 || data.deaths.length === 0 ||
          data.county.length === 0) {
          console.log(data);
          throw Error('Data is malformed');
        }

        if (data.fips.length === 0) {
          if (shouldReject(data)) {
            return;
          }

          const county = data.county.toLowerCase();
          const state = data.state.toLowerCase();
          const key = `${county}|${state}`;

          if (!Object.prototype.hasOwnProperty.call(customMapping, key)) {
            console.log(key);
            console.log(data);
            throw Error('fips mapping is malformed');
          }

          fips = customMapping[key];
        } else {
          fips.push(data.fips);
        }

        _.each(fips, val => {
          if (!Object.prototype.hasOwnProperty.call(results, val)) {
            results[val] = {};
          }

          if (Object.prototype.hasOwnProperty.call(results[val], data.date)) {
            console.log(`${val}|${data.date}`);
            throw Error('Data is duplicated');
          }

          data.fips = val;
          results[val][data.date] = data;
        });
      })
      .on('end', () => {
        console.log(`Completed parsing ${Object.keys(results).length} rows of county data.`);
        resolve(results);
      })
      .on('error', error => {
        console.log(error);
        reject(error);
      });
  });
}

function getCustomMapping() {
  return {
    'new york city|new york': [
      '36005',
      '36047',
      '36061',
      '36081',
      '36085'
    ],
    'doña ana|new mexico': '35013',
    'anchorage|alaska': '02020',
    'petersburg borough|alaska': '02195',
    'lasalle|louisiana': '22059'
  };
}

// Bad data we know that is wrong and should ignore
function shouldReject(data) {
  return (data.county === 'Unknown' || data.county === 'Kansas City');
}

module.exports = {
  parse: parse
};
