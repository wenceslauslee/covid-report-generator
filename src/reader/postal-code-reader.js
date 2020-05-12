const csv = require('csv-parser');
const fs = require('fs');

function parse() {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream('data/postal-code-to-county-state.csv')
      .pipe(csv())
      .on('data', data => results.push(data))
      .on('end', () => {
        console.log(`Completed parsing ${results.length} rows of postal code data.`);
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
