
function doRedirect() {
  window.location.replace('/transcripts/sps-board/2023-10-17/board-special-meeting'+ window.location.hash);
}

export default function Redirect({ params }) {
  return (<>
    <center>
    <button onClick={doRedirect} style={{backgroundColor: 'red', padding: '3em', margin: "3em 3em 3em 3em", borderRadius: "15px", boxShadow: "3px 8px"}}>
      <b>Transcription moved. Click here to go to new place.</b>
    </button>
    </center>
  </>);
}
