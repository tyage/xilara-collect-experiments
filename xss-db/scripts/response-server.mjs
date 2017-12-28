import express from 'express';

const app = express();

app.get('/responses/:report/:page', (req, res) => {
  const content = fs.readFileSync(`../data/openbugbounty/responses/${req.params.report}/${req.params.page}`);
  res.html(content);
});

app.listen(3000);
