/*
 * @Author: Allen Bei
 * @Date: 2025-03-07 07:28:46
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-06-25 11:48:55
 * @FilePath: /AnotherMe_AI_Web/lib/utils.ts
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns-tz';

// 配置基础跳转URL
export const getSiteURL = () => {
  // 优先使用环境变量，Vercel会自动设置NEXT_PUBLIC_VERCEL_URL
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    'http://localhost:3000';
  return siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 生成新的euuid
export const generateNewEntryEuuid = () => {
  const today = new Date()
  const dateStr = today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0')

  // 生成8位随机字符串（字母和数字）
  const randomChars = Array.from({ length: 8 }, () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    return chars.charAt(Math.floor(Math.random() * chars.length))
  }).join('')

  return dateStr + randomChars
}

// 获取当前日期的 ISO 字符串 (带时区信息)
export const getTodayISO = (): string => {
  return new Date().toISOString();
};

// 获取指定日期的 YYYY-MM-DD 格式
export const formatDateYMD = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

// 获取指定日期的 YYYY-MM-DD HH:MM 格式 (考虑时区)
export const formatDateYMDHM = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 获取日期范围的 ISO 时间戳 (用于数据库查询)
export const getDateRangeISO = (dateStr: string) => {
  const date = new Date(dateStr);

  // 创建起始日期 (当天 00:00:00)
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  // 创建结束日期 (当天 23:59:59)
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  };
};

// 将日期格式化为 PostgreSQL date 格式 (YYYY-MM-DD）
export const formatToDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;

  // 使用 toLocaleDateString() 获取本地日期，确保时区正确
  const localDateString = d.toLocaleDateString('en-CA'); // 'en-CA' 格式化为 YYYY-MM-DD

  return localDateString;
};

// 生成新的日记ID
// const generateNewEntryId = () => {
//   const today = new Date()
//   return today.toISOString().split('T')[0]
// }

// 将 ISO 时间格式转换为带有当地时区的 timestamptz 格式
export const formatToTimestampTZ = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString(); // ISO 格式已包含时区信息
};

// 获取本地时区
const getLocalTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

// 获取当前日期（带时区）
export const getTodayDate = (): string => {
  const today = new Date();
  const timeZone = getLocalTimeZone();
  return format(today, 'yyyy-MM-dd', { timeZone });
};

// 将富文本 HTML 转换为纯文本
export const htmlToPlainText = (html: string): string => {
  if (!html) return '';

  // 创建一个临时的 div 元素来解析 HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // 替换所有的 <br> 和块级元素为换行符
  const content = tempDiv.innerHTML
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>|<\/p>|<\/h[1-6]>/gi, '\n');

  // 获取文本内容
  tempDiv.innerHTML = content;
  let text = tempDiv.textContent || tempDiv.innerText || '';

  // 替换连续的换行为三个空格
  text = text.replace(/\n+/g, '   ');

  // 去除多余的空格
  text = text.replace(/\s+/g, ' ').trim();

  return text;
};

// 这是一个服务器端安全的版本，如果在服务器端使用
export const htmlToPlainTextServer = (html: string): string => {
  if (!html) return '';

  // 移除所有 HTML 标签
  const withoutTags = html.replace(/<[^>]*>/g, '');

  // 解码 HTML 实体
  const decoded = withoutTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // 替换连续的换行为三个空格
  const formatted = decoded.replace(/\n+/g, '   ');

  // 去除多余的空格
  return formatted.replace(/\s+/g, ' ').trim();
};

// 过滤AI生成的内容，获取用户原始内容
export const filterUserContent = (htmlContent: string): string => {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlContent

  // 移除所有AI生成的模板元素
  const questionTemplates = tempDiv.querySelectorAll('.question-template')
  questionTemplates.forEach(template => template.remove())

  const generateTemplates = tempDiv.querySelectorAll('.generate-template')
  generateTemplates.forEach(template => template.remove())

  return tempDiv.innerHTML
}

