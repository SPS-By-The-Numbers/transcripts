import * as Constants from 'config/constants';
import { DiarizedTranscript, getSentenceTable } from 'common/transcript';
import { getStorageAccessor } from './utils/storage';
import { jsonOnRequest } from './utils/firebase';
import { makeResponseJson } from './utils/response';
import { v3 } from '@google-cloud/translate';

import type { CategoryId, Iso6393Code, VideoId } from 'common/params';

import type { LanguageToSentenceTable, SentenceTable } from 'common/transcript';

const translationClient = new v3.TranslationServiceClient();

// Limits from https://cloud.google.com/translate/quotas
const REQ_MAX_CODEPOINTS = 30000;
const REQ_MAX_ENTRIES = 1024;

// Map of Iso6393Code to Google Cloud Translate language.
const SupportedLanguages : { [iso6391Lang : Iso6393Code] : string } = {
  'amh': 'am',
  'eng': 'en',
  'som': 'co',
  'spa': 'es',
  'vie': 'vi',
  'zho-HANS': 'zh-CN',
  'zho-HANT': 'zh-TW',
};

export const sentences = jsonOnRequest(
  {cors: true, region: ["us-west1"]},
  async (req, res) => {
    const category : CategoryId = req.query.category;
    const videoId : VideoId = req.query.videoId;
    let originalLanguage : Iso6393Code = req.query.originalLanguage;
    const targetLanguages : Iso6393Code[] = Array.isArray(req.query.targetLanguages) ? req.query.targetLanguages : [ req.query.targetLanguages ];

    const diarizedTranscript = await DiarizedTranscript.fromStorage(getStorageAccessor(), category, videoId, [originalLanguage]);

    const origSentenceTable = await (async () => {
      if (originalLanguage) {
        return diarizedTranscript.languageToSentenceTable[originalLanguage];
      } else {
        originalLanguage = diarizedTranscript.originalLanguage;
        return getSentenceTable(getStorageAccessor(), category, videoId, originalLanguage);
      }
    })();
    if (!origSentenceTable) {
      res.status(400).send(makeResponseJson(false, `orig sentences missing for lang ${originalLanguage}`));
      return;
    }

    // Keep the ordering in case the translation system in the future can use the context.
    const sentenceIdsOrdered = Object.keys(origSentenceTable).sort();
    const origSentences = sentenceIdsOrdered.map(id => origSentenceTable[id]);

    // Do all translations.
    const translatePromises : Array<Promise<Array<string>>> = [];
    for (const lang of targetLanguages) {
      console.log("Translating to ", lang, " as ", SupportedLanguages[lang]);
      translatePromises.push(translateStrings(origSentences, SupportedLanguages[lang]));
    }
    const translateResults = await Promise.all(translatePromises);

    const writePromises : Array<Promise<unknown>> = [];
    const result : LanguageToSentenceTable = {};
    for (const [langIndex, translated] of translateResults.entries()) {
      // Generate the sentence table and stuff it into the diarizedTranscript object.
      const translatedSentenceTable : SentenceTable = {};
      for (const [index, text] of translated.entries()) {
        translatedSentenceTable[sentenceIdsOrdered[index]] = text;
      }

      const lang = targetLanguages[langIndex];

      // Put in result.
      result[lang] = translatedSentenceTable;

      // Write to disk.
      diarizedTranscript.languageToSentenceTable[lang] = translatedSentenceTable;
      writePromises.push(diarizedTranscript.writeSentenceTable(getStorageAccessor(), lang));
    }

    // Finish writes.
    await Promise.all(writePromises);

    res.status(200).send(makeResponseJson(true, 'success', result));
  }
);

async function translateStrings(
    sourceText : Array<string>,
    targetLanguage : string) : Promise<Array<string>> {
  console.log("Translating to ", targetLanguage);
  const batches = new Array<Array<string>>();

  let numBytes = 0;
  for (const text of sourceText) {
    if (batches.length === 0 ||
        batches[batches.length - 1].length >= REQ_MAX_ENTRIES ||
        numBytes + text.length >= REQ_MAX_CODEPOINTS) {
      batches.push(new Array<string>());
      numBytes = 0;
    }
    numBytes += text.length;
    batches.at(-1)?.push(text);
  }

  const allRequests = new Array<any>;
  for (const batch of batches) {
    const request = {
      contents: batch,
      mimeType: "text/plain",  // Otherwise it escapes HTML entities.
      targetLanguageCode: targetLanguage,
      parent: `projects/${Constants.FIREBASE_CLIENT_CONFIG.projectId}/locations/us-central1`,
    };

    // Run request
    allRequests.push(translationClient.translateText(request));
  }
  const responses = await Promise.all(allRequests);
  console.log(responses);
  const stuff = responses.flatMap(r => r[0].translations.map(t => t.translatedText));
  console.log(stuff);
  return stuff;
}

