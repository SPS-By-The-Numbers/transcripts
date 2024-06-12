import { makeDiarizedTranscriptsPath } from 'utilities/transcript';

it('renders homepage unchanged', () => {
  expect(makeDiarizedTranscriptsPath('boo', '123', 'eng')).toEqual('transcripts/public/boo/diarized/123.eng.json');
})
