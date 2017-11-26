import fs from 'fs';
import { fetch, sleep } from './lib';

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
    await sleep(500);
  }
};
fetchAllOpenBugBounties();
