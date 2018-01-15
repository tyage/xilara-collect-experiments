import childProcess from 'child_process';
import fs from 'fs';
import { isHTMLMatchWithTemplate } from '../../Xilara/src';

const analyzeTemplateMatchingResult = async () => {
  const responsesDir = `${process.cwd()}/data/openbugbounty/responses`;
  const validReports = JSON.parse(fs.readFileSync('data/openbugbounty/valid-reports.json'));

  for (let report of validReports) {
    const responseDir = `${responsesDir}/${report}`;
    const templateFile = `data/openbugbounty/templates/${report}`;

    if (!fs.existsSync(templateFile)) {
      continue;
    }
    const template = fs.readFileSync(templateFile);

    const safeResponses = [1, 2, 3].map(id => `${responseDir}/${id}`);
    const pocResponses = ['poc'].map(id => `${responseDir}/${id}`);

    for (let html of safeResponses) {
      const htmlContent = fs.readFileSync(html);
      const result = await isHTMLMatchWithTemplate(htmlContent, template);
      // result should be true
      console.log(html, result);
    }
    for (let html of pocResponses) {
      const htmlContent = fs.readFileSync(html);
      const result = await isHTMLMatchWithTemplate(htmlContent, template);
      // result should not be true
      console.log(html, result);
    }
  }
};
analyzeTemplateMatchingResult();
