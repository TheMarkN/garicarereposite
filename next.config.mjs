/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // The public website (public/site.html) is the home page. Staff use /login and /dashboard.
  async rewrites() { return { beforeFiles: [{ source: "/", destination: "/site.html" }] }; },
};
