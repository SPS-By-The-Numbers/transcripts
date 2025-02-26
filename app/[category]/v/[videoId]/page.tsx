import IndexWithLang from './[lang]/page';

import type { VideoParams } from './[lang]/page';

export { generateMetadata, dynamic, revalidate } from './[lang]/page';

export default async function NoLangVideo(props: {params: Promise<VideoParams>}) {
  const params = await props.params;
  return IndexWithLang({params: Promise.resolve({...params, lang: 'eng'})});
}
