/*
 * @Author: Allen Bei
 * @Date: 2025-06-11 16:53:02
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-07-22 18:12:27
 * @FilePath: /AnotherMe_AI_Web/app/auth/callback/client/page.tsx
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/app/i18n'
import { CheckCircle } from 'lucide-react'

export default function ClientAuthCallbackPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // This page acts as a simple success notification.
    // The actual email verification happened on Supabase's side when the link was clicked.
    // We just inform the user and redirect them to login.

    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const timer = setTimeout(() => {
      router.push('/auth/login');
    }, 5000);

    // Cleanup timers on component unmount
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F5F1] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900">
              {t('auth.callback.successTitle')}
            </h1>
            
            <p className="text-gray-600 text-sm">
              {t('auth.callback.successMessage')}
            </p>
            
            <div className="mt-6">
              <p className="text-sm text-gray-500">
                {t('auth.callback.redirectMessage', { countdown })}
              </p>
              <Link href="/auth/login">
                <Button className="w-full h-12 mt-4 bg-[#075071] hover:bg-[#075071]/90 rounded-xl font-medium">
                  {t('auth.callback.loginButton')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 