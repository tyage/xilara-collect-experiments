const https = require('https');
const fs = require('fs');
const { fetch, sleep } = require('./lib');

const fetchOpenBugBounty = (id) => fetch(`https://www.openbugbounty.org/reports/${id}`);
const getLatestOpenBugBountyId = () => {
  // TODO: implement
  return 432289;
};

const fetchAllOpenBugBounties = async () => {
  for (let id = getLatestOpenBugBountyId(); id > 0; --id) {
    const filename = `data/openbugbounty/${id}`;
    const body = await fetchOpenBugBounty(id);
    fs.writeFileSync(filename, body);
    await sleep(1000);
  }
};
fetchAllOpenBugBounties();
