import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Enables local `next dev` access to Cloudflare bindings when available.
void initOpenNextCloudflareForDev();
