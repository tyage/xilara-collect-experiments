import fs from 'fs';
import url from 'url';
import cheerio from 'cheerio';
import { listFiles, fetch } from '../lib';

const reportDir = 'data/openbugbounty/reports';
const responsesDir = 'data/openbugbounty/responses';
const payloadPatterns = [
  /(['"]?[^>]*>)*<[^>]+>[^<]*(alert|confirm|prompt)[^<]*<\/[^>]+>/ig,
  /(['"]?[^>]*>)*<[^>]+(alert|confirm|prompt)[^>]+>/ig
];
const isPayload = (param) => {
  let isMatched = false;
  const base64Decoded = new Buffer(param, 'base64').toString();
  for (let pattern of payloadPatterns) {
    if (param.match(pattern) || base64Decoded.match(pattern)) {
      isMatched = true;
    }
  }
  return isMatched;
};
const getPoC = (report) => {
  const contents = fs.readFileSync(`${reportDir}/${report}`).toString();
  const $ = cheerio.load(contents);
  const poc = $('.url textarea').text();
  return new url.URL(poc);
};
const createSafeRequests = (pocURL, replacements) => {
  const payloads = [];
  for (let [ key, value ] of pocURL.searchParams.entries()) {
    if (isPayload(value)) {
      payloads.push(key);
    }
  }

  // if no payload found or multiple payloads found, exit
  if (payloads.length !== 1) {
    return false;
  }

  const [ payloadIncludedKey ] = payloads;
  const values = [];
  for (let value of pocURL.searchParams.getAll(payloadIncludedKey)) {
    if (!isPayload(value)) {
      values.push(value);
    }
  }

  // replace payload to replacement
  // payloadIncludedKey may have paired with other values
  return replacements.map(r => {
    const newURL = new url.URL(pocURL);
    newURL.searchParams.delete(payloadIncludedKey);
    for (let value of values) {
      newURL.searchParams.append(payloadIncludedKey, value);
    }
    newURL.searchParams.append(payloadIncludedKey, r);
    return newURL;
  });
};
const saveResponse = async (url, filename) => {
  if (fs.existsSync(filename)) {
    return;
  }
  try {
    const response = await fetch(url);
    fs.writeFileSync(filename, response);
  } catch (e) {
    console.log(e);
  }
};

const collectSafeResponses = async () => {
  const validReports = JSON.parse(fs.readFileSync('data/openbugbounty/valid-reports.json'));
  let payloadFoundReports = 0;
  let payloadNotFoundReports = 0;
  let errorReports = 0;

  const safeParams = [ 1, 2, 3 ]; // replace payload with 1, 2 and 3
  for (let report of validReports) {
    const responseDir = `${responsesDir}/${report}`;
    fs.existsSync(responseDir) || fs.mkdirSync(responseDir);

    try {
      const poc = getPoC(report);
      const safeRequests = createSafeRequests(poc, safeParams);
      if (!safeRequests) {
        ++payloadNotFoundReports;
        continue;
      }

      console.log('=====');
      console.log(poc.toString());
      console.log('= replaced to =>');
      console.log(safeRequests.join('\n'));
      console.log('=====');
      for (let i in safeRequests) {
        await saveResponse(safeRequests[i], `${responseDir}/${safeParams[i]}`);
      }
      ++payloadFoundReports;
    } catch(e) {
      ++errorReports;
      console.log(e)
    }
  }

  console.log(`payload found in: ${payloadFoundReports} reports`);
  console.log(`payload not found in: ${payloadNotFoundReports} reports`);
  console.log(`error occured in: ${errorReports} reports`);
};
collectSafeResponses();
