"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ChevronLeft } from "lucide-react"
import Layout from '@/app/components/Layout'
import { useEntryStore } from "@/app/store/entryStore"
import { EntryItem } from "@/app/components/EntryItem"
import type { DayEntry, EntryContent, DiaryInsight } from "@/types/entries"
import { AnalysisDataCard } from "@/app/components/AnalysisDataCard"
import { useI18n } from '@/app/i18n'
import { PageLoading } from '@/app/components/LoadingDots'


export default function EntryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { t, language } = useI18n()
  
  // 从store获取数据
  const currentEntry = useEntryStore(state => state.currentEntry)
  const [dayEntry, setDayEntry] = useState<DayEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [diaryInsights, setDiaryInsights] = useState<DiaryInsight[]>([])

  // 提取diary insights的函数
  const extractDiaryInsights = (entry: DayEntry | null): DiaryInsight[] => {
    if (!entry || !entry.entry_contents) return [];
    
    const insights: DiaryInsight[] = [];
    
    entry.entry_contents.forEach(content => {
      if (content.insight_path) {
        // 构建一个DiaryInsight对象
        const insight: DiaryInsight = {
          icon: content.icon || '📝', // 默认图标
          title: content.title || '洞察', // 默认标题
          insight_path: content.insight_path,
          analogy: content.analogy || ''
        };
        
        insights.push(insight);
      }
    });
    
    return insights;
  };

  useEffect(() => {
    // 检查store中的数据是否匹配当前页面的id
    if (currentEntry && currentEntry.day_id === id) {
      setDayEntry(currentEntry);
      setDiaryInsights(extractDiaryInsights(currentEntry));
      setLoading(false);
      return;
    }

    // 如果store中的数据不匹配，从sessionStorage尝试获取
    if (typeof window !== 'undefined') {
      const storedEntry = sessionStorage.getItem('currentDayEntry')
      if (storedEntry) {
        try {
          const parsedEntry = JSON.parse(storedEntry)
          // 同样检查day_id是否匹配
          if (parsedEntry.day_id === id) {
            setDayEntry(parsedEntry)
            setDiaryInsights(extractDiaryInsights(parsedEntry));
            setLoading(false)
            return
          }
        } catch (error) {
          console.error('解析存储的数据失败', error)
        }
      }
    }

    // 如果没有匹配的缓存数据，从API获取
    const fetchEntry = async () => {
      try {
        setLoading(true)
        // 修正API调用方式，使用day_id参数查询
        const response = await fetch(`/api/entries?day_id=${id}`)
        const result = await response.json()
        
        if (result.success && result.data && result.data.length > 0) {
          // API返回的是数组，取第一个元素
          const entryData = result.data[0]
          setDayEntry(entryData)
          setDiaryInsights(extractDiaryInsights(entryData));
          
          // 同时更新store和sessionStorage
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('currentDayEntry', JSON.stringify(entryData))
            // 更新store
            useEntryStore.getState().setCurrentEntry(entryData)
          }
        } else {
          console.error('获取日记失败', result.error)
          router.push('/entries')
        }
      } catch (error) {
        console.error('获取日记失败', error)
        router.push('/entries')
      } finally {
        setLoading(false)
      }
    }

    // 如果有ID，尝试从API获取
    if (id) {
      fetchEntry()
    } else {
      // 没有ID，返回列表页
      router.push('/entries')
    }
  }, [id, currentEntry, router])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const locale = language === 'zh' ? 'zh-CN' : 'en-US'
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }).format(date)
  }

  // 判断是否有情绪数据
  const hasEmotionData = dayEntry?.analysis_data?.emotion_analysis && 
    Array.isArray(dayEntry.analysis_data.emotion_analysis) && 
    dayEntry.analysis_data.emotion_analysis.length > 0;

  // 获取不同类型的条目
  const getMorningEntries = (entries: EntryContent[]) => 
    entries.filter(entry => entry.type === 'morning');
  
  const getEveningEntries = (entries: EntryContent[]) => 
    entries.filter(entry => entry.type === 'evening');
  
  const getSnippetEntries = (entries: EntryContent[]) => 
    entries.filter(entry => entry.type === 'snippet');

  if (loading) {
    return (
      <Layout>
        <PageLoading />
      </Layout>
    )
  }

  const handleBack = () => {
    // 返回上一页
    router.back();
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#F6F5F1] px-4 pt-4 pb-20 md:p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center mb-8">
              <button onClick={handleBack} className="mr-4 focus:outline-none">
                <ChevronLeft className="w-6 h-6 text-[#075071]" />
              </button>
              <h1 className="text-3xl font-bold text-[#075071]">{formatDate(dayEntry?.created_date || '')}</h1>
            </div>

            {/* 分析数据卡片 - 传递diaryInsights */}
            {dayEntry?.analysis_data && (
              <div className="mb-8">
                <AnalysisDataCard 
                  analysisData={dayEntry.analysis_data} 
                  diaryInsights={diaryInsights}
                />
              </div>
            )}

            {/* 日记条目展示 - 按类型分组 */}
            {dayEntry?.entry_contents && dayEntry.entry_contents.length > 0 && (
              <div className="space-y-8">
                {/* 晨间日记 */}
                {getMorningEntries(dayEntry.entry_contents).length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-[#075071] mb-4">{t('entries.morningJournal')}</h2>
                    <div className="space-y-4">
                      {getMorningEntries(dayEntry.entry_contents).map(entry => (
                        <EntryItem 
                          key={entry.euuid} 
                          entry={entry as EntryContent}
                          type="morning"
                          showTags
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 夜间日记 */}
                {getEveningEntries(dayEntry.entry_contents).length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-[#075071] mb-4">{t('entries.eveningJournal')}</h2>
                    <div className="space-y-4">
                      {getEveningEntries(dayEntry.entry_contents).map(entry => (
                        <EntryItem 
                          key={entry.euuid} 
                          entry={entry as EntryContent}
                          type="evening"
                          showTags
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 快速笔记 */}
                {getSnippetEntries(dayEntry.entry_contents).length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-[#075071] mb-4">{t('entries.quickNotes')}</h2>
                    <div className="space-y-4">
                      {getSnippetEntries(dayEntry.entry_contents).map(entry => (
                        <EntryItem 
                          key={entry.euuid} 
                          entry={entry as EntryContent}
                          type="snippet"
                          showTags
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}

