'use client'

import Link from 'next/link'
import SpeakerInfo, { getSpeakerAttributes, toColorClass } from 'components/SpeakerInfo'
import YouTube from 'react-youtube'
import { useState } from 'react'

function toTimeAnchor(seconds) {
    if (seconds) {
        const hhmmss = new Date(seconds * 1000).toISOString().slice(11, 19);
        return `#${hhmmss}`;
    }
    return '';
}

function toSec(hhmmss) {
    const parts = hhmmss.split(':');
    return Number(parts[2]) + Number((parts[1]) * 60) + Number((parts[0] * 60 * 60));
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

const ytplayerStyle = {
    aspectRatio: '16 / 9',
    width: '100%',
    height: 'auto',
};

const youtubeOpts = {
    height: '390',
    width: '640',
    playerVars: {
        playsinline: 1
    }
};

export default function BoardMeeting({ metadata, category, transcript, initialSpeakerInfo }) {
  const [ytComponent, setYtComponent] = useState(null);
  const [speakerInfo, setSpeakerInfo] = useState(initialSpeakerInfo);
  const videoId = metadata.video_id;

  const speakerBubble = [];
  let curSpeaker = null;
  let curWordAnchors = []
  const speakerSuggestion = [];
  const speakerKeys = new Set();

  function onReady(event) {
    setYtComponent(event.target);
    if (window.location.hash) {
      const selString = `a[name="${window.location.hash.substr(1)}"]`;
      const el = document.querySelector(selString);
      if (el) {
        el.scrollIntoViewIfNeeded();
        jumpToTimeInternal(toSec(el.href.split('#')[1]));
      }
    }
  }

  function jumpToTimeInternal(timeSec) {
    if (ytComponent) {
      ytComponent.seekTo(timeSec);
      ytComponent.playVideo();
    }
  }

  function jumpToTime(event) {
    const fragment = (new URL(event.target.href)).hash.split('#')[1];
    history.pushState(null, null, event.target.href);
    jumpToTimeInternal(toSec(fragment));
  }

  // Merge all segments from the same speaker to produce speaking divs.
  for (const [i, segment] of Object.values(transcript.segments).entries()) {
    // If speaker changed, push the div and reset curWordAnchors.
    if (curSpeaker && curSpeaker !== segment['speaker'] && curWordAnchors.length > 0) {
      const { name, color } = getSpeakerAttributes(curSpeaker, speakerInfo);
      speakerBubble.push(
        <section
            key={`b-${i}`}
            className={`b ${toColorClass(curSpeaker)}`}>
          <h2>{name}</h2>
          {curWordAnchors}
        </section>);
      curWordAnchors = [];
    }
    curSpeaker = segment['speaker'] || 'SPEAKER_9999';
    speakerKeys.add(curSpeaker);
    const startTime = segment['start'];
    curWordAnchors.push(
      <Link key={`seg-${i}`}
          href={toTimeAnchor(startTime)}
          onClick={jumpToTime}>
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

          <div id="player-div" style={{ position: 'sticky', top: '20px', float: 'right', width: '45%' }}>
              <YouTube style={ytplayerStyle} videoId={ metadata.video_id } opts={youtubeOpts} onReady={onReady} />
              <div className="px-2 border border-2 border-black rounded">
                  <SpeakerInfo
                      category={category}
                      speakerKeys={speakerKeys}
                      videoId={videoId}
                      speakerInfo={speakerInfo}
                      setSpeakerInfo={setSpeakerInfo} />
              </div>
          </div>

          <section>
              {speakerBubble}
          </section>
      </main>
  );
}
