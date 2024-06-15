import * as Transcript from './transcript';
import * as fs from 'node:fs/promises';

class TestStorageAccessor {
  getBytes(bucket: string, path : string) : Promise<string> {
    return fs.readFile([global.TESTDATA_PATH, bucket, path].join('/'), {encoding: 'utf8'});
  }
  writeBytes(bucket: string, path : string, data : Buffer) {
    return fs.writeFile(['testdata', bucket, path].join('/'), data);
  }
}

it('toDiarizedTranscript() resplits whisper into sentences with correct timings', async () => {
  const accessor = new TestStorageAccessor();
  const whisperX = JSON.parse(await accessor.getBytes('testbucket', 'whisperx-raw.en.json'));

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
