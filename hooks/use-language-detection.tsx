/*
 * @Author: Allen Bei
 * @Date: 2025-06-28 22:39:32
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-06-28 22:48:21
 * @FilePath: /AnotherMe_AI_Web/hooks/use-language-detection.tsx
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
import { useEffect } from 'react'
import { useI18n, detectLanguageFromURL, syncLanguagePreferenceToCookie, getInitialLanguage } from '@/app/i18n'

/**
 * 语言检测和初始化自定义Hook
 * 封装了语言检测的通用逻辑，供所有页面复用
 * 
 * 优先级：URL参数 > localStorage > 默认语言
 */
export const useLanguageDetection = () => {
  const { setLanguage, language } = useI18n()

  useEffect(() => {
    // 同步localStorage到cookie，确保中间件可以访问语言偏好
    syncLanguagePreferenceToCookie()
    
    // 1. 优先检测URL参数中的语言设置
    const urlLang = detectLanguageFromURL()
    if (urlLang) {
      // 🔧 确保URL参数检测到的语言总是被存储到localStorage
      if (typeof window !== 'undefined' && urlLang) {
        localStorage.setItem('preferredLanguage', urlLang);
        document.cookie = `preferredLanguage=${urlLang}; path=/; max-age=${60 * 60 * 24 * 365}`;
      }
      setLanguage(urlLang, null)
      return
    }
    
    // 2. 如果没有URL参数，检测localStorage中的语言偏好
    const storedLang = getInitialLanguage()
    if (storedLang && storedLang !== language) {

      setLanguage(storedLang, null)
    }
  }, [setLanguage, language])
} 