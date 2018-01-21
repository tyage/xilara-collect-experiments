import childProcess from 'child_process';
import fs from 'fs';
import { isHTMLMatchWithTemplate } from '../../Xilara/src';
import { formatHTMLByChrome } from '../../Xilara/src/html-format'
import { generateTemplateFromRoadrunnerFile } from '../../Xilara/src/roadrunner';

const analyzeTemplateMatchingResult = async () => {
  const responsesDir = `${process.cwd()}/data/openbugbounty/responses`;
  const validReports = JSON.parse(fs.readFileSync('data/openbugbounty/valid-reports.json'));

  for (let report of validReports) {
    const responseDir = `${responsesDir}/${report}`;
    const roadrunnerFile = `data/openbugbounty/templates/${report}`;

    const safeResponses = [1, 2, 3].map(id => `${responseDir}/${id}`);
    const pocResponses = ['poc'].map(id => `${responseDir}/${id}`);

    let allFilesExist = true;
    for (let file of [ roadrunnerFile, ...safeResponses, ...pocResponses ]) {
      if (!fs.existsSync(file)) {
        allFilesExist = false;
        break;
      }
    }
    if (!allFilesExist) {
      continue;
    }

    const htmls = [1, 2].map(id => `${responseDir}/${id}`);
    const formattedHTMLs = await Promise.all(htmls.map(async (htmlFile) => {
      const html = fs.readFileSync(htmlFile).toString();
      return await formatHTMLByChrome(html);
    }));
    const template = await generateTemplateFromRoadrunnerFile(roadrunnerFile, formattedHTMLs);

    console.log(`===== start report ${report}`);
    for (let html of safeResponses) {
      const htmlContent = fs.readFileSync(html);
      const { result, matchMap } = await isHTMLMatchWithTemplate(htmlContent, template);
      // result should be true
      console.log(html, result);
    }
    for (let html of pocResponses) {
      const htmlContent = fs.readFileSync(html);
      const { result } = await isHTMLMatchWithTemplate(htmlContent, template);
      // result should not be true
      console.log(html, result);
    }
  }
};
analyzeTemplateMatchingResult();
