import childProcess from 'child_process';
import fs from 'fs';

const createTemplate = (report, preference, safeResponses) => {
  const result = childProcess.spawn('./gradlew', [
    'run',
    `-Pargs="-N${report} -O${preference} ${safeResponses.join(' ')}"`
  ], {
    cwd: '../Xilara/roadrunner',
    shell: true
  });

  return new Promise((resolve, reject) => {
    let output = '';
    result.stdout.on('data', (data) => {
      output += data;
    });
    result.stderr.on('data', (data) => {
      output += data;
    });
    result.on('close', (code) => {
      const templateFile = `../Xilara/roadrunner/output/${report}/${report}00.xml`;
      if (fs.existsSync(templateFile)) {
        const template = fs.readFileSync(templateFile);
        resolve(template);
      } else {
        reject(output);
      }
    });
  });
};

const createAllTemplate = async () => {
  const preference = `${process.cwd()}/preferences.xml`;
  const responsesDir = `${process.cwd()}/data/openbugbounty/responses`;
  const validReports = JSON.parse(fs.readFileSync('data/openbugbounty/valid-reports.json'));

  for (let report of validReports) {
    console.log(`generate template of report ${report}`);
    const responseDir = `${responsesDir}/${report}`;
    const templateFile = `data/openbugbounty/templates/${report}`;

    const safeResponses = [1, 2].map(id => `${responseDir}/${id}`);
    const allExists = safeResponses.filter(r => fs.existsSync(r)).length === safeResponses.length;
    if (!allExists) {
      continue;
    }

    const template = await createTemplate(report, preference, safeResponses);
    fs.writeFileSync(templateFile, template);
  }
};
createAllTemplate();
