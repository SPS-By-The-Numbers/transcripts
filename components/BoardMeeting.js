import Link from 'next/link'
import SpeakerBubble from 'components/SpeakerBubble'
import VideoPlayer from 'components/VideoPlayer'
import YouTube from 'react-youtube'

function toTimeAnchor(seconds) {
    if (seconds) {
        const hhmmss = new Date(seconds * 1000).toISOString().slice(11, 19);
        return `#${hhmmss}`;
    }
    return '';
}

function cloudDownloadURL(category, videoId, ext) {
    return `https://storage.googleapis.com/sps-by-the-numbers.appspot.com/transcription/${category}/${videoId[0]}/${videoId}.${ext}`
}

const mainStyle = {
    fontFamily: 'sans-serif',
    fontSize: '14px',
    color: '#111',
    padding: '1em 1em 1em 1em',
    backgroundColor: '#efe7dd',
};

export default function BoardMeeting({ metadata, category, transcript, initialSpeakerInfo }) {
  const videoId = metadata.video_id;

  const speakerBubbles = [];
  let curSpeaker = null;
  let curWordAnchors = []
  const speakerKeys = new Set();

  // Merge all segments from the same speaker to produce speaking divs.
  for (const [i, segment] of Object.values(transcript.segments).entries()) {
    // If speaker changed, push the div and reset curWordAnchors.
    if (curSpeaker && curSpeaker !== segment['speaker'] && curWordAnchors.length > 0) {
      const speakerNum = curSpeaker.split('_')[1];
      speakerBubbles.push(
        <SpeakerBubble
            key={i}
            speakerNum={ speakerNum }>
          {curWordAnchors}
        </SpeakerBubble>
      );
      curWordAnchors = [];
    }
    curSpeaker = segment['speaker'] || 'SPEAKER_9999';
    speakerKeys.add(curSpeaker);
    const startTime = segment['start'];
    curWordAnchors.push(
      <Link key={`seg-${i}`}
          href={toTimeAnchor(startTime)}>
        {segment['text']}
      </Link>);
  }

  return (
      <main style={mainStyle}>
          <div className="flex">
              <div className="flex-auto text-right">
                  <b>Data Files:</b>
                  <Link className={"px-1"} href={cloudDownloadURL(category, metadata.video_id, 'json')}>json</Link>
                  <Link className={"px-1 border-l-2 border-gray-600 border-dashed"} href={cloudDownloadURL(category, metadata.video_id, 'tsv')}>tsv</Link>
                  <Link className={"px-1 border-l-2 border-gray-600 border-dashed"} href={cloudDownloadURL(category, metadata.video_id, 'txt')}>txt</Link>
                  <Link className={"px-1 border-l-2 border-gray-600 border-dashed"} href={cloudDownloadURL(category, metadata.video_id, 'srt')}>srt</Link>
                  <Link className={"px-1 border-l-2 border-gray-600 border-dashed"} href={cloudDownloadURL(category, metadata.video_id, 'vtt')}>vtt</Link>
              </div>
              <div className={"flex-auto text-right"}>
                  <i>Code adapted from <Link href="https://colab.research.google.com/github/Majdoddin/nlp/blob/main/Pyannote_plays_and_Whisper_rhymes_v_2_0.ipynb">{"Majdoddin's collab example"}</Link></i>
              </div>
          </div>

          <div>
              <div className="p-2 bg-slate-50 my-2 border-dashed border-2 border-black">
                  <h2>{ metadata.title }</h2>
                  <p>{ metadata.description }</p>
                  <p><b>Click on words in the transcription to jump to its portion of the audio. The URL can be copy/pasted to get back to the exact second.</b></p>
              </div>
          </div>

          <section>
              {speakerBubbles}
          </section>

          <VideoPlayer
            category={category}
            speakerKeys={speakerKeys}
            videoId={videoId} />
      </main>
  );
}
