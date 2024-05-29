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
  reactStrictMode: true
}

const nextConfig = withMDX(baseNextConfig);

export default nextConfig;
