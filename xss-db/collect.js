const https = require('https');
const fs = require('fs');

const fetchOpenBugBounty = async (id) => {
  const url = `https://www.openbugbounty.org/reports/${id}/`;
  console.log(`start to fetch ${url}`);
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', (res) => {
        resolve(body);
      });
    });
  });
};
const getLatestOpenBugBountyId = () => {
  // TODO: implement
  return 432289;
};

const fetchAllOpenBugBounties = async () => {
  for (let id = getLatestOpenBugBountyId(); id > 0; --id) {
    const filename = `data/openbugbounty/${id}`;
    const body = await fetchOpenBugBounty(id);
    fs.writeFileSync(filename, body);
  }
};
fetchAllOpenBugBounties();
