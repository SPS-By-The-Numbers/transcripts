import { DiarizedTranscript } from 'common/transcript';
import * as fs from 'node:fs/promises';

import type { StorageAccessor } from 'common/storage';

// Work around JSDOM missing TextDecoder.
import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextDecoder, TextEncoder });

const TEST_VIDEOID = 'a95KMDHf4vQ';
const TEST_BUCKET = 'testbucket';
const TEST_CATEGORY = 'testcategory';

// All data is stored uncompressed in testdata even if the extension is .gz or .xz.
// This is for simplicity. It might be a bad idea. Who knows.
class TestStorageAccessor implements StorageAccessor {
  readBytes(path: string) : Promise<ArrayBuffer> {
    const thunk = async () => {
      const b = await fs.readFile([global.TESTDATA_PATH, TEST_BUCKET, path].join('/'));
      return new Uint8Array(b).buffer;
    };

    return thunk();
  }
  writeBytes(path: string, data: string) : Promise<unknown> {
    return fs.writeFile([global.TESTDATA_PATH, TEST_BUCKET, path].join('/'), data);
  }

  // Returns uncompressed bytes from an path using lzma.
  readBytesLzma(path: string) : Promise<ArrayBuffer> {
    return this.readBytes(path);
  }

  writeBytesLzma(path: string, data: string) : Promise<unknown> {
    return this.writeBytes(path, data);
  }

  readBytesGzip(path: string) : Promise<ArrayBuffer> {
    return this.readBytes(path);
  }

  writeBytesGzip(path: string, data: string) : Promise<unknown> {
    return this.writeBytes(path, data);
  }
}

it('fromWhisperXArchive() loads and splits whisper into sentences with correct timings', async () => {
  const accessor = new TestStorageAccessor();
  // Note: The file in testsdata has an .xz extension but is NOT lzma
  // encrypted. This allows not loading the lzma compressor in the common
  // directory.
  const transcript = await DiarizedTranscript.fromWhisperXArchive(accessor, TEST_CATEGORY, TEST_VIDEOID, "eng");

  expect(transcript.category).toStrictEqual(TEST_CATEGORY);
  expect(transcript.videoId).toStrictEqual(TEST_VIDEOID);

  // Should generate an iso639-3 code instead of a iso639-2 code.
  expect(transcript.originalLanguage).toStrictEqual('eng');

  // Basic integrity check of the data.
  const expectedSentences = 88;  // Golden test number.
  expect(transcript.sentenceInfo.length).toStrictEqual(expectedSentences);
  const allSentenceIds = transcript.sentenceInfo.map(s => s[0]);
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
  expect(transcript.languageToSentenceTable[transcript.originalLanguage]).not.toBeNull();
  const numTranslatedSentences =
    Object.keys(transcript.languageToSentenceTable[transcript.originalLanguage]).length;
  expect(transcript.sentenceInfo.length).toEqual(numTranslatedSentences);
});

it('DiarizedTranscript.fromStorage() loads split data files', async () => {
  const accessor = new TestStorageAccessor();
  const transcript = await DiarizedTranscript.fromStorage(accessor, TEST_CATEGORY, TEST_VIDEOID, ["eng"]);
  expect(transcript.originalLanguage).toBe('eng');
  expect(Object.keys(transcript.languageToSentenceTable)).toStrictEqual(['eng']);

  // Check golden file value. There are 101 sentences in the file.
  expect(transcript.sentenceInfo.length).toBe(101);
  expect(Object.keys(transcript.languageToSentenceTable['eng']).length).toBe(101);
  expect(transcript.loadErrors.length).toBe(0);
});
