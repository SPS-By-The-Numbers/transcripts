// The SPS panorama data isn't always available for download as an XLS.
// Luckily the per-school question breakdown display in the Panorama
// viewer tool is a Single-page-app where all the data, for each school,
// is loaded in one huge JSON blob in an object known as window.gon.
//
// On the overview page, the gon only has the list of schools.
// The following code is a simple web scraper that, run on the overview
// page, will create a popup that is used to navigate to each school page
// with all questions, and then extract the window.gon.  The result is
// a javascript object has schoolName => gon mappings.
//
// To run, load the panorama page. Then open up the Javascript Console
// and cut/paste all the code below.  Run
//
//  allResults = await scrapeAll();
//  console.save(allResults, 'results.json')
//
// And you should get a results.json object downloaded.

async function loadPage(w, url) {
  w.location.replace(url);
  await new Promise(r => setTimeout(r, 2000));
}

async function scrape(w, schoolId) {
    const url = `https://secure.panoramaed.com/seattle/understand/${schoolId}/summary`;
    console.log(`[scrape] going to ${url}`);

    await loadPage(w, `https://secure.panoramaed.com/seattle/understand/${schoolId}/summary`);
    const questionEl = w.document.evaluate("//a[contains(text(), 'View all questions')]",
        w.document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    if (!questionEl) {
      return null;
    }
    
    await loadPage(w, questionEl.href);
    const result = Object.assign({}, w.gon);
    result.reportData = JSON.parse(result.reportData);
    return result;
}

async function scrapeAll() {
  const schools = [...document.getElementById('school-dropdown').children].map(el => el.value).filter(v => v);
  const w = window.open();
  window.focus();
  const result = {};
  for (const s of schools) {
    const r = await scrape(w, s);
    if (r) {
      result[r.subjectName] = r;
    }
  }
  w.close();
  return result;
}


(function(console){

console.save = function(data, filename){

    if(!data) {
        console.error('Console.save: No data')
        return;
    }

    if(!filename) filename = 'console.json'

    if(typeof data === "object"){
        data = JSON.stringify(data, undefined, 4)
    }

    var blob = new Blob([data], {type: 'text/json'}),
        e    = document.createEvent('MouseEvents'),
        a    = document.createElement('a')

    a.download = filename
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e)
 }
})(console)
