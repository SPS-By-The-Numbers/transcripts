const Fs = require('fs');
const CsvReadableStream = require('csv-reader');
const inputStream = Fs.createReadStream(process.argv[2], 'utf8');
const panoramaData = require(process.argv[3]);

const raw_rows = [];


function getOspiData(raw_data) {
  const ospi_data = {};
  // Extract all schools. Column 10 is the list of schools which may be free, form.
  for (r of raw_data) {
    const name = r[1];
    if (!r[1]) continue;
    const school = ospi_data[name] = {};
    school.num_students = r[3];

    school.female = r[4];
    school.genderx = r[5];
    school.male = r[6];

    school.native = r[7];
    school.asian = r[8];
    school.black = r[9];
    school.hispanic = r[10];
    school.island = r[11];
    school.multiple = r[12];
    school.white = r[13];

    school.ell = r[14];
    school.hcc = r[15];
    school.homeless = r[16];
    school.lowincome = r[17];
    school.migrant = r[18];
    school.military = r[19];
    school.mobile = r[20];
    school.section504 = r[21];
    school.disabilities = r[22];
  }
  return ospi_data;
}

inputStream
  .pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
    .on('data', function (row) {
        raw_rows.push(row);
    })
  .on('end', function () {
      const header = raw_rows[0];
      const data = raw_rows.splice(1);
      const ospi_data = getOspiData(data);
      const schools = panoramaData.reports['School Report']['All Available Schools'];
      for (const [name, d] of Object.entries(ospi_data)) {
        schools[name]["OSPI Racial Demographics"] = {
          answers: [
            "American Indian/ Alaskan Native",
            "Asian",
            "Black/ African American",
            "Hispanic/ Latino of any race(s)",
            "Native Hawaiian/ Other Pacific Islander",
            "Two or More Races",
            "White"
          ],
          answer_respondents: [
            d.native,
            d.asian,
            d.black,
            d.hispanic,
            d.island,
            d.multiple,
            d.white,
          ],
        };
        schools[name]["OSPI Gender Demographics"] = {
          answers: [
            "Female",
            "Gender X",
            "Male",
          ],
          answer_respondents: [
             d.female,
             d.genderx,
             d.male,
          ],
        };
        /*
          This does not come out to a percentage so the numbers are all wrong.
        schools[name]["OSPI Demographic Attributes"] = {
          answers: [
            "English Language Learners",
            "Highly Capable",
            "Homeless",
            "Low-Income",
            "Migrant",
            "Military Parent",
            "Mobile",
            "Section 504",
            "Students with Disabilities",
          ],
          answer_respondents: [
             d.ell,
             d.hcc,
             d.homeless,
             d.lowincome,
             d.migrant,
             d.military,
             d.mobile,
             d.section504,
             d.disabilities,
          ],
        };
        */
      }

      console.log(JSON.stringify(panoramaData, null, 2));
   });

