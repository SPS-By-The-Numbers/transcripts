import { index } from './client.mts';

const search = await index.search(process.argv.slice(2).join(' '), {
  attributesToSearchOn: ['text'],
  attributesToHighlight: ['*'],
  attributesToRetrieve: ['videoId', 'start', 'publishDate', 'title'],
  attributesToCrop: [ 'text' ],
  cropLength: 50,
  limit: 1000
  })
console.log(JSON.stringify(search, null, 2))
