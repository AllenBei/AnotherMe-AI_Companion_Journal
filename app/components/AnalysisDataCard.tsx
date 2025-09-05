/*
 * @Author: Allen Bei
 * @Date: 2025-05-11 15:37:00
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-06-24 08:53:05
 * @FilePath: /AnotherMe_AI_Web/app/components/AnalysisDataCard.tsx
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
"use client"

import { useI18n } from '@/app/i18n'
import type { AnalysisData, DiaryInsight } from "@/types/entries"
import { EmotionDisplayCard } from './EmotionDisplayCard';


interface AnalysisDataCardProps {
  analysisData: AnalysisData;
  diaryInsights?: DiaryInsight[]; // 新增的属性
}

export function AnalysisDataCard({ analysisData, diaryInsights = [] }: AnalysisDataCardProps) {
  const { t } = useI18n();

  if (!analysisData) {
    return null;
  }

  // 判断是否应该显示分析数据
  const shouldShowAnalysisData = analysisData &&
    (analysisData.insight_focus ||
      (analysisData.encouragement_and_suggestions &&
        analysisData.encouragement_and_suggestions.length > 0))

  if (!shouldShowAnalysisData) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {analysisData.emotion_analysis && (
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-[#075071] mb-4">{t('entries.analysisInsights')}</h3>
          <div className="mb-4">
            {/* <h3 className="font-medium text-[#075071] mb-2">{t('entries.emotionAnalysis')}</h3> */}
            <EmotionDisplayCard emotionAnalysis={analysisData.emotion_analysis!} />
          </div>
          {/* <h3 className="font-medium text-[#075071] mb-2">{t('entries.contextSummary')}</h3>
          <p className="text-gray-700">{analysisData.minimal_context}</p> */}
        </div>
      )}

      {/* 核心洞察 */}
      {analysisData.insight_focus && (
        <div className="mb-4">
          <h3 className="font-medium text-[#075071] mb-2">{t('entries.insightFocus')}</h3>
          <p className="text-gray-700 font-medium">{analysisData.insight_focus}</p>
        </div>
      )}

      {/* 日记洞察 - 新增部分 */}
      {diaryInsights && diaryInsights.length > 0 && (
        <div className="my-6">
          <div className="space-y-6">
            {diaryInsights.map((insight, idx) => (
              <div key={idx} className="border-l-2 border-blue-400 pl-3">
                <div className="flex items-center mb-1">
                  <span className="mr-2 text-lg">{insight.icon || '📝'}</span>
                  <span className="font-medium text-[#075071]">{insight.title}</span>
                </div>
                <div className="ml-7 text-gray-700">
                  <p className="mb-1">{insight.insight_path}</p>
                  {insight.analogy && (
                    <p className="text-gray-800 italic  font-semibold">✨{insight.analogy}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* {analysisData.tracked_recent_events &&
        analysisData.tracked_recent_events.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium text-[#075071] mb-2">{t('entries.recentEventsTracking')}</h3>
            <div className="space-y-3">
              {analysisData.tracked_recent_events.map((event, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="font-medium mb-1">{event.event}</p>
                  {event.trigger_quote && (
                    <p className="text-sm text-gray-600 italic">"{event.trigger_quote}"</p>
                  )}
                  <div className="mt-2 flex justify-end">
                    <span className={`text-xs px-2 py-1 rounded-full ${event.status === 'in progress' ? 'bg-yellow-100 text-yellow-800' :
                      event.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {event.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )} */}

      {analysisData.encouragement_and_suggestions &&
        analysisData.encouragement_and_suggestions.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium text-[#075071] mb-2">{t('entries.suggestionsAndEncouragement')}</h3>
            <ul className="list-disc pl-5 space-y-2">
              {analysisData.encouragement_and_suggestions.map((item, idx) => (
                <li key={idx} className="text-gray-700">
                  {/* {item.type && <span className="text-xs font-medium text-blue-600 mr-1">[{item.type}]</span>} */}
                  {item.content}
                </li>
              ))}
            </ul>
          </div>
        )}

      {analysisData.mood_badge && (
        <div className="mb-4 flex justify-center">
          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm">
            {t('entries.earnedBadge')} {analysisData.mood_badge.name_zh || analysisData.mood_badge.name_en}
          </span>
        </div>
      )}
    </div>
  );
} 