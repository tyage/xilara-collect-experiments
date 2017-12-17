import fs from 'fs';
import { fetch, sleep } from '../lib';

const fetchListPage = (id) => fetch(`https://www.openbugbounty.org/latest/page/${id}/`);
const getLastListPage = () => {
  // TODO: implement
  return 4498;
};

const fetchAllList = async () => {
  const lastPage = getLastListPage();
  for (let id = 1; id <= lastPage; ++id) {
    const filename = `data/openbugbounty/list/${id}`;
    const body = await fetchListPage(id);
    fs.writeFileSync(filename, body);
    await sleep(1000);
  }
};
fetchAllList();
