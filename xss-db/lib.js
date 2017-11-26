export const fetch = (url) => {
  console.log(`start to fetch ${url}`);
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', (res) => {
        resolve(body);
      });
    });
  });
};
export const sleep = (msec) => new Promise((resolve) => setTimeout(resolve, msec));
