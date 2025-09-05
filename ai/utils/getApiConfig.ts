/*
 * @Author: Allen Bei
 * @Date: 2025-04-11
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-06-22 22:55:43
 * @FilePath: /AnotherMe_AI_Web/ai/utils/getApiConfig.ts
 * @Description: Multi-provider API configuration
 */

// /ai/utils/getApiConfig.ts
export type Provider = 'openai' | 'deepseek' | 'deepseek_r1' 

export const apiProviders = {
  openai: {
    name: 'OpenAI',
    apiBaseUrl: process.env.OPENAI_API_BASE_URL || '',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || '',
  },
  deepseek: {
    name: 'DeepSeek',
    apiBaseUrl: process.env.DEEPSEEK_API_BASE_URL || '',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: process.env.DEEPSEEK_MODEL_NAME || '',
  },
  deepseek_r1: {
    name: 'DeepSeekR1',
    apiBaseUrl: process.env.DEEPSEEK_API_BASE_URL || '',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: process.env.DEEPSEEK_MODEL_NAME_R1 || '',
  },
} as const

export function getApiConfig(provider: Provider) {
  const config = apiProviders[provider] || apiProviders['openai']
  
  let apiUrl = config.apiBaseUrl
  if (apiUrl.endsWith('/')) {
    apiUrl = apiUrl.slice(0, -1)
  }
  apiUrl += '/v1/chat/completions'

  // console.log('apiUrl', apiUrl)
  // Avoid logging provider config as it may contain secrets
  return {
    apiUrl,
    apiKey: config.apiKey,
    model: config.model,
  }
}
