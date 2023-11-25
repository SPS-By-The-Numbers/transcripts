import SpeakerBubbleTitle from 'components/SpeakerBubbleTitle'
import { toColorClass } from 'utilities/speaker-info'

type SpeakerBubbleParams = {
  speakerNum : number;
  children: React.ReactNode[];
};

export default function SpeakerBubble({speakerNum, children} : SpeakerBubbleParams) {
  return (
    <article className={`b ${toColorClass(speakerNum)}`}>
      <SpeakerBubbleTitle speakerNum={speakerNum} />
      { children }
    </article>
  );
}
