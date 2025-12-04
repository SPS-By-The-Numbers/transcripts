import IndexWithLang from './[lang]/page';

import type { VideoParams } from './[lang]/page';

export { generateMetadata } from './[lang]/page';

export const dynamic = 'force-static';
export const revalidate = 3600;

export default async function NoLangVideo(props: {params: Promise<VideoParams>}) {
  const params = await props.params;
  return IndexWithLang({params: Promise.resolve({...params, lang: 'eng'})});
}
