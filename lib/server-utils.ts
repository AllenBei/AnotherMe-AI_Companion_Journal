/*
 * @Author: Allen Bei
 * @Date: 2025-04-11 16:47:00
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-04-11 16:49:26
 * @FilePath: /AnotherMe_AI_Web/lib/server-utils.ts
 * @Description: Server-side utility functions
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */

/**
 * 将富文本 HTML 转换为纯文本 (服务端版本)
 * 使用正则表达式替代 DOM 操作，适用于服务端环境
 */
export const htmlToPlainTextServer = (html: string): string => {
  if (!html) return '';
  
  // 移除所有 HTML 标签，但保留其内容
  let text = html
    // 替换常见的换行元素为换行符
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>|<\/p>|<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    // 移除所有剩余的 HTML 标签
    .replace(/<[^>]*>/g, '')
    // 处理 HTML 实体
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    // 清理多余空行
    .replace(/\n{3,}/g, '\n\n');
  
  // 去除前后空白
  return text.trim();
};
