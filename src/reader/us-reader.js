const csv = require('csv-parser');
const fs = require('fs');

function parse(filepath) {
  return new Promise((resolve, reject) => {
    const results = {};

    fs.createReadStream(filepath)
      .pipe(csv())
      .on('data', data => {
        if (data.date.length === 0 || data.cases.length === 0 || data.deaths.length === 0) {
          console.log(data);
          throw Error('Data is malformed');
        }

        results[data.date] = data;
      })
      .on('end', () => {
        console.log(`Completed parsing ${Object.keys(results).length} rows of us data.`);
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
