"use client"

import React from 'react'
import Link from 'next/link'
import { useI18n } from '@/app/i18n'
import Layout from '@/app/components/Layout'
import { ChevronLeft, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AnalysisPage() {
  const { t } = useI18n()

  return (
    <Layout>
      <div className="container mx-auto py-4 max-w-3xl px-4">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link 
            href="/" 
            className="flex items-center text-secondary hover:text-secondary/80 transition-colors mr-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span className="text-sm">{t('analysis.backToHome')}</span>
          </Link>
        </div>

        {/* Page Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mr-3">
              <BarChart3 className="w-6 h-6 text-secondary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('analysis.title')}</h1>
          </div>
          <p className="text-gray-600 text-base">{t('analysis.subtitle')}</p>
        </div>

        {/* Coming Soon Card */}
        <Card className="shadow-sm border-secondary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-lg text-secondary">
              {t('analysis.comingSoon')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🚧</div>
            <p className="text-gray-500 mb-6">
              我们正在努力开发这个功能，它将帮助你更好地了解自己的情绪变化模式和成长轨迹。
            </p>
            <Button asChild className="bg-secondary hover:bg-secondary/90">
              <Link href="/">
                {t('analysis.backToHome')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
} 