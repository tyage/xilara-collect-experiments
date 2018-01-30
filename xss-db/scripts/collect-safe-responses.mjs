import fs from 'fs';
import url from 'url';
import cheerio from 'cheerio';
import { listFiles, fetch, sleep } from '../lib';

const reportDir = 'data/openbugbounty/reports';
const responsesDir = 'data/openbugbounty/responses';
const payloadPatterns = [
  /(['"]?[^>]*>)*<[^>]+>[^<]*(alert|confirm|prompt)[^<]*(<\/[^>]+>)?/ig, // "><script>alert(1)</script>
  /(['"]?[^>]*>)*<[^>]+(alert|confirm|prompt)([^>]+>)?/ig // "><img src=x onerror=alert(1)>
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
    return e;
  }
};

const collectSafeResponses = async () => {
  const validReports = JSON.parse(fs.readFileSync('data/openbugbounty/valid-reports.json'));
  let payloadFoundReports = 0;
  let payloadNotFoundReports = 0;
  let errorReports = 0;

  const safeParams = [ 1, 2, 3, 4, 5 ].map(i => i.toString()); // replace payload with 1 - 5

  const collectSafeResponsesForReport = async (report) => {
    const responseDir = `${responsesDir}/${report}`;
    fs.existsSync(responseDir) || fs.mkdirSync(responseDir);

    let buffer = '';

    try {
      const poc = getPoC(report);
      const safeRequests = createSafeRequests(poc, safeParams);
      if (!safeRequests) {
        ++payloadNotFoundReports;
        return;
      }

      buffer += `=====
${poc.toString()}
= replaced to =>
${safeRequests.join('\n')}
=====
`;
      for (let i in safeRequests) {
        buffer += await saveResponse(safeRequests[i], `${responseDir}/${safeParams[i]}`) || '';
        await sleep(1000);
      }
      ++payloadFoundReports;
    } catch(e) {
      ++errorReports;
      buffer += e;
    }
    console.log(buffer);
  };

  // 10分割して並列に実行
  const groupedReports = [];
  validReports.forEach((r, i) => {
    const num = i % 10;
    if (!groupedReports[num]) {
      groupedReports[num] = [];
    }
    groupedReports[num].push(r);
  });

  Promise.all(groupedReports.map((reports, i) => new Promise(async (resolve) => {
    for (let report of reports) {
      await collectSafeResponsesForReport(report);
    }
    resolve();
  }))).then(() => {
    console.log(`payload found in: ${payloadFoundReports} reports`);
    console.log(`payload not found in: ${payloadNotFoundReports} reports`);
    console.log(`error occured in: ${errorReports} reports`);
  });
};
collectSafeResponses();
