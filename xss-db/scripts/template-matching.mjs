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
      const result = await isHTMLMatchWithTemplate(html, templateFile);
      // result should be true
    }
    for (let html of pocResponses) {
      const result = await isHTMLMatchWithTemplate(html, templateFile);
      // result should not be true
    }
  }
};
analyzeTemplateMatchingResult();
