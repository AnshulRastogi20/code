import { withHydrationOverlay } from "@builder.io/react-hydration-overlay/next";

import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  
};

module.exports = withHydrationOverlay({
  appRootSelector: "main",
})(nextConfig);
export default nextConfig;
