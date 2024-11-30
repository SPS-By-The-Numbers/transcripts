/** @type {import('next').NextConfig} */

const baseNextConfig = {
  // Append the default value with md extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  reactStrictMode: true,
  sassOptions: {
    api: 'modern-compiler',
  },
  async redirects() {
    const categories = ['sps-board', 'seattle-city-council'];

    return [
      ...categories.map(category => ({
        source: `/${category}/:date(\\d{4}-\\d{2}-\\d{2})`,
        destination: `/?category=${category}&start=:date&end=:date`,
        permanent: true,
      })),
    ]
  }
}

export default baseNextConfig;
