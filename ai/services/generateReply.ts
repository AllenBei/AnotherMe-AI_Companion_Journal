/*
 * @Author: Allen Bei
 * @Date: 2025-04-11 14:56:01
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-06-22 22:44:25
 * @FilePath: /AnotherMe_AI_Web/ai/services/generateReply.ts
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
// /ai/services/generateReply.ts
import { getApiConfig, Provider } from '@/ai/utils/getApiConfig'
import { getStreamResponse,Message } from '@/ai/utils/getStreamResponse'


interface GenerateReplyOptions {
  provider?: Provider
  persona?: string
  action: string
  messages: Message[]
}

export async function generateReply({
  provider = 'deepseek',
  action,
  persona='',
  messages
}: GenerateReplyOptions) {
  const { apiUrl, apiKey, model } = getApiConfig(provider)
  const messagesWithHistory = [
    { role: 'system', content: persona },
    { role: 'system', content: action },
    ...messages,
  ]
  // console.log('messagesWithHistory',messagesWithHistory)
  // console.log('messages',messages)
  const stream = await getStreamResponse(apiUrl, apiKey, model, messagesWithHistory)
  return stream
}

