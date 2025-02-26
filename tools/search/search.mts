import { getIndex } from './client.mts';

const search = await getIndex('sps-board', 'eng').search(process.argv.slice(2).join(' '), {
  attributesToSearchOn: ['text'],
  attributesToHighlight: ['*'],
  attributesToRetrieve: ['videoId', 'start', 'publishDate', 'title'],
  attributesToCrop: [ 'text' ],
  cropLength: 50,
  distinct: 'id',
  limit: 1000
  })
console.log(JSON.stringify(search, null, 2))
