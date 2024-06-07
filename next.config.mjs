/** @type {import('next').NextConfig} */
import nextMdx from '@next/mdx';

const withMDX = nextMdx({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
    // If you use `MDXProvider`, uncomment the following line.
    // providerImportSource: "@mdx-js/react",
  },
})

const baseNextConfig = {
  // Append the default value with md extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  reactStrictMode: true,
  async redirects() {
    const categories = ['sps-board', 'seattle-city-council'];

    return [
      ...categories.map(category => ({
        source: `/${category}`,
        destination: `/?category=${category}`,
        permanent: true,
      })),
      ...categories.map(category => ({
        source: `/${category}/:date(\\d{4}-\\d{2}-\\d{2})`,
        destination: `/?category=${category}&start=:date&end=:date`,
        permanent: true,
      })),
    ]
  }
}

const nextConfig = withMDX(baseNextConfig);

export default nextConfig;
