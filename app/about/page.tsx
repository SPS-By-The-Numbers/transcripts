import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function About() {
  return (
    <main>
      <Paper sx={{maxWidth: "80ch", mx: "auto", my:"1rem", px:"1rem", py:"0.5rem"}} >

          <Typography gutterBottom variant="h4" component="h1">
            About Transcriptions
          </Typography>

        <Stack spacing={2}>
          <div>
            {"The Transcriptions functionality is an offshoot of "}
            <a href="https://sps-by-the-numbers.com">
              SPS By The Numbers
            </a>, a data oriented site about Seattle Public Schools. The
            site was created because there was a huge information disparity
            (and therefore power disparity in advocacy) between those who had
            time and energy to watch board meetings and those who did not.
          </div>

          <div>
            The first version was a simple adaptation by Albert J Wong of the {" "}
            <a href="https://colab.research.google.com/github/Majdoddin/nlp/blob/main/Pyannote_plays_and_Whisper_rhymes_v_2_0.ipynb">
              Majdoddin&amp;s collab example
            </a>
            {" "}for using{" "}<a href="https://github.com/openai/whisper">Whipser</a> and <a href="https://github.com/pyannote">Pyannote</a>
            {" "} <a href="https://huggingface.co/pyannote/speaker-diarization-3.1">speaker diarization</a> to transcribe
            Youtube videos into a diarized, clickable, HTML transcript that would jump the video to the
            word clicked.
          </div>
          <div>
            Then with the help of Mark Verrey, this was extended to include:
            <ul>
              <li>timestamped URLs that can be used as citations</li>
              <li>names and tags for speakers</li>
              <li>translations for the transcripts using Google Translate</li>
              <li><a href="https://www.meilisearch.com/">Meilisearch</a> integration for full text search.</li>
              <li>responsive layout with{" "}<a href="https://mui.com/">MUI Material UI</a></li>
            </ul>
          </div>

          <div>
            Special shout out to Joseph Fromel who cleaned up the basic docker setups and prototyped the
            cloud function based vast.ai instance management which allowed for transcriptions to
            happen automatically each night.
          </div>

          <div>
            The functionality is general enough that it can be applied to any
            meetings that are published on Youtube.  The backend code has been
            specifically engineered to be highly cacheable and low cost.  The
            frontend fits comfortable in the free tier of Firebase serving. The
            automated transcription pipeline use Google Cloud Scheduling to trigger
            works and then Vast.ai for cheap machines that have lots of cores
            (the bottleneck is diarization which is limited by number fo CPU
            cores) and GPU memory (the whisper v3 transcription model is large).
            For the Seattle City Council and Seattle Public Schools Board
            meetings, this comes out to ~$50 a year of spending for the past couple
            of years (with the exception of getting crawled by Meta or Google)
          </div>

          <div>
            The code is <a href="https://github.com/SPS-By-The-Numbers/transcripts">on github</a>.
            It should be possible to download, modify the values on config/constants.ts
            to fit your site, and then create a Firebase Host App using the code
            so that you can have translated public meetings for your municipality.
          </div>

          <div>
            For questions, email <a href="mailto:sps.by.the.numbers@gmail.com">sps.by.the.numbers@gmail.com</a>.
          </div>
        </Stack>
      </Paper>
    </main>
  );
}
