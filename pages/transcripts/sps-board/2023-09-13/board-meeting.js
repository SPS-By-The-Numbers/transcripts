import React from 'react'
import YouTube from 'react-youtube'
import styles from './_style.module.css'
import Transcript from './_board-meeting.json'
import distinctColors from 'distinct-colors'

function toTimeAnchor(seconds) {
  if (seconds) {
    const hhmmss = new Date(seconds * 1000).toISOString().slice(11, 19);
    return `#${hhmmss}`;
  }
  return '';
}

const palette = distinctColors({count: 25, lightMin: 70, chromaMax: 200});
const speakerNames = {
  'SPEAKER_00':'Chris Jackins',
  'SPEAKER_01':'Faisal Mohamed',
  'SPEAKER_02':'Kevin Pratt',
  'SPEAKER_03':'Muammar Hermanstein',
  'SPEAKER_04':'AJ Crabill',
  'SPEAKER_05':'Brent Jones',
  'SPEAKER_06':'Brandon Hersey',
  'SPEAKER_08':'Michelle Sarju',
  'SPEAKER_09':'Michelle Sarju',
  'SPEAKER_10':'Katie Kang',
  'SPEAKER_11':'Lisa Rivera-Smith',
  'SPEAKER_12':'Liza Rankin',
  'SPEAKER_13':'Leslie Harris',
  'SPEAKER_14':'Chandra Hampson',
  'SPEAKER_15':'Lola van der Neut',
  'SPEAKER_16':'Liza Rankin',
  'SPEAKER_17':'Vivian Song',
  'SPEAKER_19':'Ellie Wilson-Jones',
  'SPEAKER_20':'Jennifer Goff',
  'SPEAKER_21':'Jessica Jones',
  'SPEAKER_24':'Shannon Crowley',
};

function getSpeakerAttributes(speaker) {
  let name = speakerNames[speaker];
  const speakerNum = Number(speaker.split('_')[1]);
  const color = palette[speakerNum];
  if (!name) {
    name = speaker;
  }

  return {name, color};
}

class BoardMeeting extends React.Component {
  constructor() {
    super();

    // Binding method
    this.onReady = this.onReady.bind(this);
    this.ytComponent = null;
    this.jumpToTime = this.jumpToTime.bind(this);
    this.jumpToTimeInternal = this.jumpToTimeInternal.bind(this);
  } 

  onReady(event) {
    this.ytComponent = event.target;
    if (window.location.hash) {
      const selString = `a[name="${window.location.hash.substr(1)}"]`;
      const el = document.querySelector(selString);
      if (el) {
        el.scrollIntoViewIfNeeded();
        this.jumpToTimeInternal(el.id);
      }
    }
  }

  jumpToTimeInternal(id) {
    if (this.ytComponent) {
      this.ytComponent.seekTo(id);
      this.ytComponent.playVideo();
    }
  }

  jumpToTime(event) {
    history.pushState(null, null, event.target.href);
    this.jumpToTimeInternal(event.target.id);
  }

  render = () => {
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

    const dialogDivs = [];
    let curSpeaker = null;
    let curWordAnchors = []

    for (const segment of Object.values(Transcript.segments)) {
      // If speaker changed, push the div and reset curWordAnchors.
      if (curSpeaker && curSpeaker !== segment['speaker'] && curWordAnchors.length > 0) {
        const {name, color} = getSpeakerAttributes(curSpeaker);
        dialogDivs.push(
          <div className={styles.e} style={{backgroundColor: color}}>
            <p  style={{margin: 0, paddingLeft: '5px', paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px', wordWrap: 'normal', whiteSpace: 'normal'}}>
              <span style={{ color: 'black', fontWeight: 'bold' }}>{name}</span><br />
              {curWordAnchors}
            </p>
          </div>);
        curWordAnchors = [];
      }
      curSpeaker = segment['speaker']

      for (const word of segment['words']) {
        curWordAnchors.push(
          <a name={toTimeAnchor(word['start']).substr(1)} href={toTimeAnchor(word['start'])} id={word['start']} style={ltStyle} onClick={this.jumpToTime}> {word['word']}</a>
        );
      }
      
    }


    return (
      <main style={mainStyle}>
        <h2>SPS Board Meeting</h2>
        <h3><i>Click on a part of the transcription, to jump to its portion of audio, and get an anchor to it in the address bar
                bar<br /><br /></i></h3>
        <div id="player-div" style={{position: 'sticky', top: '20px', float: 'right', width: '40%'}}>
          <YouTube style={ytplayerStyle} videoId="8FF-Nz0WyMs" opts={youtubeOpts} onReady={this.onReady} />
        </div>
        { dialogDivs }
      </main>
    );
  }
}

export default BoardMeeting;
