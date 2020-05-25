const covidWebsiteRankDb = require('./db/covid-website-rank-db');
const _ = require('underscore');

async function updateMapping(reportResults) {
  const results = {};

  _.each(reportResults, val => {
    if (!Object.prototype.hasOwnProperty.call(results, val.stateNameFull)) {
      results[val.stateNameFull] = new Set();
    }

    results[val.stateNameFull].add(val.countyName);
  });

  _.each(results, (val, key) => {
    results[key] = Array.from(val);
  });

  return covidWebsiteRankDb.batchWrite([
    {
      infoKey: 'stateToCounty',
      pageValue: '0',
      dataValue: {
        mapping: results
      }
    }
  ]);
}

module.exports = {
  updateMapping: updateMapping
};
