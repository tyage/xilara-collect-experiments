import childProcess from 'child_process';
import fs from 'fs';
import { isHTMLMatchWithTemplate } from '../../Xilara/src';
import { formatHTMLByChrome } from '../../Xilara/src/html-format'
import { generateTemplateFromRoadrunnerFile } from '../../Xilara/src/roadrunner';

const analyzeTemplateMatchingResult = async () => {
  const responsesDir = `${process.cwd()}/data/openbugbounty/responses`;
  const validReports = JSON.parse(fs.readFileSync('data/openbugbounty/valid-reports.json'));

  let allReports = 0;
  let correctReports = 0;
  let missBlockedReports = 0;
  let verificationMissBlockedReports = 0;
  let passPoCReports = 0;
  let blockedSafeResponses = 0;

  for (let report of validReports) {
    const responseDir = `${responsesDir}/${report}`;
    const roadrunnerFile = `data/openbugbounty/templates/${report}`;

    const baseResponses = [1, 2, 3, 4].map(id => `${responseDir}/${id}`);
    const safeVerificationResponses = [5].map(id => `${responseDir}/${id}`);
    const otherResponses = [].map(id => `${responseDir}/${id}`);
    const pocResponses = ['poc'].map(id => `${responseDir}/${id}`);

    let allFilesExist = true;
    for (let file of [ roadrunnerFile, ...baseResponses, ...safeVerificationResponses,
      ...otherResponses, ...pocResponses ]) {
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
    // 137710: invalid character in entity name(&がある)
    // 232070: Invalid character in tag name
    // もしかして, textを出さなければいけるのでは？
    if ([113850, 137710, 219900, 232070, 243710, 248640, 262540, 265520, 92930].includes(+report)) {
      continue
    }

    ++allReports;
    const formattedHTMLs = await Promise.all(baseResponses.map(async (htmlFile) => {
      const html = fs.readFileSync(htmlFile).toString();
      return await formatHTMLByChrome(html);
    }));
    const template = await generateTemplateFromRoadrunnerFile(roadrunnerFile, formattedHTMLs);

    console.log(`===== start report ${report}`);

    let missBlocked = false;
    for (let html of baseResponses) {
      const htmlContent = fs.readFileSync(html).toString();
      const { result, matchMap } = await isHTMLMatchWithTemplate(htmlContent, template);
      // result should be true
      console.log(html, result);
      if (!result) {
        missBlocked = true;
        ++blockedSafeResponses;
      }
    }
    if (missBlocked) {
      ++missBlockedReports;
    }

    let verificationMissBlocked = false;
    for (let html of safeVerificationResponses) {
      const htmlContent = fs.readFileSync(html).toString();
      const { result, matchMap } = await isHTMLMatchWithTemplate(htmlContent, template);
      // result should be true
      console.log(html, result);
      if (!result) {
        verificationMissBlocked = true;
        ++blockedSafeResponses;
      }
    }
    if (verificationMissBlocked) {
      ++verificationMissBlockedReports;
    }

    let passPoC = false;
    for (let html of pocResponses) {
      const htmlContent = fs.readFileSync(html).toString();
      const { result } = await isHTMLMatchWithTemplate(htmlContent, template);
      // result should not be true
      console.log(html, result);
      if (result) {
        passPoC = true;
      }
    }
    if (passPoC) {
      ++passPoCReports;
    }

    if (!missBlocked && !verificationMissBlocked && !passPoC) {
      ++correctReports;
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
