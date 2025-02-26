/** @type {import('next').NextConfig} */

const baseNextConfig = {
  // Append the default value with md extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  reactStrictMode: true,
  sassOptions: {
    api: 'modern-compiler',
  },
  async redirects() {
    return [
      {
        source: '/:category/',
        destination: '/:category/v',
        permanent: false,
      }
    ]
  }
}

export default baseNextConfig;
