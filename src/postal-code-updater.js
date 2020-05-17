const covidPostalCountyDb = require('./db/covid-postal-county-db');
const _ = require('underscore');

async function updatePostalCodesInDb(countyToPostalCodes, countyRawDataNew) {
  var missedCount = 0;
  _.each(countyToPostalCodes, (val, key) => {
    if (!Object.prototype.hasOwnProperty.call(countyRawDataNew, key)) {
      console.log(key);
      missedCount += 1;
    }
  });
  console.log(`${missedCount} out of ${Object.keys(countyToPostalCodes).length} counties are missing.`);

  const postalCodeEntries = [];
  _.each(countyToPostalCodes, (val, key) => {
    _.each(val, v => {
      v.fips = key;
      postalCodeEntries.push(v);
    });
  });
  console.log(`Found ${postalCodeEntries.length} supported postal codes`);

  const pseChunks = _.chunk(postalCodeEntries, 25);
  const pseChunkLength = pseChunks.length;
  for (var index in pseChunks) {
    await covidPostalCountyDb.batchWrite(pseChunks[index]);
    console.log(`Completed ${Number(index) + 1} out of ${pseChunkLength} chunks.`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

module.exports = {
  updatePostalCodesInDb: updatePostalCodesInDb
};
