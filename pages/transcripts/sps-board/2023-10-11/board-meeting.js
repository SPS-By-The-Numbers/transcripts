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

const palette = distinctColors({count: 42, lightMin: 70, chromaMax: 200});
const speakerNames = {
  'SPEAKER_00':'Chris Jackins',
  'SPEAKER_01':'Andrew Raitter',
  'SPEAKER_02':'Tyler Dupuis',
  'SPEAKER_03':'Jennifer Matter',
  'SPEAKER_04':'(child)',
  'SPEAKER_05':'Vivian Song',
  'SPEAKER_06':'Marty Binko',
  'SPEAKER_07':'Courtney Helmick',
  'SPEAKER_08':'Meesh Vecchio',
  'SPEAKER_09':'Marissa Milma',
  'SPEAKER_10':'Tina Meade',
  'SPEAKER_11':'Ashley Allison',
  'SPEAKER_12':'Robert Cruickshank',
  'SPEAKER_13':'Erin Schurer',
  'SPEAKER_15':'Lisa Rivera Smith',
  'SPEAKER_16':'Liza Rankin',
  'SPEAKER_17':'Crystal Hawkins',
  'SPEAKER_19':'Ellie Wilson-Jones',
  'SPEAKER_20':'Jennifer Goff',
  'SPEAKER_21':'Jessica Jones',
  'SPEAKER_22':'Chandra Hampson',
  'SPEAKER_23':'Brent Jones',
  'SPEAKER_24':'Shannon Crowley',
  'SPEAKER_25':'Leslie Harris',
  'SPEAKER_26':'Michelle Sarju',
  'SPEAKER_27':'Jessica Holman',
  'SPEAKER_28':'Beth Steinhaus',
  'SPEAKER_29':'Naomi Strand',
  'SPEAKER_33':'Mary Ellen Russel',
  'SPEAKER_34':'Luna Crone-Barón',
  'SPEAKER_35':'Vivian Van Gelder',
  'SPEAKER_36':'Krista Brown',
  'SPEAKER_37':'Thomas K Poole',
  'SPEAKER_38':'Gerard (Mr. Mountain)',
  'SPEAKER_39':'Brandon Hersey',
  'SPEAKER_40':'Wilina Wheeler',
  'SPEAKER_42':'Karen Hartman',
};

function getSpeakerAttributes(speaker) {
  let name = speakerNames[speaker];
  const color = palette[speaker.split('_')[1]];
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
      if (curSpeaker !== segment['speaker'] && curWordAnchors.length > 0) {
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
          <YouTube style={ytplayerStyle} videoId="ZA2VWHITcV0" opts={youtubeOpts} onReady={this.onReady} />
        </div>
        { dialogDivs }
      </main>
    );
  }
}

export default BoardMeeting;
