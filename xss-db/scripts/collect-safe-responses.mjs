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
  for (let pattern of payloadPatterns) {
    if (param.match(pattern)) {
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
    const base64Decoded = new Buffer(value, 'base64').toString();
    if (isPayload(value)) {
      payloads.push({ key });
    }
    if (isPayload(base64Decoded)) {
      payloads.push({ key, isBase64: true });
    }
  }

  // if no payload found or multiple payloads found, exit
  if (payloads.length !== 1) {
    return false;
  }

  const [ { key: payloadIncludedKey, isBase64 } ] = payloads;
  const values = [];
  for (let value of pocURL.searchParams.getAll(payloadIncludedKey)) {
    const base64Decoded = new Buffer(value, 'base64').toString();
    if (
      (!isBase64 && !isPayload(value)) ||
      (isBase64 && !isPayload(base64Decoded))
    ) {
      values.push(value);
    }
  }

  // replace payload to replacement
  // payloadIncludedKey may have paired with other values
  return replacements.map(r => {
    r = r.toString();
    const newURL = new url.URL(pocURL);
    const base64R = new Buffer(r).toString('base64');
    newURL.searchParams.delete(payloadIncludedKey);
    for (let value of values) {
      newURL.searchParams.append(payloadIncludedKey, value);
    }
    newURL.searchParams.append(payloadIncludedKey, isBase64 ? base64R : r);
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
