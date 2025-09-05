/*
 * @Author: Allen Bei
 * @Date: 2025-03-07 16:34:42
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-03-28 15:22:39
 * @FilePath: /AnotherMe_AI_Web/app/components/LanguageSwitch.tsx
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
"use client"

import { useI18n } from '@/app/i18n'
import { Globe } from 'lucide-react'
import { useUser } from '@/components/UserProvider'

export function LanguageSwitch() {
  const { language, setLanguage } = useI18n()
  const { userProfile } = useUser()

  const toggleLanguage = () => {
    // 标记这是用户主动的语言切换
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('user_initiated_language_change', 'true');
    }
    
    // 设置语言会自动通过i18n/index.ts更新用户语言偏好
    setLanguage(language === 'en' ? 'zh' : 'en', userProfile)
  }

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-primary"
      title={language === 'en' ? '切换到中文' : 'Switch to English'}
    >
      <Globe className="w-5 h-5" />
    </button>
  )
} 