"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Sun, Moon, Zap, Code, ListChecks, Brain, Calendar, MessageSquare, ChevronUp, ChevronDown } from "lucide-react"
import type { JSX } from "react"
import { useRouter } from "next/navigation"
import type { DayEntry } from "@/types/entries"
import { EmotionDisplayCard } from "@/app/components/EmotionDisplayCard"
import { useEntryStore } from "@/app/store/entryStore"
import { useI18n } from "@/app/i18n"

interface DailyEntryCardProps {
  dayEntry: DayEntry
}

export function DailyEntryCard({ dayEntry }: DailyEntryCardProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "emotions">("emotions")
  const router = useRouter()
  const setCurrentEntry = useEntryStore(state => state.setCurrentEntry);
  const { language } = useI18n()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const locale = language === 'zh' ? 'zh-CN' : 'en-US'
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      day: "numeric",
    }).format(date)
  }

  const getIcon = (iconName: string) => {
    const icons: Record<string, JSX.Element> = {
      sun: <Sun className="w-4 h-4" />,
      moon: <Moon className="w-4 h-4" />,
      zap: <Zap className="w-4 h-4" />,
      code: <Code className="w-4 h-4" />,
      "list-checks": <ListChecks className="w-4 h-4" />,
      brain: <Brain className="w-4 h-4" />,
      calendar: <Calendar className="w-4 h-4" />,
    }
    return icons[iconName] || <Sun className="w-4 h-4" />
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // 如果点击的是按钮或按钮内的元素，不进行导航
    if ((e.target as HTMLElement).closest("button")) {
      return
    }

    // 使用store存储dayEntry数据
    setCurrentEntry(dayEntry);

    // 导航到详情页
    router.push(`/entries/detail/${dayEntry.day_id}`);
  }

  // 判断是否应该显示分析数据
  const shouldShowAnalysisData = dayEntry.analysis_data &&
    (dayEntry.analysis_data.insight_focus ||
      (dayEntry.analysis_data.encouragement_and_suggestions &&
        dayEntry.analysis_data.encouragement_and_suggestions.length > 0))

  // 检查是否有情绪数据
  const hasEmotionData = dayEntry.analysis_data?.emotion_analysis &&
    Array.isArray(dayEntry.analysis_data.emotion_analysis) &&
    dayEntry.analysis_data.emotion_analysis.length > 0

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-lg shadow-sm overflow-hidden h-auto cursor-pointer min-w-[320px] w-full"
    >
      <div className="p-4 flex flex-col h-full w-full">
        <div className="flex justify-between items-start mb-4" onClick={handleCardClick}>
          <h3 className="font-medium text-[#075071]">{formatDate(dayEntry.created_date)}</h3>
        </div>

        {
          dayEntry.analysis_data && (hasEmotionData || shouldShowAnalysisData) &&
          <>
            {/* Summary/Emotions 切换卡片 */}
            <div className="relative w-full mb-4 flex-grow">
              {/* 摘要 */}
              {activeTab === "summary" && shouldShowAnalysisData && (
                <div className="w-full rounded-lg border border-gray-200 p-4" onClick={handleCardClick}>
                  <div className="flex flex-col">
                    <div className="text-lg font-medium text-[#075071] mb-2">You said:</div>
                    <div className="text-gray-700 text-sm">
                      {shouldShowAnalysisData ? (
                        <>
                          {dayEntry.analysis_data?.insight_focus && (
                            <p className="mb-3 font-medium">{dayEntry.analysis_data.insight_focus}</p>
                          )}
                          {dayEntry.analysis_data?.encouragement_and_suggestions &&
                            dayEntry.analysis_data.encouragement_and_suggestions.length > 0 && (
                              <div className="mt-3">
                                <h4 className="text-[#075071] font-medium mb-1">Maybe you can...</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                  {dayEntry.analysis_data.encouragement_and_suggestions.map((item, index) => (
                                    <li key={index} className="text-sm">{item.content}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          {dayEntry.analysis_data?.mood_badge && (
                            <div className="mt-3 text-center">
                              <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">
                                {dayEntry.analysis_data.mood_badge.name_zh || dayEntry.analysis_data.mood_badge.name_en} 
                              </span>
                            </div>
                          )}
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              {/* 情绪 - 使用新组件 */}
              {activeTab === "emotions" && hasEmotionData && (
                <EmotionDisplayCard emotionAnalysis={dayEntry.analysis_data!.emotion_analysis!} />
              )}
            </div>

            {/* 切换按钮 - 只在两个tab都有内容时显示 */}
            {hasEmotionData && shouldShowAnalysisData && (
              <div className="flex justify-center mb-4">
                <div className="inline-flex rounded-full shadow-sm p-1 bg-gray-100" role="group">
                  <button
                    type="button"
                    onClick={() => setActiveTab("summary")}
                    className={`px-4 py-1 text-xs font-medium rounded-full transition-all ${activeTab === "summary" ? "bg-white text-[#075071] shadow-sm" : "text-gray-500 hover:text-[#075071]"
                      }`}
                  >
                    Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("emotions")}
                    className={`px-4 py-1 text-xs font-medium rounded-full transition-all ${activeTab === "emotions" ? "bg-white text-[#075071] shadow-sm" : "text-gray-500 hover:text-[#075071]"
                      }`}
                    disabled={!hasEmotionData}
                  >
                    Emotions
                  </button>
                </div>
              </div>
            )}
          </>
        }

        {/* 日记条目预览 */}
        <div className="border-t pt-3" onClick={handleCardClick}>
          <div className="flex flex-col space-y-2">
            {/* {dayEntry.entry_contents.slice(0, 4).map((entry) => (
              <div key={entry.euuid} className="flex items-center text-sm text-gray-600">
                <div className="w-5 h-5 rounded-full bg-[#075071]/10 flex items-center justify-center text-[#075071] mr-2">
                  {getIcon(entry.icon || 'file-text')}
                </div>
                <div className="flex-grow truncate mr-2">{entry.title || entry.type}</div>
                                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
              </div>
            ))} */}
            {/* Snippets预览 */}
            {dayEntry.entry_contents
              .filter(item => item.text)
              .slice(0, 4) // 只显示前两个
              .map((snippet) => (
                <div key={snippet.euuid} className="flex items-center text-sm text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-2">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex-grow truncate mr-2" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {snippet.text}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(snippet.created_at).toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

