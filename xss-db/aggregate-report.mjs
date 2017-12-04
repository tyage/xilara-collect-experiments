import fs from 'fs';
import cheerio from 'cheerio';

const getReportsFromList = async () => {
  let reports = [];
  // TODO: search all files
  const lastId = 4498;
  for (let id = 1; id <= lastId; ++id) {
    const filename = `data/openbugbounty/list/${id}`;
    const contents = fs.readFileSync(filename).toString();
    const $ = cheerio.load(contents);
    const [ reportTable ] = $('table.latest-submissions-main.latest-submissions-main-top.latest-submissions-main-alexa.latest-submissions-latest-page').toArray();
    if (!reportTable) {
      console.log(`something wrong with ${id}`);
      return;
    }

    const reportsInPage = $('tr', reportTable)
      .filter(i => i !== 0)
      .map((i, row) => {
        try {
          const [ domainTD, researcherTD, dateTD, statusTD, typeTD ] = $('td', row).toArray();
          const id = $('a', domainTD).attr('href').match(/\d+/)[0];
          const status = $(statusTD).text().trim();
          const type = $(typeTD).text().trim();
          console.log({ id, status, type });
          return { id, status, type };
        } catch(e) {
          console.log(e);
          console.log(`something wrong with row ${i} in page ${id}`)
          return {};
        }
      }).toArray();
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
