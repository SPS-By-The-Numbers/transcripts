import { getAllCategories, getLastDateForCategory } from 'utilities/metadata-utils';
import Transcripts, { DefaultFiltersByCategory } from './Transcripts';
import { TranscriptFilterSelection } from 'components/TranscriptFilter';
import { startOfMonth, subMonths } from 'date-fns';

const defaultCategory = 'sps-board';

export default async function Index() {
  const allCategories: string[] = await getAllCategories();

  const defaultsByCategory: DefaultFiltersByCategory = {};

  for (const category of allCategories) {
    const lastDate: Date | null = await getLastDateForCategory(defaultCategory);
    const start: Date | null = lastDate !== null ? startOfMonth(subMonths(lastDate, 1)) : null

    defaultsByCategory[category] = { defaultStart: start };
  }

  return (
    <main className="mx-5 my-5 max-w-screen-md">
      <Transcripts defaultCategory={defaultCategory} defaultsByCategory={defaultsByCategory} />
    </main>
  );
}
