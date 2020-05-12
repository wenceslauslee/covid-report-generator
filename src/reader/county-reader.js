const csv = require('csv-parser');
const fs = require('fs');

function parse(filepath) {
  return new Promise((resolve, reject) => {
    const results = {};

    fs.createReadStream(filepath)
      .pipe(csv())
      .on('data', data => {
        if (data.fips.length === 0) {
          data.fips = '-----';
        }

        if (data.date.length === 0 || data.state.length === 0 || data.cases.length === 0 || data.deaths.length === 0 ||
          data.county.length === 0) {
          console.log(data);
          throw Error('Data is malformed');
        }

        const dataKey = `${data.county}|${data.state}|${data.date}`;
        if (Object.prototype.hasOwnProperty.call(results, dataKey)) {
          console.log(dataKey);
          throw Error('Data is duplicated');
        }

        results[dataKey] = data;
      })
      .on('end', () => {
        console.log(`Completed parsing ${results.length} rows of county data.`);
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
