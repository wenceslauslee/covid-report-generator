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

    fs.createReadStream('data/election-results.csv')
      .pipe(csv())
      .on('data', data => {
        const fips = data.combined_fips.padStart(5, '0');
        const diff = parseFloat(data.per_point_diff.slice(0, -1));
        const sign = parseInt(data.votes_gop) - parseInt(data.votes_dem) > 0;

        results.county[fips] = diff * (sign ? 1 : -1);
      })
      .on('end', () => {
        console.log(`Completed parsing ${Object.keys(results).length} rows of election data.`);

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
  results.state.guam = 168775;
}

module.exports = {
  parse: parse
};
