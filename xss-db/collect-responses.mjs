import fs from 'fs';
import { listFiles, parseHTML } from './lib';

const collectResponse = async (report) => {};

const collectResponses = async () => {
  const dir = 'data/openbugbounty/reports';
  const files = await listFiles(dir);
  const reportFiles = files.filter(f => /^\d+$/.test(f));
  reportFiles.forEach(report => {
    await collectResponse(report);
  });
};
collectResponses();
