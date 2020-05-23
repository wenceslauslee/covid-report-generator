const csv = require('csv-parser');
const fs = require('fs');

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

        results.state = stateSum;
        resolve(results);
      })
      .on('error', error => {
        console.log(error);
        reject(error);
      });
  });
}

module.exports = {
  parse: parse
};
