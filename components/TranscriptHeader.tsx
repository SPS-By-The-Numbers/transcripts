import Link from 'next/link'
import DownloadLinks from 'components/DownloadLinks'

type TranscriptHeaderParams = {
  category: string;
  title: string;
  description: string;
  videoId: string;
};

export default function TranscriptHeader({category, title, description, videoId} : TranscriptHeaderParams) {
  return(
    <header>
      <div className="p-2 bg-slate-50 my-2 border-dashed border-2 border-black">
        <nav className="flex">
          <DownloadLinks className="flex-auto text-left" category={category} videoId={videoId} />

          <div className="flex-auto text-right">
            <i>Code adapted from <Link href="https://colab.research.google.com/github/Majdoddin/nlp/blob/main/Pyannote_plays_and_Whisper_rhymes_v_2_0.ipynb">{"Majdoddin's collab example"}</Link></i>
          </div>
        </nav>
        <hr />
        <h2 className="t">{ title }</h2>
        <p>{ description }</p>
        <p><i>Click on words in the transcription to jump to its portion of the audio. The URL can be copy/pasted to get back to the exact second.</i></p>
      </div>
    </header>
  );
}
