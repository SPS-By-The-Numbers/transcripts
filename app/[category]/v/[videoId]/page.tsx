import IndexWithLang from './[lang]/page';

import type { VideoParams } from './[lang]/page';

export { /* @next-codemod-error `generateMetadata` export is re-exported. Check if this component uses `params` or `searchParams`*/
generateMetadata, dynamic, revalidate } from './[lang]/page';

export default async function Index(props: {params: Promise<VideoParams>}) {
  const params = await props.params;
  return IndexWithLang({params: {...params, lang: 'eng'}});
}
