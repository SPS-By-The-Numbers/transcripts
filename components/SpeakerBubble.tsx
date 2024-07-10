import SpeakerBubbleTitle from 'components/SpeakerBubbleTitle';
import { toSpeakerColorClass } from 'utilities/client/css';

type SpeakerBubbleParams = {
  speakerNum : number;
  children: React.ReactNode[];
};

export default function SpeakerBubble({speakerNum, children} : SpeakerBubbleParams) {
  return (
    <article className={`b ${toSpeakerColorClass(speakerNum)}`}>
      <SpeakerBubbleTitle speakerNum={speakerNum} />
      { children }
    </article>
  );
}
