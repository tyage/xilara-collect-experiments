import fs from 'fs';
import { fetch, sleep } from '../lib';

const reports = JSON.parse(fs.readFileSync('data/openbugbounty/reports.json'));
const unpatchedXSSReports = reports.filter(r => r.status === 'unpatched' && r.type === 'Cross Site Scripting');

const fetchAllReports = async () => {
  for (let report of unpatchedXSSReports) {
    const { id } = report;
    // XXX: use partial reports
    if (+id % 10 !== 0) {
      continue;
    }
    const filename = `data/openbugbounty/reports/${id}`;
    const body = await fetch(`https://www.openbugbounty.org/reports/${id}/`);
    fs.writeFileSync(filename, body);
    await sleep(500);
  }
};
fetchAllReports();
