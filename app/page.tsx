import * as Constants from 'config/constants';
import TranscriptIndex from './TranscriptIndex';
import { getLastDateForCategory } from 'utilities/metadata-utils';
import { startOfMonth, subMonths } from 'date-fns';

import type { DefaultFiltersByCategory } from './TranscriptIndex';

const defaultCategory = 'sps-board';

export default async function Index() {
  const defaultsByCategory: DefaultFiltersByCategory = {};

  for (const category of Constants.ALL_CATEGORIES) {
    const lastDate: Date | null = await getLastDateForCategory(defaultCategory);
    const start: Date | null = lastDate !== null ? startOfMonth(subMonths(lastDate, 1)) : null

    defaultsByCategory[category] = { defaultStart: start };
  }

  return (
    <main className="mx-5 my-5 max-w-screen-md">
      <TranscriptIndex defaultCategory={defaultCategory} defaultsByCategory={defaultsByCategory} />
    </main>
  );
}
