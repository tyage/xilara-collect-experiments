import fs from 'fs';
import url from 'url';
import cheerio from 'cheerio';
import { listFiles, fetch } from '../lib';

const reportDir = 'data/openbugbounty/reports';
const payloadPatterns = [
  /(['"]?[^>]*>)*<[^>]+>[^<]*(alert|confirm|prompt)[^<]*<\/[^>]+>/ig,
  /(['"]?[^>]*>)*<[^>]+(alert|confirm|prompt)[^>]+>/ig
];

const getPoC = (report) => {
  const contents = fs.readFileSync(`${reportDir}/${report}`).toString();
  const $ = cheerio.load(contents);
  const poc = $('.url textarea').text();
  return new url.URL(poc);
};
const createSafeRequests = (pocURL, replacements) => {
  const payloads = [];
  for (let [ key, value ] of pocURL.searchParams.entries()) {
    for (let pattern of payloadPatterns) {
      if (value.match(pattern)) {
        payloads.push(key);
      }
    }
  }

  // if no payload found or multiple payloads found, exit
  if (payloads.length !== 1) {
    return false;
  }

  const [ payloadIncludedKey ] = payloads;
  const values = [];
  for (let value of pocURL.searchParams.getAll(payloadIncludedKey)) {
    if (!value.match(pattern)) {
      values.push(value);
    }
  }

  // replace payload to replacement
  // payloadIncludedKey may have paired with other values
  return replacements.map(r => {
    const newURL = new URL(pocURL);
    newURL.delete(payloadIncludedKey);
    for (let value of values) {
      newURL.append(payloadIncludedKey, value);
    }
    newURL.append(payloadIncludedKey, r);
  });
};

const collectSafeResponses = async () => {
  let payloadFoundReports = 0;
  let payloadNotFoundReports = 0;
  let errorReports = 0;
  let payloadFrequency = {};

  const files = await listFiles(reportDir);
  const reportFiles = files.filter(f => /^\d+$/.test(f));
  const safeParams = [ 1, 2 ]; // replace payload with 1 and 2
  for (let report of reportFiles) {
    try {
      const poc = getPoC(report);
      const safeRequests = createSafeRequests(poc, safeParams);
      if (!safeRequests) {
        continue;
      }
      console.log('=====');
      console.log(poc);
      console.log('= replaced to =>');
      console.log(payloads.join('\n'));
      console.log('=====');
    } catch(e) {
    }
  }
};
collectSafeResponses();
