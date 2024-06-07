import type { VideoParams } from './[lang]/page';
export { generateMetadata } from './[lang]/page';
import { default as IndexWithLang } from './[lang]/page';

export default async function Index({params} : {params: VideoParams}) {
  return IndexWithLang({params: {...params, lang: 'eng'}});
}
