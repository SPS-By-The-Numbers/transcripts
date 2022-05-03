const Fs = require('fs');
const CsvReadableStream = require('csv-reader');
const createCsvWriter = require('csv-writer').createArrayCsvWriter;
const Typos = require('./typos.json');

const inputStream = Fs.createReadStream('input.csv', 'utf8');

function expandToken(tokens, delim) {
  const result = [];
  for (const t of tokens) {
    const new_tokens = t.split(delim);
    result.push(...new_tokens.map(nt => {
      const trimmed = nt.trim();
      if (Typos.hasOwnProperty(trimmed)) {
        return Typos[trimmed];
      }
      return trimmed;
    }));
  }

  return result.filter(r => r);
}

function mergeSchools(schools, new_data) {
  let tokens = expandToken([new_data], ',');
  tokens = expandToken(tokens, '&');
  tokens = expandToken(tokens, '+');
  tokens = expandToken(tokens, ' and ');
  tokens = expandToken(tokens, 'OR');
  tokens = expandToken(tokens, ';');

  for (s of tokens) {
    schools[s] = '';
  }
}

function processRows(header, raw_data) {
  // Extract all schools. Column 10 is the list of schools which may be free, form.
  for (r of raw_data) {
    const schools = {};
    mergeSchools(schools, r[9])
    r.push(Object.keys(schools).sort());
  }
  header.push('cleaned schools');
}

const raw_rows = [];

inputStream
  .pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
    .on('data', function (row) {
        raw_rows.push(row);
    })
  .on('end', function () {
      const header = raw_rows[0];
      const data = raw_rows.splice(1);
      processRows(header, data);

      const csvWriter = createCsvWriter({
          path: 'out.csv',
          header});
      csvWriter.writeRecords(data)
      .then(() => {
          console.log('...Done');
      });
   });

