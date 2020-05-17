const csv = require('csv-parser');
const fs = require('fs');

function parse() {
  return new Promise((resolve, reject) => {
    const results = {};

    fs.createReadStream('data/census-reduced.csv')
      .pipe(csv())
      .on('data', data => {
        const state = data.STATE;
        const county = data.COUNTY;
        const fips = state.padStart(2, '0') + county.padStart(3, '0');

        results[fips] = parseInt(data.POPESTIMATE2019);
      })
      .on('end', () => {
        console.log(`Completed parsing ${Object.keys(results).length} rows of census data.`);
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
