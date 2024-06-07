/** @type {import('next').NextConfig} */
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
    // If you use `MDXProvider`, uncomment the following line.
    // providerImportSource: "@mdx-js/react",
  },
})

const nextConfig = {
  // Append the default value with md extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/:category',
        destination: '/?category=:category',
        permanent: true,
      },
      {
        source: '/:category/:date(\\d{4}-\\d{2}-\\d{2})',
        destination: '/?category=:category&start=:date&end=:date',
        permanent: true,
      },
    ]
  }
}

module.exports = withMDX(nextConfig)
