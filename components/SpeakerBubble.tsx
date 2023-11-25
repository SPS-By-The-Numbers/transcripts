import SpeakerBubbleTitle from 'components/SpeakerBubbleTitle'
import { toColorClass } from 'utilities/speaker-info'

type SpeakerBubbleParams = {
  speakerNum : number;
  children: React.ReactNode[];
};

export default async function SpeakerBubble({speakerNum, children} : SpeakerBubbleParams) {
  return (
    <section className={`b ${toColorClass(speakerNum)}`}>
      <SpeakerBubbleTitle speakerNum={speakerNum} />
      { children }
    </section>
  );
}
