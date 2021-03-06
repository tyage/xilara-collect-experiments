import fs from 'fs';
import url from 'url';
import cheerio from 'cheerio';
import { fetch } from '../xss-db/lib.mjs';

const dataDir = 'xss-db/data/openbugbounty';
const modSecurityServerHost = process.env.TARGET_HOST;
const modSecurityServerPort = process.env.TARGET_PORT;

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
  const contents = fs.readFileSync(`${dataDir}/reports/${report}`).toString();
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
const isRequestPasses = async (uri) => {
  const newURI = new url.URL(uri);
  newURI.protocol = 'http';
  newURI.host = modSecurityServerHost;
  newURI.port = modSecurityServerPort;
   const result = await fetch(newURI);
   return !result.includes('<title>403 Forbidden</title>');
};
const analyzeTemplateMatchingResult = async () => {
  const responsesDir = `${dataDir}/responses`;
  const validReports = JSON.parse(fs.readFileSync(`${dataDir}/valid-reports.json`));

  let allReports = 0;
  let correctReports = 0;
  let missBlockedReports = 0;
  let verificationMissBlockedReports = 0;
  let passPoCReports = 0;
  let blockedSafeResponses = 0;

  for (let report of validReports) {
    const responseDir = `${responsesDir}/${report}`;
    const baseResponses = [1, 2, 3, 4].map(id => `${responseDir}/${id}`);
    const safeVerificationResponses = [5].map(id => `${responseDir}/${id}`);
    const pocResponses = ['poc'].map(id => `${responseDir}/${id}`);

    let allFilesExist = true;
    for (let file of [ ...baseResponses, ...safeVerificationResponses, ...pocResponses ]) {
      if (!fs.existsSync(file)) {
        allFilesExist = false;
        break;
      }
    }
    if (!allFilesExist) {
      continue;
    }

    // XXX: template for these reports are broken because it includes CDATA in CDATA
    // XXX: fix the problem
    if ([113850, 137710, 219900, 232070, 243710, 248640, 262540, 265520, 92930].includes(+report)) {
      continue;
    }

    ++allReports;

    console.log(`===== start report ${report}`);

    const safeParams = [ 1, 2, 3, 4 ]; // replace payload with 1, 2
    const verificationParams = [ 5 ]; // replace payload with 3
    const poc = getPoC(report);
    const safeRequests = createSafeRequests(poc, safeParams);
    const verificationRequests = createSafeRequests(poc, verificationParams);

    let missBlocked = false;
    for (let req of safeRequests) {
      const result = await isRequestPasses(req);
      // result should be true
      console.log(req.toString(), result);
      if (!result) {
        missBlocked = true;
        ++blockedSafeResponses;
      }
    }
    if (missBlocked) {
      ++missBlockedReports;
    }

    let verificationMissBlocked = false;
    for (let req of verificationRequests) {
      const result = await isRequestPasses(req);
      // result should be true
      console.log(req.toString(), result);
      if (!result) {
        verificationMissBlocked = true;
        ++blockedSafeResponses;
      }
    }
    if (verificationMissBlocked) {
      ++verificationMissBlockedReports;
    }

    let passPoC = false;
    for (let req of [ poc ]) {
      const result = await isRequestPasses(req);
      // result should not be true
      console.log(req.toString(), result);
      if (result) {
        passPoC = true;
      }
    }
    if (passPoC) {
      ++passPoCReports;
    }

    if (!missBlocked && !verificationMissBlocked && !passPoC) {
      ++correctReports;
    } else {
      console.log(`something wrong with report ${report}`);
    }
  }

  console.log(`
all reports: ${allReports}
# of reports which xilara can work: ${correctReports}
# of reports which safe responses blocked: ${missBlockedReports}
# of reports which verification safe responses blocked: ${verificationMissBlockedReports}
# of reports which poc passes: ${passPoCReports}
# of safe responses which was blocked: ${blockedSafeResponses}
`);
};
analyzeTemplateMatchingResult();
