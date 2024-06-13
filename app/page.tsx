import { getAllCategories, getLastDateForCategory } from 'utilities/metadata-utils';
import Transcripts from './Transcripts';
import { TranscriptFilterSelection } from 'components/TranscriptFilter';
import { startOfMonth, subMonths } from 'date-fns';

const defaultCategory = 'sps-board';

export default async function Index() {
  const allCategories: string[] = await getAllCategories();
  const lastDate: Date | null = await getLastDateForCategory(defaultCategory);
  const start: Date | null = lastDate !== null ? startOfMonth(subMonths(lastDate, 1)) : null

  const defaultFilters: TranscriptFilterSelection = {
    category: defaultCategory,
    dateRange: {
      start,
      end: null
    }
  };

  return (
    <main className="mx-5 my-5 max-w-screen-md">
      <Transcripts allCategories={allCategories} defaultFilters={defaultFilters} />
    </main>
  );
}
