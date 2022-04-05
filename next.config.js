const withPreact = require('next-plugin-preact');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPreact(nextConfig);
