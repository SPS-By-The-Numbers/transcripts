import * as Transcript from './transcript';
import * as fsPromise from 'node:fs/promises';
import * as fs from 'node:fs/promises';

// Work around JSDOM missing TextDecoder.
import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextDecoder, TextEncoder });

const TEST_VIDEOID = 'a95KMDHf4vQ';
const TEST_BUCKET = 'testbucket';
const TEST_CATEGORY = 'testcategory';

class TestStorageAccessor implements Transcript.StorageAccessor {
  getBytes(path: string) : Promise<ArrayBuffer> {
    return fs.readFile([global.TESTDATA_PATH, TEST_BUCKET, path].join('/'));
  }
}

it('toDiarizedTranscript() resplits whisper into sentences with correct timings', async () => {
  const whisperX = JSON.parse(
      await fsPromise.readFile([global.TESTDATA_PATH, TEST_BUCKET, 'whisperx-raw.en.json'].join('/')));

  const [transcript, sentences] = Transcript.toTranscript(whisperX);

  // Should generate an iso639-3 code instead of a iso639-2 code.
  expect(transcript.language).toStrictEqual('eng');

  // Basic integrity check of the data.
  const expectedSentences = 88;  // Golden test number.
  expect(transcript.sentenceMetadata.length).toStrictEqual(expectedSentences);
  const allSentenceIds = transcript.sentenceMetadata.map(s => s[0]);
  expect(allSentenceIds.length).toStrictEqual(expectedSentences);

  for (const [id, sentenceId] of allSentenceIds.entries()) {
    // This is an implementation detail but still a useful sanity check.
    // Though the sentence ids can be any string unique to one transcript,
    // the toTranscript() function uses sequential numbers to genrate the ids.
    // Checking that the number equals the array position manages to imply
    // that the algortihm produces the right structure of data (no skipping
    // items, no off-by-ones, no id stringification issues, etc).
    expect(sentenceId).toEqual(id.toString());
  }
  expect(transcript.sentenceMetadata.length).toEqual(sentences.length);
});

it('DiarizedTranscript.makeFromStorage() loads files', async () => {
  const accessor = new TestStorageAccessor();
  const transcript = await Transcript.DiarizedTranscript.makeFromStorage(accessor, TEST_CATEGORY, TEST_VIDEOID, ["eng"]);
  expect(transcript.originalLanguage).toBe('eng');
  expect(Object.keys(transcript.languageToSentenceTable)).toStrictEqual(['eng']);

  // Check golden file value. There are 101 sentences in the file.
  expect(transcript.sentenceMetadata.length).toBe(101);
  expect(Object.keys(transcript.languageToSentenceTable['eng']).length).toBe(101);
  expect(transcript.loadErrors.length).toBe(0);
});
