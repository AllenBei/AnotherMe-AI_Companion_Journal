/*
 * @Author: Allen Bei
 * @Date: 2025-05-11 15:36:39
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-07-14 11:29:38
 * @FilePath: /AnotherMe_AI_Web/app/components/EmotionDisplayCard.tsx
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronUp, ChevronDown } from "lucide-react"
import { useI18n } from '@/app/i18n'
import type { EmotionAnalysisItem } from "@/types/entries"
import { getStandardizedEmotion, generateGradientStyle } from '@/lib/emotion-map'

interface EmotionDisplayCardProps {
  emotionAnalysis: EmotionAnalysisItem[];
}

export function EmotionDisplayCard({ emotionAnalysis }: EmotionDisplayCardProps) {
  const { t, language } = useI18n();
  const [expandedEmotions, setExpandedEmotions] = useState<Record<string, boolean>>({})

  // 切换情绪详情的展开/收起状态
  const toggleEmotionDetails = (emotion: string, e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡
    setExpandedEmotions(prev => ({
      ...prev,
      [emotion]: !prev[emotion]
    }))
  }

  if (!emotionAnalysis || emotionAnalysis.length === 0) {
    return null;
  }

  const gradientStyle = generateGradientStyle(emotionAnalysis);

  return (
    <>
      {/* CSS 样式定义 */}
      <style jsx>{`
        .aurora {
          background: 
            linear-gradient(45deg, 
              var(--aurora-color-1, #4ecdc4), 
              var(--aurora-color-2, #45b7d1), 
              var(--aurora-color-3, #ff6b6b)
            );
          background-size: 300% 300%;
          animation: aurora-dance 6s ease-in-out infinite;
          filter: blur(0.5px);
          position: absolute;
          inset: 0;
          border-radius: 20px;
          z-index: -1;
        }

        @keyframes aurora-dance {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .glass-morphism {
          position: relative;
          border-radius: 20px;
        }
      `}</style>

      <div className="w-full rounded-lg flex items-center justify-start">
        <div 
          className="w-full max-w-[500px] rounded-lg glass-morphism p-4"
          style={gradientStyle}
        >
          {/* 极光背景层 */}
          <div className="aurora"></div>
          
          <div className="space-y-2 relative z-10">
            {emotionAnalysis.map((emotion: EmotionAnalysisItem, index: number) => {
              // 使用getStandardizedEmotion获取标准化的情感数据
              const standardEmotion = getStandardizedEmotion(
                emotion.name_en || '',
                emotion.emoji,
                emotion.color,
                emotion.name_zh
              );
              // 根据用户语言偏好选择显示的情绪名称
              const emotionName = language === 'zh' 
                ? (standardEmotion.name_zh || standardEmotion.name_en)
                : (standardEmotion.name_en || standardEmotion.name_zh);
              return (
                <div key={`${emotionName}-${index}`} className="relative mb-3" 
                onClick={(e) => toggleEmotionDetails(emotionName, e)}>
                  <div className="bg-white/90 rounded-full px-3 py-1 flex justify-between items-center backdrop-blur-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-xl mr-1">{standardEmotion.emoji}</span>
                      <span className="uppercase text-sm font-medium">
                        {emotionName}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm mr-2">{emotion.percent}%</span>
                      <button
                        className="text-gray-500 hover:text-gray-700"
                        aria-label={expandedEmotions[emotionName] ? t('common.collapse') : t('common.expand')}
                      >
                        {expandedEmotions[emotionName] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${emotion.percent}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="absolute left-0 top-0 bottom-0 bg-white/20 rounded-full"
                    style={{ maxWidth: "100%" }}
                  />
                  {/* 情绪解释展开内容 */}
                  {expandedEmotions[emotionName] && emotion.explanation && (
                    <div className="bg-white/80 mt-1 p-2 rounded-xl text-sm text-gray-700 backdrop-blur-sm">
                      {emotion.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  )
} 