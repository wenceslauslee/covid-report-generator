const csv = require('csv-parser');
const fs = require('fs');

function parse() {
  return new Promise((resolve, reject) => {
    const results = {};
    const set = new Set();

    fs.createReadStream('data/postal-code-to-county-state.csv')
      .pipe(csv())
      .on('data', data => {
        const fips = data.stcountyfp;
        var countyName = data.countyname;
        if (countyName.endsWith(' County') || countyName.endsWith(' Parish')) {
          countyName = countyName.substring(0, countyName.length - 7);
        }

        if (!Object.prototype.hasOwnProperty.call(results, fips)) {
          results[fips] = [];
        }

        if (!set.has(data.zip)) {
          results[fips].push({
            postalCode: data.zip,
            cityName: data.city.toLowerCase(),
            stateNameShort: data.state.toLowerCase(),
            countyName: countyName.toLowerCase()
          });
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

module.exports = {
  parse: parse
};
