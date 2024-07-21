import Paper from '@mui/material/Paper';
import SpeakerBubbleTitle from 'components/SpeakerBubbleTitle';
import { toSpeakerColorClass } from 'utilities/client/css';
import styles from '../styles/SpeakerBubble.module.scss';

type SpeakerBubbleParams = {
  speakerNum : number;
  children: React.ReactNode[];
};

export default function SpeakerBubble({speakerNum, children} : SpeakerBubbleParams) {
  return (
    <Paper component="article" className={`b ${toSpeakerColorClass(speakerNum)}`}>
      <SpeakerBubbleTitle speakerNum={speakerNum} />
      { children }
    </Paper>
  );
}
