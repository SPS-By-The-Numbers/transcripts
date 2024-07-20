import IndexWithLang from './[lang]/page';

import type { VideoParams } from './[lang]/page';

export { generateMetadata, dynamic, revalidate } from './[lang]/page';

export default async function Index({params} : {params: VideoParams}) {
  return IndexWithLang({params: {...params, lang: 'eng'}});
}
