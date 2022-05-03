const crypto = require('crypto');
const Fs = require('fs');
const CsvReadableStream = require('csv-reader');

const raw_rows = [];
const inputStream = Fs.createReadStream('out.csv', 'utf8');

const BusServiceOptions = [
'Bus route consistently on-time',
'Bus route consistently late',
'Bus route is running, but prefer other transportation options.',
'Bus route is NOT running. Forced to use other transportation options.',
'Bus route is NOT running. Would not use it even if it were.',
'Not assigned a bus route in 2022 (eg, newly enrolled family).',
];

const DistanceOptions = [
'Less than 1 mile',
'1 to 3 miles',
'3 to 5 miles',
'Greater than 5 miles',
];

function stringToCode(options, value) {
  results = [];
  for (const idx in options) {
    if (value.match(options[idx])) {
      results.push(idx);
    }
  }
  return results;
}

inputStream
  .pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
    .on('data', function (row) {
        raw_rows.push(row);
    })
  .on('end', function () {
    const data = [];
    const raw_data = raw_rows.splice(1);
    for (idx in raw_data) {
     const r = raw_data[idx];
     const freeFormNoBusImpact = r[10].trim();
     const freeForm3TierImpact = r[11].trim();
     const freeFormOtherComments = r[12].trim();
     data.push({
       schools: r[13],
       eligible: r[1] === 'Yes',
       useIn2022: r[2] === 'Yes',
       currentService: stringToCode(BusServiceOptions, r[3]),
       needHelp: r[4] === 'Yes',
       preferCurrentBell: r[5] === 'Keep the current 2-tier bell times with a similar level of bus service as April 2022',
       splitBellTime: r[6] === 'Yes',
       childcareChallenges: r[7] === 'Yes',
       distance: stringToCode(DistanceOptions, r[8]),
       freeFormNoBusImpact,
       freeForm3TierImpact,
       freeFormOtherComments,
       freeformFingerprint: crypto.createHash('sha256').update(
           idx + freeFormNoBusImpact + freeForm3TierImpact + freeFormOtherComments
       ).digest('base64'),

     });
    }
    console.log(JSON.stringify(data, null, 2));
  });
