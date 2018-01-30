import fs from 'fs';
import url from 'url';
import cheerio from 'cheerio';
import { fetch } from '../xss-db/lib.mjs';

const dataDir = 'xss-db/data/openbugbounty';
const modSecurityServerHost = '10.228.76.209';
const modSecurityServerPort = 80;

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
  const contents = fs.readFileSync(`${dataDir}/reports/${report}`).toString();
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

  for (let report of validReports) {
    const responseDir = `${responsesDir}/${report}`;
    const roadrunnerFile = `${dataDir}/templates/${report}`;
    const baseResponses = [1, 2].map(id => `${responseDir}/${id}`);
    const safeVerificationResponses = [3].map(id => `${responseDir}/${id}`);
    const pocResponses = ['poc'].map(id => `${responseDir}/${id}`);

    let allFilesExist = true;
    for (let file of [ roadrunnerFile, ...baseResponses, ...safeVerificationResponses, ...pocResponses ]) {
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
    if ([113850, 219900, 243710, 248640, 262540, 265520, 92930].includes(+report)) {
      continue;
    }

    ++allReports;

    console.log(`===== start report ${report}`);

    const safeParams = [ 1, 2 ]; // replace payload with 1, 2
    const verificationParams = [ 3 ]; // replace payload with 3
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
`);
};
analyzeTemplateMatchingResult();
