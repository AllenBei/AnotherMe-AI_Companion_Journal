/*
 * @Author: Allen Bei
 * @Date: 2025-06-23 14:00:00
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-07-23 14:22:57
 * @FilePath: /AnotherMe_AI_Web/lib/language-utils.ts
 * @Description: Language detection utilities for API endpoints
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
import { NextRequest } from 'next/server';

// 支持的语言类型
export type SupportedLanguage = 'zh' | 'en';

// 默认语言设置
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

/**
 * 从多个来源检测用户语言偏好的通用函数
 * 优先级：Cookie > Accept-Language Header > 默认语言
 * 
 * @param request NextRequest 对象
 * @returns 检测到的语言代码
 */
export function detectUserLanguage(request: NextRequest): SupportedLanguage {
  // 1. 优先从 cookie 中读取 preferredLanguage（由前端 localStorage 同步）
  const cookieLang = request.cookies.get('preferredLanguage')?.value;
  if (cookieLang === 'zh' || cookieLang === 'en') {

    return cookieLang;
  }
  
  // 2. 从 Accept-Language 头检测浏览器语言偏好
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    console.log(`[Language Detection] Accept-Language: ${acceptLanguage}`);
    
    // 解析 Accept-Language 头，格式如: "zh-CN,zh;q=0.9,en;q=0.8"
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [locale, qValue] = lang.trim().split(';q=');
        return {
          locale: locale.toLowerCase(),
          quality: qValue ? parseFloat(qValue) : 1.0
        };
      })
      .sort((a, b) => b.quality - a.quality); // 按质量值排序
    
    console.log(`[Language Detection] Parsed languages:`, languages);
    
    // 🔧 修复：按权重顺序检查支持的语言，找到第一个支持的就返回
    for (const { locale, quality } of languages) {
      if (locale.startsWith('en')) {
        console.log(`[Language Detection] Found English with quality ${quality}, returning 'en'`);
        return 'en';
      }
      if (locale.startsWith('zh')) {
        console.log(`[Language Detection] Found Chinese with quality ${quality}, returning 'zh'`);
        return 'zh';
      }
    }
  }
  
  // 3. 默认fallback

  return DEFAULT_LANGUAGE;
}

/**
 * 获取多语言 prompt 的辅助函数
 * 
 * @param prompts 包含不同语言版本的 prompt 对象
 * @param language 目标语言
 * @returns 对应语言的 prompt
 */
export function getLocalizedPrompt<T extends Record<SupportedLanguage, string>>(
  prompts: T, 
  language: SupportedLanguage
): string {
  return prompts[language] || prompts[DEFAULT_LANGUAGE];
}

/**
 * 验证语言代码是否受支持
 * 
 * @param lang 要验证的语言代码
 * @returns 是否为受支持的语言
 */
export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return lang === 'zh' || lang === 'en';
} 