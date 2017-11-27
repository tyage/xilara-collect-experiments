import fs from 'fs';
import { parseHTML } from './lib';
import htmlparser from 'htmlparser2';
const { DomUtils } = htmlparser;

const getReportsFromList = async () => {
  let reports = [];
  // TODO: search all files
  const lastId = 4498;
  for (let id = 1; id <= lastId; ++id) {
    const filename = `data/openbugbounty/list/${id}`;
    const contents = fs.readFileSync(filename).toString();
    const html = await parseHTML(contents);
    const [ reportTable ] = DomUtils.findAll((e) => (
      e.name === 'table' &&
      e.attribs.class === 'latest-submissions-main latest-submissions-main-top latest-submissions-main-alexa latest-submissions-latest-page'
    ), html);
    if (!reportTable) {
      console.log(`something wrong with ${id}`);
      return;
    }

    const reportsInPage = reportTable.children
      .filter((row, i) => row.type === 'tag' && row.name === 'tr')
      .filter((row, i) => i !== 0)
      .map((row, i) => {
        try {
          const tds = DomUtils.getElementsByTagName('td', row);
          const id = DomUtils.getElementsByTagName('a', tds[0])[0].attribs.href.match(/\d+/)[0];
          const statusNode = DomUtils.findAll(e => e.name === 'font' || e.name === 'span', [ tds[3] ])[0];
          const status = statusNode ? statusNode.children[0].data : null;
          const typeNode = DomUtils.findAll(e => e.name === 'font' || e.name === 'span', [ tds[4] ])[0];
          const type = typeNode ? typeNode.children[0].data : null;
          return { id, status, type };
        } catch(e) {
          console.log(e);
          console.log(`something wrong with row ${i} in page ${id}`)
          return {};
        }
      });
    reports = [...reports, ...reportsInPage];
  }

  // delete duplicated report
  const idToReport = {};
  reports.forEach(r => idToReport[r.id] = r);
  reports = Object.entries(idToReport).map(([k, v]) => v);

  return reports;
};

const saveReports = async () => {
  const reports = await getReportsFromList();
  fs.writeFileSync('data/openbugbounty/reports.json', JSON.stringify(reports));
};
saveReports();
