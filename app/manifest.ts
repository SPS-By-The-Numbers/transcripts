import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SPS By The Numbers - Transcriptions',
    short_name: 'SPS By The Numbers - Transcriptions',
    description: 'Public meeting transcriptions from SPS By The Numbers',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff',
    theme_color: '#fff',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
