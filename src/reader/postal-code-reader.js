const csv = require('csv-parser');
const fs = require('fs');
const states = require('us-state-codes');

function parse() {
  return new Promise((resolve, reject) => {
    const results = {};
    const set = new Set();

    fs.createReadStream('data/postal-code-to-county-state.csv')
      .pipe(csv())
      .on('data', data => {
        var countyNameRaw = data.countyname;
        if (countyNameRaw.endsWith(' County')) {
          countyNameRaw = countyNameRaw.substring(0, countyNameRaw.length - 7);
        }

        countyNameRaw = `${countyNameRaw}|${states.getStateNameByStateCode(data.state)}`;

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

module.exports = {
  parse: parse
};
