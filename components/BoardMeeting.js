import React from 'react'
import Link from 'next/link'
import YouTube from 'react-youtube'
import styles from '../styles/BoardMeeting.module.css'
import distinctColors from 'distinct-colors'

function toTimeAnchor(seconds) {
    if (seconds) {
        const hhmmss = new Date(seconds * 1000).toISOString().slice(11, 19);
        return `#${hhmmss}`;
    }
    return '';
}

const palette = distinctColors({ count: 45, lightMin: 70, chromaMax: 200 });

export class BoardMeeting extends React.Component {
    constructor({ video, transcript, speakers }) {
        super();

        this.video = video;
        this.transcript = transcript;
        this.speakers = speakers || {};

        // Binding method
        this.onReady = this.onReady.bind(this);
        this.ytComponent = null;
        this.jumpToTime = this.jumpToTime.bind(this);
        this.jumpToTimeInternal = this.jumpToTimeInternal.bind(this);
        this.getSpeakerAttributes = this.getSpeakerAttributes.bind(this);
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

    getSpeakerAttributes(speaker) {
        let name = this.speakers[speaker];
        const speakerNum = Number(speaker.split('_')[1]);
        const color = palette[speakerNum];
        if (!name) {
            name = speaker;
        }

        return { name, color };
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

        for (const [i, segment] of Object.values(this.transcript.segments).entries()) {
            // If speaker changed, push the div and reset curWordAnchors.
            if (curSpeaker && curSpeaker !== segment['speaker'] && curWordAnchors.length > 0) {
                const { name, color } = this.getSpeakerAttributes(curSpeaker);
                dialogDivs.push(
                    <div className={styles.e} style={{ backgroundColor: color }}>
                        <p style={{ margin: 0, paddingLeft: '5px', paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px', wordWrap: 'normal', whiteSpace: 'normal' }}>
                            <span style={{ color: 'black', fontWeight: 'bold' }}>{name}</span><br />
                            {curWordAnchors}
                        </p>
                    </div>);
                curWordAnchors = [];
            }
            curSpeaker = segment['speaker']

            for (const word of segment['words']) {
                curWordAnchors.push(
                    <Link name={toTimeAnchor(word['start']).substr(1)} href={toTimeAnchor(word['start'])} id={word['start']} style={ltStyle} onClick={this.jumpToTime}> {word['word']}</Link>
                );
            }
        }

        return (
            <main style={mainStyle}>
                <div className="p-2 bg-slate-50 my-2 border-dashed border-2 border-black">
                  <h2>{ this.video.metadata.title }</h2>
                  <p><i>Click on a part of the transcription, to jump to its portion of audio, and get an anchor to it in the address bar
                      bar<br /><br /></i></p>
                  <p>Code adapted from <Link href="https://colab.research.google.com/github/Majdoddin/nlp/blob/main/Pyannote_plays_and_Whisper_rhymes_v_2_0.ipynb">Majdoddin's collab example</Link></p>
                </div>
                <div id="player-div" style={{ position: 'sticky', top: '20px', float: 'right', width: '45%' }}>
                    <YouTube style={ytplayerStyle} videoId={ this.video.metadata.video_id } opts={youtubeOpts} onReady={this.onReady} />
                </div>
                {dialogDivs}
            </main>
        );
    }
}
