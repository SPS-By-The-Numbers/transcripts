import { getAllCategories } from 'utilities/metadata-utils';
import Transcripts from './Transcripts';

export default async function Index() {
  const allCategories: string[] = await getAllCategories();
  return (
    <main className="mx-5 my-5 max-w-screen-md">
      <Transcripts allCategories={allCategories} />
    </main>
  );
}
