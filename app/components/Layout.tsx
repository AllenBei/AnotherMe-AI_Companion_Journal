/*
 * @Author: Allen Bei
 * @Date: 2025-03-07 16:32:02
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-09-02 14:39:47
 * @FilePath: /AnotherMe-AI_Companion_Journal/app/components/Layout.tsx
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
import { Home, BookOpen, BarChart, BookHeart } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useI18n, getInitialLanguage } from '@/app/i18n'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useUser } from '@/components/UserProvider'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t, language, setLanguage } = useI18n()
  const { refreshUser, userProfile } = useUser()

  // 水合后语言初始化 - 只在没有用户信息时使用，避免干扰数据库偏好
  useEffect(() => {
    const initialLanguage = getInitialLanguage()
    if (initialLanguage !== language) {
      // 🔧 只在没有用户资料或用户资料没有语言偏好时才使用本地检测

      if (!userProfile || !userProfile.language_preference) {
        setLanguage(initialLanguage, null)
      } else {
        
      }
    }
  }, [language, setLanguage, userProfile])

  useEffect(() => {
    // 监听 Supabase 认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // 只在关键事件发生时才重新获取用户信息
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        refreshUser()
      } else if (event === 'SIGNED_OUT') {
        // 如果用户在受保护的页面，重定向到产品页面
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile')) {
          router.push('/')
        }
      }
      // 忽略其他事件，如TOKEN_REFRESHED，减少API调用
    })
    
    // 清理函数
    return () => {
      subscription.unsubscribe()
    }
  }, [pathname, router, refreshUser])

  return (
    <div className="flex flex-col min-h-screen">
      {/* PC Navigation (Left Side) */}
      <nav className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-16 py-8 bg-[#F6F5F1] shadow-md">
        <div className="mb-6 flex justify-center">
          <div className="w-10 h-10 rounded-full bg-[#FFF] flex items-center justify-center">
            <BookHeart className="text-secondary w-5 h-5" />
          </div>
        </div>
        <div className="flex flex-col items-center space-y-6 flex-grow">
          <Link 
            href="/" 
            className={`p-3 rounded-lg ${pathname === '/' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'} transition-colors`}
          >
            <Home className="w-6 h-6" />
          </Link>
          <Link 
            href="/entries" 
            className={`p-3 rounded-lg ${pathname.startsWith('/entries') ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'} transition-colors`}
          >
            <BookOpen className="w-6 h-6" />
          </Link>
          <Link 
            href="/insights" 
            className={`p-3 rounded-lg ${pathname === '/insights' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'} transition-colors`}
          >
            <BarChart className="w-6 h-6" />
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-16 flex-1 pb-2 lg:pb-0">
        {children}
      </main>

      {/* Mobile Navigation (Bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] lg:hidden z-40">
        <div className="flex justify-around items-center py-3 px-2">
          <Link href="/" className={`flex flex-col items-center ${pathname === '/' ? 'text-primary' : 'text-gray-400'}`}>
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1">{t('nav.home')}</span>
          </Link>
          <Link href="/entries" className={`flex flex-col items-center ${pathname.startsWith('/entries') ? 'text-primary' : 'text-gray-400'}`}>
            <BookOpen className="w-5 h-5" />
            <span className="text-xs mt-1">{t('nav.journey')}</span>
          </Link>
          <Link href="/insights" className={`flex flex-col items-center ${pathname === '/insights' ? 'text-primary' : 'text-gray-400'}`}>
            <BarChart className="w-5 h-5" />
            <span className="text-xs mt-1">{t('nav.insights')}</span>
          </Link>
        </div>
      </nav>

      {/* Black Line at Bottom (iPhone Style) */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-black mx-auto w-1/3 rounded-full mb-1 lg:hidden z-40"></div>
    </div>
  )
} 