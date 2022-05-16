const fs = require("fs");

const panoramaData = JSON.parse(fs.readFileSync(process.argv[2]));
const schools = {};

function addSchool(name, data) {
  schools[name] = data;
}

function flattenSurveyData(rawGon) {
  const result = {};
  const report = rawGon.reportData.report;
  const context = rawGon.reportData.report.context;
  const answerGroups = {};
  context.answerGroups.forEach(e => { answerGroups[e.id] = e.answerIds });

  const answers = {};
  context.answers.forEach(e => { answers[e.id] = e.text });

  const cards = {};
  report.cards.forEach(c => { cards[`${c.targetId}-${c.cardType}`] = c});

  for (const q of context.questions) {
     const cardAnswers = {};
     const card = cards[`${q.id}-distribution`];
     if (!card) {
       console.error(q.id);
       continue;
     }

     const tmp = card .data.answers;
     if (!tmp) {
       console.error(q.id);
       continue;
     }

     tmp.forEach(a => {cardAnswers[a.answerId] = a});

     result[q.text] = {
       negativelyCoded: q.negativelyCoded,
       answers: answerGroups[q.answerGroupId].map(id => answers[id]),
       answer_respondents: answerGroups[q.answerGroupId].map(id => cardAnswers[id].value)
     }
  }

  return result;
}

// Output 
for (const [school, schoolData] of Object.entries(panoramaData)) {
  addSchool(school, flattenSurveyData(schoolData));
}

published = {
 reports: {
   "School Report": {
      "All Available Schools": schools
   }
 }
};

console.log(JSON.stringify(published, null, 2));
