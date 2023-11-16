'use client'

import Link from 'next/link'
import SpeakerInfo from 'components/SpeakerInfo'
import YouTube from 'react-youtube'
import distinctColors from 'distinct-colors'
import styles from '../styles/BoardMeeting.module.css'
import { useState } from 'react'
import Creatable from 'react-select/creatable'

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

const palette = distinctColors({ count: 45, lightMin: 70, chromaMax: 200 });

const mainStyle = {
    fontFamily: 'sans-serif',
    fontSize: '14px',
    color: '#111',
    padding: '1em 1em 1em 1em',
    backgroundColor: '#efe7dd',
};

const ltStyle = {
    color: 'inherit',
    textDecoration: 'inherit',
    display: 'inline',
    textDecoration: 'none',
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

  const dialogDivs = [];
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
        jumpToTimeInternal(el.id);
      }
    }
  }

  function getSpeakerAttributes(speaker) {
    // TODO: Make this all go into speakerInfo.
    const origLabel = speakerKeys[speaker];
    const overrideLabel = speakerInfo[speaker];
    const name = overrideLabel?.name || origLabel || speaker;
    const speakerNum = Number(speaker.split('_')[1]);
    const color = palette[speakerNum];

    return { name, color, origLabel, speaker };
  }

  function jumpToTimeInternal(id) {
    if (ytComponent) {
      ytComponent.seekTo(id);
      ytComponent.playVideo();
    }
  }

  function jumpToTime(event) {
    history.pushState(null, null, event.target.href);
    jumpToTimeInternal(event.target.id);
  }

  function handleLabelChange(event) {
    const speaker = event.target.name;
    const newSpeakerInfo = {...speakerInfo};
    newSpeakerInfo[speaker].name = event.target.value;
    setSpeakerInfo(newSpeakerInfo);
  }

  function handleNameChange(event) {
    const speaker = event.target.name;
    const newSpeakerInfo = {...speakerInfo};
    newSpeakerInfo[speaker].name = event.target.value;
    setSpeakerInfo(newSpeakerInfo);
  }

  async function handleOnClick(event) {
    shouldSubmit = false;
    for (const [s, l] of Object.entries(speakerInfo)) {
      if (speakerKeys[s] === l.name) {
        shouldSubmit = true;
        break;
      }
    }

    // Now submit.
    if (shouldSubmit) {
      // TODO: realtime db + recaptcha stuff.
      const request = { videoId: video.metadata.video_id };
      request.speakerInfo = speakerInfo;
      fetch("CLOUD_API FUCNTION",
        {
          method: "POST",
          cache: "no-cache",
          credentials: "omit",
          headers: {
              "Content-Type": "application/json",
          },
          redirect: "follow", // manual, *follow, error
          referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
          body: JSON.stringify(data), // body data type must match "Content-Type" header
        });
    }
}

  // Merge all segments from the same speaker to produce speaking divs.
  for (const [i, segment] of Object.values(transcript.segments).entries()) {
    // If speaker changed, push the div and reset curWordAnchors.
    if (curSpeaker && curSpeaker !== segment['speaker'] && curWordAnchors.length > 0) {
      const { name, color } = getSpeakerAttributes(curSpeaker);
      dialogDivs.push(
        <section key={`segment-${i}`} className={styles.e} style={{ backgroundColor: color }}>
          <div style={{ margin: 0, paddingLeft: '5px', paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px', wordWrap: 'normal', whiteSpace: 'normal' }}>
              <span data-speaker={curSpeaker} style={{ color: 'black', fontWeight: 'bold' }}>{name}</span><br />
              {curWordAnchors}
          </div>
        </section>);
      curWordAnchors = [];
    }
    curSpeaker = segment['speaker'] || 'SPEAKER_9999';
    speakerKeys.add(curSpeaker);

    const wordsInSegment = [];
    for (const [j, word] of segment['words'].entries()) {
      wordsInSegment.push(
        <Link key={`word-${i}-${j}`} name={toTimeAnchor(word['start']).substr(1)} href={toTimeAnchor(word['start'])} id={word['start']} style={ltStyle} onClick={jumpToTime}> {word['word']}</Link>
      );
    }
    curWordAnchors.push(<p key={`segment-${i}`} className="my-1.5 leading-tight">{wordsInSegment}</p>);
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
                      speakerKeys={speakerKeys}
                      videoId={videoId}
                      initialSpeakerInfo={initialSpeakerInfo} />
              </div>
          </div>

          <div className="dialogs">
              {dialogDivs}
          </div>
      </main>
  );
}
