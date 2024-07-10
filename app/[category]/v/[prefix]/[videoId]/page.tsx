export { generateMetadata } from './[lang]/page';
import IndexWithLang from './[lang]/page';

import type { VideoParams } from './[lang]/page';

// Force video pages to be statically rendered.
export const dynamic = 'force-static';
export const revalidate = 600;

export default async function Index({params} : {params: VideoParams}) {
  return IndexWithLang({params: {...params, lang: 'eng'}});
}
