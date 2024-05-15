import CategoryIndex from './CategoryIndex'
import { getAllCategories } from '../utilities/metadata-utils';
import TranscriptsSearch from './TranscriptsSearch';

export default async function Index() {
  return <TranscriptsSearch
   category='sps-board'
   start={new Date(2024, 3, 1)}
   end={null}></TranscriptsSearch>
}
