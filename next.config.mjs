/*
 * @Author: Allen Bei
 * @Date: 2025-03-07 07:28:46
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-06-19 17:40:45
 * @FilePath: /AnotherMe_AI_Web/next.config.mjs
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  // 🔧 临时调试配置：获取详细错误信息
  productionBrowserSourceMaps: true,
  webpack: (config, { dev, isServer }) => {
    // 临时禁用生产环境压缩以获取详细错误
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: false, // 禁用压缩
      }
    }
    return config
  },
  env: {
    NEXT_PUBLIC_SHOW_REACT_ERRORS: 'true',
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
