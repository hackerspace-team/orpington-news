/** @type {import('next').NextConfig} */

const withPlugins = require('next-compose-plugins');

const bundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const PWA = require('next-pwa');
const runtimeCaching = require('next-pwa/cache');

module.exports = withPlugins(
  [
    [bundleAnalyzer],
    [
      PWA,
      {
        pwa: {
          dest: 'public',
          runtimeCaching,
          disable: process.env.NODE_ENV !== 'production',
        },
      },
    ],
  ],
  {
    reactStrictMode: true,
    pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js'],
    publicRuntimeConfig: {
      APP_URL: process.env.APP_URL,
      API_URL: process.env.API_URL,
      API_SSR_URL: process.env.API_SSR_URL,
      APP_DEMO: process.env.APP_DEMO,
    },
    swcMinify: true,
    compiler: {
      removeConsole:
        process.env.NODE_ENV === 'production'
          ? { exclude: ['error', 'warn'] }
          : false,
    },
  }
);
