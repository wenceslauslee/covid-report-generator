const covidWebsiteRankDb = require('./db/covid-website-rank-db');
const _ = require('underscore');

async function updateMapping(reportResults) {
  const resultsMap = {};

  _.each(reportResults, val => {
    if (!Object.prototype.hasOwnProperty.call(resultsMap, val.stateNameFull)) {
      resultsMap[val.stateNameFull] = [];
    }

    resultsMap[val.stateNameFull].push(val);
  });

  const mappingResults = [];
  _.each(resultsMap, (val, key) => {
    const countiesCondensed = _.map(val, v => {
      return {
        name: v.countyName,
        fips: v.fips
      };
    });
    mappingResults.push({
      state: key,
      counties: _.sortBy(countiesCondensed, c => c.name)
    });
  });

  const sortedMappingResults = _.sortBy(mappingResults, x => x.state);

  await covidWebsiteRankDb.batchWrite([
    {
      infoKey: 'stateToCounty',
      pageValue: '0',
      dataValue: {
        mappings: sortedMappingResults
      }
    }
  ]);

  var reportChunks = _.chunk(sortedMappingResults, 25);
  var reportChunkLength = reportChunks.length;
  for (var index in reportChunks) {
    const modifiedChunks = _.map(reportChunks[index], val => {
      return {
        infoKey: val.state.toLowerCase(),
        pageValue: '0',
        dataValue: {
          mappings: val.counties
        }
      };
    });
    await covidWebsiteRankDb.batchWrite(modifiedChunks);
    console.log(`Completed ${Number(index) + 1} out of ${reportChunkLength} state to county mapping chunks.`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const rankingResults = [];
  _.each(resultsMap, (val, key) => {
    const rankings = rankCounties(val);
    var countiesByCount = _.sortBy(val, v => v.detailedInfo.activeCount);
    countiesByCount.reverse();
    _.each(countiesByCount, cc => {
      cc.detailedInfo.localActiveRank = rankings.caseRankings[cc.fips];
      cc.detailedInfo.localActiveRankPast = rankings.caseRankingsPast[cc.fips];
      cc.detailedInfo.localDeathRank = rankings.caseRankings[cc.fips];
      cc.detailedInfo.localDeathRankPast = rankings.caseRankingsPast[cc.fips];
    });
    rankingResults.push({
      state: key,
      counties: countiesByCount
    });
  });

  reportChunks = _.chunk(rankingResults, 25);
  reportChunkLength = reportChunks.length;
  for (var index in reportChunks) {
    const modifiedChunks = _.map(reportChunks[index], val => {
      return {
        infoKey: val.state.toLowerCase(),
        pageValue: '1',
        dataValue: {
          reportDate: val.counties[0].currentDate,
          totalCount: val.counties.length,
          rankByCases: val.counties,
          reportTimestamp: val.counties[0].reportTimestamp
        }
      };
    });
    await covidWebsiteRankDb.batchWrite(modifiedChunks);
    console.log(`Completed ${Number(index) + 1} out of ${reportChunkLength} state to county ranking chunks.`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

function rankCounties(countyResults) {
  const caseRankings = {};
  const deathRankings = {};
  const caseRankingsPast = {};
  const deathRankingsPast = {};

  const sortByCases = _.sortBy(countyResults, x => parseInt(x.detailedInfo.activeCount));
  for (var i = sortByCases.length - 1; i >= 0; i--) {
    caseRankings[sortByCases[i].fips] = sortByCases.length - i;
  }

  const sortByDeaths = _.sortBy(countyResults, x => parseInt(x.detailedInfo.deathCount));
  for (var j = sortByDeaths.length - 1; j >= 0; j--) {
    deathRankings[sortByDeaths[j].fips] = sortByDeaths.length - j;
  }

  const sortByCasesPast = _.sortBy(
    countyResults, x => parseInt(x.detailedInfo.activeCount - x.detailedInfo.activeChange));
  for (var i = sortByCasesPast.length - 1; i >= 0; i--) {
    caseRankingsPast[sortByCasesPast[i].fips] = sortByCasesPast.length - i;
  }

  const sortByDeathsPast = _.sortBy(
    countyResults, x => parseInt(x.detailedInfo.deathCount - x.detailedInfo.deathChange));
  for (var j = sortByDeathsPast.length - 1; j >= 0; j--) {
    deathRankingsPast[sortByDeathsPast[j].fips] = sortByDeathsPast.length - j;
  }

  return {
    caseRankings: caseRankings,
    deathRankings: deathRankings,
    caseRankingsPast: caseRankingsPast,
    deathRankingsPast: deathRankingsPast
  };
}

module.exports = {
  updateMapping: updateMapping
};
