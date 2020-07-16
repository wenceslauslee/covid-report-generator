const csv = require('csv-parser');
const fs = require('fs');
const _ = require('underscore');

function parse() {
  return new Promise((resolve, reject) => {
    const results = {
      county: {},
      state: {}
    };
    const stateSum = {};

    fs.createReadStream('data/census-reduced.csv')
      .pipe(csv())
      .on('data', data => {
        const state = data.STATE;
        const county = data.COUNTY;
        const fips = state.padStart(2, '0') + county.padStart(3, '0');
        const pop = parseInt(data.POPESTIMATE2019);

        results.county[fips] = pop;

        if (county === '0') {
          const stateName = data.STNAME.toLowerCase();
          stateSum[stateName] = pop;
        }
      })
      .on('end', () => {
        console.log(`Completed parsing ${Object.keys(results).length} rows of census data.`);

        nycAdjustment(results);
        results.state = stateSum;
        islandAdjustment(results);
        resolve(results);
      })
      .on('error', error => {
        console.log(error);
        reject(error);
      });
  });
}

function nycAdjustment(results) {
  const exceptions = ['36005', '36047', '36061', '36081', '36085'];

  var sum = 0;
  _.each(exceptions, val => {
    sum += results.county[val];
  });

  _.each(exceptions, val => {
    results.county[val] = sum;
  });
}

function islandAdjustment(results) {
  results.state['virgin islands'] = 104423;
  results.state.guam = 168775;
  results.state['northern mariana islands'] = 57563;
}

module.exports = {
  parse: parse
};
