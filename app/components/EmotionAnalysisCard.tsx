import React, { useState } from 'react';
import { Activity, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { useI18n } from '@/app/i18n';
import { useRouter } from 'next/navigation';
import { useEntryStore } from '@/app/store/entryStore';
import type { DayEntry, DiaryInsight } from '@/types/entries';
import { LoadingDots } from './LoadingDots';
import { getStandardizedEmotion } from '@/lib/emotion-map';
import { EmotionDisplayCard } from './EmotionDisplayCard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SlideUpFade } from '@/components/ui/slide-up-fade';

interface EmotionAnalysisCardProps {
  streamContent?: string;
  streamReasoning?: string;
  loading?: boolean;
  isAnalysisComplete?: boolean;
  dayEntry?: DayEntry;
  onAnalysisComplete?: () => void;
  diaryInsights?: DiaryInsight[];
  allEntryContents?: any[]; // 用于生成建议时传递日记内容
}

export function EmotionAnalysisCard({
  streamContent = '',
  streamReasoning = '',
  loading = false,
  isAnalysisComplete = false,
  dayEntry,
  onAnalysisComplete,
  diaryInsights = [], // 提供默认值
  allEntryContents = []
}: EmotionAnalysisCardProps) {
  const analysisData = dayEntry?.analysis_data;
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const router = useRouter();
  const setCurrentEntry = useEntryStore(state => state.setCurrentEntry);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // 生成建议的函数
  const generateAdvice = async () => {
    if (!dayEntry?.day_id || !dayEntry?.created_date || !allEntryContents || allEntryContents.length === 0) {
      toast.error(t('common.error'));
      return;
    }

    setLoadingAdvice(true);

    try {
      // 过滤entry_contents，只保留需要的字段
      const processedContents = allEntryContents.map(item => ({
        euuid: item.euuid,
        language: item.language,
        type: item.type,
        words_written: item.words_written,
        text: item.text,
        summary: item.summary,
        summary_en: item.summary_en,
        tags: item.tags,
        reflection_explanation: item.reflection_explanation,
        reflection_types: item.reflection_types,
        key_quotes: item.key_quotes
      }));

      // 发送请求到API生成建议
      const response = await fetch('/api/talk/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          day_id: dayEntry.day_id,
          created_date: dayEntry.created_date,
          entry_contents: processedContents,
          type: 'advice' // 指定生成建议
        }),
      });

      if (!response.ok) {
        throw new Error('建议生成请求失败');
      }

      // 检查是否是直接返回的现有数据
      const contentType = response.headers.get('Content-Type');
      if (contentType?.includes('application/json')) {
        const result = await response.json();
        if (result.success && result.data) {
          // 直接返回的数据，刷新页面或通知父组件
          window.location.reload();
          return;
        }
      }

      // 处理流响应
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      let done = false;
      let fullContent = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.type === 'content' && parsed.content) {
                fullContent += parsed.content;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      // 流读取结束后，提取JSON数据
      if (fullContent) {
        try {
          let jsonText = '';

          // 优先提取 Markdown JSON 代码块中的内容
          if (fullContent.includes('```json') && fullContent.includes('```')) {
            const jsonMatch = fullContent.match(/```json([\s\S]*?)```/);
            if (jsonMatch && jsonMatch[1]) {
              jsonText = jsonMatch[1].trim();
            }
          } else {
            // 尝试直接提取大括号包裹的JSON
            const objMatch = fullContent.match(/\{[\s\S]*\}/);
            if (objMatch) {
              jsonText = objMatch[0];
            }
          }

          if (jsonText) {
            // 使用jsonrepair修复并解析
            // const repairedJson = jsonrepair(jsonText);
            // const adviceData = JSON.parse(repairedJson);

            // 建议生成成功，等待数据库更新完成后再刷新
            toast.success(t('common.success'));
            
            // 简单延迟刷新，给数据库足够时间更新
            setTimeout(() => {
              if (onAnalysisComplete) {
                onAnalysisComplete();
              } else {
                window.location.reload();
              }
            }, 3000); // 等待3秒后刷新
          }
        } catch (e) {
          console.error('解析建议JSON失败:', e);
          toast.error(t('common.error'));
        }
      }

    } catch (error) {
      console.error('生成建议时出错:', error);
      toast.error(t('common.error'));
    } finally {
      setLoadingAdvice(false);
    }
  };

  // 根据用户语言获取情绪名称
  const getEmotionName = (emotion: any) => {
    //  // 尝试获取当前语言的情绪名称
    //  const localizedName = emotion[`name_${analysisData.language}`];
    //  // 如果当前语言没有，优先使用中文，然后是英文，最后是默认值
    //  return localizedName || emotion.name_zh || emotion.name_en || '未知情绪';

    // 使用 getStandardizedEmotion 获取标准化的情感数据
    const standardEmotion = getStandardizedEmotion(
      emotion.name_en || '',
      emotion.emoji,
      emotion.color,
      emotion.name_zh
    );

    // 根据用户语言返回对应名称
    return analysisData?.language === 'zh' ? standardEmotion.name_zh : standardEmotion.name_en;
  };

  // 根据用户语言获取徽章名称
  const getBadgeName = (badge: any) => {
    const localizedName = badge[`name_${analysisData?.language}`];
    return localizedName || badge.name_zh || badge.name_en || '未知徽章';
  };

  // 处理卡片点击事件
  const handleCardClick = (e: React.MouseEvent) => {
    // 如果点击的是按钮或按钮内的元素，不进行导航
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }

    // 确保有 dayEntry 数据
    if (dayEntry) {
      // 使用store存储dayEntry数据
      setCurrentEntry(dayEntry);

      // 导航到详情页
      router.push(`/entries/detail/${dayEntry.day_id}`);
    }
  };

  // 如果没有数据且不在加载中，则不渲染组件
  if (!loading && !isAnalysisComplete && !streamContent && !streamReasoning) {
    return null;
  }

  return (
    <SlideUpFade duration={1} distance={35}>
      <div
        className="bg-blue-50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow mb-6"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center w-full">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mr-2">
              <Activity className="text-blue-500 w-4 h-4" />
            </div>
            <div className="flex items-center justify-between w-full">
              <div className="font-medium text-blue-700 text-sm truncate flex-1" onClick={dayEntry ? handleCardClick : undefined}
                style={dayEntry ? { cursor: 'pointer' } : {}}>
                {t('home.emotionAnalysis.title')}
              </div>
              <button
                onClick={toggleExpanded}
                className="text-blue-500 hover:text-blue-700 ml-2"
              >
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </div>
        </div>

        {loading && !isAnalysisComplete && (
          <LoadingDots size="sm" color="#183861" />
        )}

        {expanded && (
          <div className="transition-all duration-300 ease-in-out">
            {isAnalysisComplete && analysisData ? (
              <div className="space-y-3" onClick={dayEntry ? handleCardClick : undefined}
                style={dayEntry ? { cursor: 'pointer' } : {}}>
                {/* 情绪分析结果 - 使用EmotionDisplayCard组件 */}
                {analysisData.emotion_analysis && analysisData.emotion_analysis.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-blue-700 font-medium text-sm">{t('home.emotionAnalysis.emotionTag')}:</h4>
                    <div className="scale-90 origin-left">
                      <EmotionDisplayCard emotionAnalysis={analysisData.emotion_analysis} />
                    </div>
                  </div>
                )}

                {/* 核心情绪 */}
                {analysisData.insight_focus && (
                  <div className="space-y-1">
                    <h4 className="text-blue-700 font-medium text-sm">{t('home.emotionAnalysis.insightFocus')}:</h4>
                    <p className="text-gray-700 text-sm">{analysisData.insight_focus}</p>
                  </div>
                )}

                {/* 日记洞察 - 新增部分 */}
                {diaryInsights && diaryInsights.length > 0 && (
                  <div className="mt-4">
                    <div className="space-y-4">
                      {diaryInsights.map((insight, idx) => (
                        <div key={idx} className="border-l-2 border-blue-400 pl-2">
                          <div className="flex items-center mb-1">
                            <span className="mr-1 text-base">{insight.icon || '📝'}</span>
                            <span className="font-medium text-blue-800 text-sm">{insight.title}</span>
                          </div>
                          <div className="ml-6 text-gray-700 text-sm">
                            <p className="mb-1">{insight.insight_path}</p>
                            {insight.analogy && (
                              <p className="text-gray-800 italic font-semibold">✨{insight.analogy}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 情绪徽章 */}
                {analysisData.mood_badge && (
                  <div className="space-y-1">
                    <h4 className="text-blue-700 font-medium text-sm">{t('home.emotionAnalysis.badge')}:</h4>
                    <div className="bg-blue-200 text-blue-800 inline-block px-3 py-1 rounded-full text-sm">
                      {getBadgeName(analysisData.mood_badge)}
                    </div>
                  </div>
                )}

                {/* 鼓励与建议 */}
                {analysisData.encouragement_and_suggestions && analysisData.encouragement_and_suggestions.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-blue-700 font-medium text-sm">{t('home.emotionAnalysis.AMwantToSay')}:</h4>
                    <ul className="space-y-2">
                      {analysisData.encouragement_and_suggestions.map((item: any, index: number) => (
                        <li key={index} className="text-gray-700 text-sm flex items-start gap-1">
                          {/* <span className="text-blue-500 font-bold text-xs mt-1">•</span> */}
                          <span>{item.content || t('home.emotionAnalysis.noSuggestion')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="text-right text-xs text-gray-400 mt-2">
                  {t('home.emotionAnalysis.generatedBy')}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 显示推理过程 */}
                {streamReasoning && (
                  <div className="text-gray-600 text-sm">
                    {t('home.emotionAnalysis.reasoning')}
                  </div>
                )}
                {/* 不再显示JSON内容 */}
                {/* loading 时可以显示一个占位符 */}
                {streamContent && streamContent.includes('{') && (
                  <div className="mt-4">
                    <p className="text-gray-500 text-sm mb-2">
                      {t('home.emotionAnalysis.loading')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!expanded && isAnalysisComplete && analysisData && (
          <div className="text-gray-700 text-sm mb-2">
            {/* 简短预览 - 仅显示情绪分析的简要内容 */}
            <div className="flex flex-wrap gap-2 mb-2">
              {analysisData.emotion_analysis?.slice(0, 3).map((emotion: any, index: number) => (
                <div key={index} className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-full">
                  <span>{getStandardizedEmotion(emotion.name_en || '', emotion.emoji, emotion.color, emotion.name_zh).emoji}</span>
                  <span className="text-xs text-blue-800">
                    {getEmotionName(emotion)} {emotion.percent || 0}%
                  </span>
                </div>
              ))}
              {analysisData?.emotion_analysis && analysisData?.emotion_analysis?.length > 3 && (
                <span className="text-xs text-blue-500">+{analysisData?.emotion_analysis?.length - 3}</span>
              )}
            </div>
            {/* {analysisData.mood_badge && (
              <p className="text-gray-600 text-xs">
                <span className="font-medium">{getBadgeName(analysisData.mood_badge)}</span>
              </p>
            )} */}
          </div>
        )}

        {!expanded && !isAnalysisComplete && streamReasoning && (
          <div className="text-gray-700 text-sm mb-2">
            <p className="text-xs text-gray-500 truncate">
              {t('home.emotionAnalysis.reasoning')}
              {/* {streamReasoning.substring(0, 100)}
              {streamReasoning.length > 100 ? '...' : ''} */}
            </p>
          </div>
        )}
      </div>
    </SlideUpFade>
  );
} 