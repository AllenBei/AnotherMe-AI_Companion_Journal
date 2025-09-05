/*
 * @Author: Allen Bei
 * @Date: 2025-03-07 16:23:43
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-07-08 11:50:52
 * @FilePath: /AnotherMe_AI_Web/app/i18n/index.ts
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
import { UserInfo } from '@/components/UserProvider'
import { en } from './locales/en'
import { zh } from './locales/zh'
import { create, StateCreator } from 'zustand'

// 语言配置
const SUPPORTED_LANGUAGES = ['zh', 'en'] as const;
// 可调整的默认语言配置（如需更改默认语言，修改此处即可）
const CONFIGURABLE_DEFAULT_LANGUAGE = 'en' as const;

type Language = typeof SUPPORTED_LANGUAGES[number] | null;

interface I18nStore {
  language: Language
  setLanguage: (lang: Language, userProfile: UserInfo | null) => void
  t: (key: string, variables?: Record<string, any>) => string
}

// 添加检测是否在客户端的工具函数
const isClient = typeof window !== 'undefined'

// 安全获取localStorage值的函数
const getStoredLanguage = (): Language => {
  if (isClient) {
    const stored = localStorage.getItem('preferredLanguage');
    return (stored && SUPPORTED_LANGUAGES.includes(stored as any)) ? stored as Language : null;
  }
  return null
}

// 设置语言偏好到localStorage和cookie
const setLanguagePreference = (lang: Language) => {
  if (isClient && lang) {
    localStorage.setItem('preferredLanguage', lang);
    // 同时设置cookie，确保中间件可以访问
    document.cookie = `preferredLanguage=${lang}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1年过期
  }
}

// 同步localStorage到cookie的函数（用于页面初始化）
const syncLanguagePreferenceToCookie = () => {
  if (isClient) {
    const storedLang = localStorage.getItem('preferredLanguage');
    if (storedLang && SUPPORTED_LANGUAGES.includes(storedLang as any)) {
      document.cookie = `preferredLanguage=${storedLang}; path=/; max-age=${60 * 60 * 24 * 365}`;
    }
  }
}

// 默认语言，确保服务端和客户端初始渲染一致
const DEFAULT_LANGUAGE: Language = CONFIGURABLE_DEFAULT_LANGUAGE

const store: StateCreator<I18nStore> = (set, get) => ({
  // 确保服务端和客户端初始渲染一致，避免水合错误
  // 水合完成后会通过 useEffect 更新为用户偏好的语言
  language: DEFAULT_LANGUAGE,
  setLanguage: async (lang: Language, userProfile: UserInfo | null) => {
    const currentLanguage = get().language;
    const isUserInitiated = isClient && sessionStorage.getItem('user_initiated_language_change') === 'true';
    

    
    // 首次设置语言偏好的逻辑
    if (!currentLanguage && lang || userProfile?.language_preference) {
      const preferredLanguage = lang || userProfile?.language_preference as string;
      if (isClient) {
        setLanguagePreference(preferredLanguage as Language);
      }
    }
    
    // 🔧 修复：移除提前返回的逻辑，确保存储和API同步始终执行
    // 只有在语言相同且用户没有主动切换时才跳过
    if (currentLanguage === lang && !isUserInitiated) {

      return;
    }



    // 更新状态
    set({ language: lang });

    // 🔧 确保本地存储始终更新
    if (isClient && lang) {
      setLanguagePreference(lang);
    }

    // 🔧 确保API调用在用户主动切换时执行
    if (userProfile?.auid && (userProfile.language_preference !== lang || isUserInitiated)) {
      try {
        const response = await fetch('/api/user/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            language_preference: lang
          }),
        });

        if (!response.ok) {
          throw new Error('更新语言偏好失败');
        }

        // 只有在用户主动切换语言时才重载页面
        if (isClient && isUserInitiated) {
          // 延迟清除标记，确保页面重载后能看到正确的数据库偏好
          setTimeout(() => {
            sessionStorage.removeItem('user_initiated_language_change');
            window.location.reload();
          }, 800);
        } else {
          // 如果是自动同步用户偏好，不重载页面，只更新状态

        }
      } catch (error) {
        console.error('更新用户语言偏好失败:', error);
      }
    } else if (isClient && isUserInitiated) {
      // 即使没有用户资料，也要清除标记，避免无限循环
      sessionStorage.removeItem('user_initiated_language_change');
    }
  },
  t: (key: string, variables?: Record<string, any>) => {
    const { language } = get()
    const translations = language === 'en' ? en : zh

    const returnObjects = variables?.returnObjects;
    if (returnObjects) {
      delete variables.returnObjects;
    }

    // 处理英文复数形式
    if (language === 'en' && variables && variables.count !== undefined) {
      // 检查是否有对应的复数形式键
      const pluralKey = `${key}_plural`;
      const pluralText = pluralKey.split('.').reduce((obj, k) => obj?.[k], translations as any);
      
      // 如果找到复数形式，并且 count 不为 1，则使用复数形式
      if (pluralText && variables.count !== 1) {
        key = pluralKey;
      }
    }

    // Split the key by dots and access nested properties
    let text = key.split('.').reduce((obj, k) => obj?.[k], translations as any) || key
    
    if (typeof text !== 'string') {
      return text;
    }
    
    // 如果提供了变量，替换文本中的占位符 {{variableName}}
    if (variables) {
      Object.entries(variables).forEach(([varName, varValue]) => {
        text = text.replace(new RegExp(`{{${varName}}}`, 'g'), String(varValue));
      });
    }
    
    return text
  }
})

export const useI18n = create<I18nStore>(store)

// 获取初始化语言的辅助函数
export const getInitialLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    return getStoredLanguage() || DEFAULT_LANGUAGE
  }
  return DEFAULT_LANGUAGE
}

// 从URL参数检测语言的函数（供认证页面使用）
export const detectLanguageFromURL = (): Language => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    
    if (langParam && SUPPORTED_LANGUAGES.includes(langParam as any)) {

      return langParam as Language;
    }
  }
  return null;
}

// 导出同步函数供页面使用
export { syncLanguagePreferenceToCookie } 