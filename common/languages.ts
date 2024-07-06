// Map of ISO693-3 language codes to supported languages in Google Translate NMT mode.
// Data retrieved using the getSupportedLanguages() API from Google Cloud Translate.
//
// Code to generate the raw data file as follows.
//
// export const listlangs = jsonOnRequest(
//   {cors: true, region: ["us-west1"]},
//   async (req, res) => {
//     const request = {
//       displayLanguageCode: 'en',
//       parent: `projects/${Constants.FIREBASE_CLIENT_CONFIG.projectId}/locations/us-central1`,
//     };
// 
//     // Run request
//     res.status(200).send(makeResponseJson(true, `langs`,
//           await translationClient.getSupportedLanguages(request)));
//   }
// );

import nmtLangs from './google-nmt-langs.json';
import langs from 'langs';

// Special overrides where the Google NMT model code is NOT the ISO-693-1 code.
const LangOverride = {
  'zh-CN': 'zho-HANS',
  'zh-TW': 'zho-HANT',
  'bho': 'bho',
  'ceb': 'ceb',
  'doi': 'doi',
  'fil': 'fil',
  'haw': 'haw',
  'iw': 'heb',
  'hmn': 'hmn',
  'ilo': 'ilo',
  'jw': 'jav',
  'gom': 'gom',
  'kri': 'kri',
  'ckb': 'ckb',
  'mai': 'mai',
  'mni-Mtei': 'mni', // This might not be right...
  'lus': 'lus',
  'nso': 'nso',
};

// Languages to ignore from the Google list.
const LangIgnore = [
  'zh',  // Duplicate of zh-CN.
];

function generateSupportLangs() {
  if (!nmtLangs[0]?.languages) {
    throw "Invalid google nmt json dump";
  }

  const availableTargets = nmtLangs[0].languages.filter(entry => entry.supportTarget && !LangIgnore.find(e => e === entry.languageCode));
  return Object.fromEntries(availableTargets.map(entry => {
      let targetLang = LangOverride[entry.languageCode];
      if (!targetLang) {
        const langData = langs.where('1', entry.languageCode);
        if (langData) {
          targetLang = langData['3'];
        } else {
          throw `None for ${entry.languageCode} ${entry.displayName}`;
        }
      }

      return [ targetLang, {
            googleLang: entry.languageCode,
            displayName: entry.displayName,
          }];
    }));
}

export const SupportedLanguages = generateSupportLangs();
