#!/usr/bin/python

from datetime import timedelta
from pyannote.audio import Pipeline
from pydub import AudioSegment
#import whisper

import json
import os
import re
import torch

tempaudio_format = 'wav'
#data_dir = 'board-meetings/ZA2VWHITcV0/'
data_dir = 'scratch'
#input_file = os.path.join(data_dir, 'Seattle Schools Board Meeting Oct  11 2023.mp4')
prepped_audio_file = os.path.join(data_dir, 'input_prep.%s' % tempaudio_format)
#input_file = os.path.join(data_dir, 'Seattle Schools Board Meeting Oct  11 2023.mp4')
input_file = 'test.wav'
diarization_file = os.path.join(data_dir, 'diarization.txt')
diarization_rttm_file = os.path.join(data_dir, 'diarization.rttm')
txt_output = os.path.join(data_dir, 'capspeaker.txt')
html_output = os.path.join(data_dir, 'capspeaker.html')

# Munge audio to prepend 2000ms of noise since that sometimes gets skipped during diarization.
def prep_audio():
    spacermilli = 2000
    spacer = AudioSegment.silent(duration=spacermilli)
    audio = AudioSegment.from_file(input_file)
    audio = spacer.append(audio, crossfade=0)
    audio.export(prepped_audio_file, format=tempaudio_format)

# Setup torch to use the gpu.
def diarize(torch_device):
    print("Loading model")
    # Setup the diarization pipeline.
    pretrained_pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization-3.0", use_auth_token="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")
    pretrained_pipeline.to(torch_device)

    # Do the diarization and save it somewhere durable.
    print("Diarizing")
    diarization = pretrained_pipeline(prepped_audio_file)
    diarization.write_rttm(diarization_rttm_file)
    with open(diarization_file, "w") as text_file:
        text_file.write(str(diarization))

# Parse a hh:mm:ss.nnn string into milliseconds.
def millisec(timeStr):
    spl = timeStr.split(":")
    ms = int((int(spl[0]) * 60 * 60 + int(spl[1]) * 60 + float(spl[2]) )* 1000)
    return ms

# Group the diarization segments according to the speaker.
def lines_by_speaker():
  dzs = open(diarization_file).read().splitlines()

  groups = []
  g = []
  lastend = 0

  for d in dzs:
    if g and (g[0].split()[-1] != d.split()[-1]):      #same speaker
      groups.append(g)
      g = []

    g.append(d)

    end = re.findall('[0-9]+:[0-9]+:[0-9]+\.[0-9]+', string=d)[1]
    end = millisec(end)
    if (lastend > end):       #segment engulfed by a previous segment
      groups.append(g)
      g = []
    else:
      lastend = end
  if g:
    groups.append(g)

  return groups

# Break audio by diarized chunks
def split_audio_by_diarization(groups):
    audio = AudioSegment.from_file(prepped_audio_file)
    gidx = -1
    for g in groups:
        start = re.findall('[0-9]+:[0-9]+:[0-9]+\.[0-9]+', string=g[0])[0]
        end = re.findall('[0-9]+:[0-9]+:[0-9]+\.[0-9]+', string=g[-1])[1]
        start = millisec(start) #- spacermilli
        end = millisec(end)  #- spacermilli
        gidx += 1
        audio[start:end].export('%d.%s' % (gidx, tempaudio_format), format=tempaudio_format)
        #print(f"group {gidx}: {start}--{end}")

# Transcribe with whisper
def transcribe_groups(groups, torch_device):
    model = whisper.load_model('large-v2', device = torch_device)
    for i in range(len(groups)):
          audiof = '%d.%s' % (i, tempaudio_format)
          # TODO: Prompt with result of prior transcription.
          result = model.transcribe(audio=audiof, language='en', word_timestamps=True)#, initial_prompt=result.get('text', ""))
          with open('%d.json' % i, "w") as outfile:
              json.dump(result, outfile, indent=4)


def create_captions():
    def_boxclr = 'white'
    def_spkrclr = 'orange'
    speakers = {'SPEAKER_00':('Kurt Buttleman', 'lightgreen', 'black'),
		'SPEAKER_01':('Bev Redmond', 'orange', 'black'),
		'SPEAKER_02':('Brent Jones', 'grey', 'black'),
		'SPEAKER_03':('Fred Podesta', 'yellow', 'black'),
		'SPEAKER_04':('Vivian Song', 'lightbrown', 'black'),
		'SPEAKER_05':('Liza Rankin', 'lightblue', 'black'),
		'SPEAKER_06':('Chandra Hampson', 'pink', 'black'),
		'SPEAKER_07':('Lisa Rivera Smith', 'lavender', 'black'),
		}


    def timeStr(t):
        return '{0:02d}:{1:02d}:{2:06.2f}'.format(
		round(t // 3600),
		round(t % 3600 // 60),
		t % 60)

    html = list(preS)
    txt = list("")
    gidx = -1
    for g in groups:
        shift = re.findall('[0-9]+:[0-9]+:[0-9]+\.[0-9]+', string=g[0])[0]
        shift = millisec(shift) - spacermilli #the start time in the original video
        shift=max(shift, 0)

        gidx += 1

        captions = json.load(open('%d.json' % gidx))['segments']

        if captions:
            speaker = g[0].split()[-1]
            boxclr = def_boxclr
            spkrclr = def_spkrclr
            if speaker in speakers:
                speaker, boxclr, spkrclr = speakers[speaker]

            html.append(f'<div class="e" style="background-color: {boxclr}">\n');
            html.append('<p  style="margin:0;padding: 5px 10px 10px 10px;word-wrap:normal;white-space:normal;">\n')
            html.append(f'<span style="color:{spkrclr};font-weight: bold;">{speaker}</span><br>\n\t\t\t\t')

            for c in captions:
                start = shift + c['start'] * 1000.0
                start = start / 1000.0   #time resolution ot youtube is Second.
                end = (shift + c['end'] * 1000.0) / 1000.0
                txt.append(f'[{timeStr(start)} --> {timeStr(end)}] [{speaker}] {c["text"]}\n')

            for i, w in enumerate(c['words']):
                  if w == "":
                      continue
                  start = (shift + w['start']*1000.0) / 1000.0
                  #end = (shift + w['end']) / 1000.0   #time resolution ot youtube is Second.
                  html.append(f'<a href="#{timeStr(start)}" id="{"{:.1f}".format(round(start*5)/5)}" class="lt" onclick="jumptoTime({int(start)}, this.id)">{w["word"]}</a><!--\n\t\t\t\t-->')
            html.append('</p>\n')
            html.append(f'</div>\n')

    html.append(postS)


    with open(txt_output, "w", encoding='utf-8') as file:
        s = "".join(txt)
        file.write(s)

    with open(html_output, encoding='utf-8') as file:    #TODO: proper html embed tag when video/audio from file
        s = "".join(html)
        file.write(s)

if __name__ == '__main__':
    #prep_audio()
    torch_device = torch.device("cuda:0")
    diarize(torch_device)
#    groups = lines_by_speaker()
#    split_audio_by_diarization(groups)
#    transcribe_groups(groups, torch_device)
