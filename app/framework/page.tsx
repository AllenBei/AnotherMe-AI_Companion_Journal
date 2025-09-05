"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/app/i18n'
import Layout from '@/app/components/Layout'
import { ChevronLeft, Dice5, Sun, Moon } from 'lucide-react'
import { Card, CardContent, CardHeader,  } from '@/components/ui/card'

// 模板数据结构
interface JournalTemplate {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  modules: {
    id: string
    type: 'morning' | 'evening'
    title: string
    subtitle: string
    icon: React.ReactNode
    className: string
    getHref: (euuid?: string) => string
  }[]
}

export default function FrameworkPage() {
  const { t } = useI18n()
  const [todayEntries, setTodayEntries] = useState<any[]>([])

  // 获取今日数据（简化版，实际项目中可以从父组件传递或API获取）
  useEffect(() => {
    // 这里可以添加获取今日entries的逻辑
    // 暂时为空，后续可以扩展
  }, [])

  // 查找morning和evening内容
  const morningContent = todayEntries?.find(entry =>
    entry.entry_contents?.some((content: any) => content.type === 'morning')
  )?.entry_contents?.find((content: any) => content.type === 'morning')

  const eveningContent = todayEntries?.find(entry =>
    entry.entry_contents?.some((content: any) => content.type === 'evening')
  )?.entry_contents?.find((content: any) => content.type === 'evening')

  // 模板配置
  const templates: JournalTemplate[] = [
    {
      id: 'five-minute-journal',
      title: t('framework.fiveMinJournal'),
      description: t('framework.fiveMinJournalDescription'),
      icon: <Dice5 className="w-6 h-6" />,
      modules: [
        {
          id: 'morning',
          type: 'morning',
          title: t('home.morningJournal'),
          subtitle: t('home.morningSubtitle'),
          icon: <Sun className="w-4 h-4 mr-2" />,
          className: "bg-primary/10 rounded-2xl p-4 cursor-pointer shadow-sm hover:shadow-md transition-shadow",
          getHref: (euuid?: string) => 
            euuid ? `/entries/new?type=morning&euuid=${euuid}` : `/entries/new?type=morning`
        },
        {
          id: 'evening',
          type: 'evening',
          title: t('home.eveningJournal'),
          subtitle: t('home.eveningSubtitle'),
          icon: <Moon className="w-4 h-4 mr-2" />,
          className: "bg-dark/90 text-white rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow",
          getHref: (euuid?: string) => 
            euuid ? `/entries/new?type=evening&euuid=${euuid}` : `/entries/new?type=evening`
        }
      ]
    }
  ]

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
            {/* <span className="text-sm">{t('framework.backToHome')}</span> */}
          </Link>
        </div>

        {/* Templates */}
        <div className="space-y-8 rounded-2xl">
          {templates.map((template) => (
            <Card key={template.id} className="shadow-sm bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                      <div className="text-secondary">
                        {template.icon}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 flex flex-col gap-1">
                  {template.modules.map((module) => {
                    const content = module.type === 'morning' ? morningContent : eveningContent
                    return (
                      <Link
                        key={module.id}
                        href={module.getHref(content?.euuid)}
                        className={module.className}
                      >
                        <div className="flex items-center mb-1">
                          <div className={module.type === 'morning' ? 'text-primary' : 'text-white'}>
                            {module.icon}
                          </div>
                          <h3 className={`text-base font-bold ${module.type === 'evening' ? 'text-white' : 'text-gray-900'}`}>
                            {module.title}
                          </h3>
                        </div>
                        <p className={`text-xs ${module.type === 'evening' ? 'text-white/70' : 'text-gray-500'}`}>
                          {module.subtitle}
                        </p>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  )
} 