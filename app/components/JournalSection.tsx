import { useI18n } from '@/app/i18n'
import { EntryItem } from './EntryItem'
import { DayEntry, DiaryInsight } from '@/types/entries'
import { EmptyRecord } from './EmptyRecord'
import { EmotionAnalysisCard } from './EmotionAnalysisCard'
import { useState, useEffect } from 'react'
import { jsonrepair } from 'jsonrepair';
import { LoadingDots } from "@/app/components/LoadingDots";


interface JournalSectionProps {
  todayEntries?: DayEntry[];
  onAnalysisComplete?: () => void;
  isLoading?: boolean;
}

export function JournalSection({ todayEntries = [], onAnalysisComplete, isLoading }: JournalSectionProps) {
  const { t } = useI18n()
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [streamContent, setStreamContent] = useState<string>('');
  const [streamReasoning, setStreamReasoning] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [diaryInsights, setDiaryInsights] = useState<DiaryInsight[]>([]);

  // If isLoading is true (as passed from parent), show loading indicator.
  // Note: app/page.tsx might already handle top-level loading state.
  // This internal check is for flexibility or if JournalSection is used elsewhere with this prop.
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <LoadingDots size="lg" />
      </div>
    );
  }

  // 检查是否有数据
  const hasData = todayEntries && todayEntries.length > 0 &&
    todayEntries.some(entry => entry.entry_contents && entry.entry_contents.length > 0);

  // 提取diary insights的函数
  const extractDiaryInsights = (entries: DayEntry[] = []): DiaryInsight[] => {
    if (!entries || entries.length === 0) return [];

    const insights: DiaryInsight[] = [];

    entries.forEach(entry => {
      if (!entry.entry_contents) return;

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
    });

    return insights;
  };

  // 查找morning类型的内容
  const morningEntry = todayEntries?.find(entry =>
    entry.entry_contents?.some(content => content.type === 'morning')
  )
  const morningContent = morningEntry?.entry_contents?.find(content => content.type === 'morning')

  // 查找evening类型的内容
  const eveningEntry = todayEntries?.find(entry =>
    entry.entry_contents?.some(content => content.type === 'evening')
  )
  const eveningContent = eveningEntry?.entry_contents?.find(content => content.type === 'evening')

  // 查找snippet类型的内容
  const snippetEntries = todayEntries?.flatMap(entry =>
    entry.entry_contents?.filter(content => content.type === 'snippet') || []
  )

  // 获取所有条目和day_id以及created_date用于情绪分析
  const allEntryContents = todayEntries?.flatMap(entry => entry.entry_contents || [])
  const day_id = todayEntries?.[0]?.day_id
  const created_date = todayEntries?.[0]?.created_date

  // 检查是否已有分析数据
  const existingAnalysisData = todayEntries?.[0]?.analysis_data

  // 当有现有分析数据时，初始化状态
  useEffect(() => {
    // 提取并设置diary insights
    const insights = extractDiaryInsights(todayEntries);
    setDiaryInsights(insights);

    if (existingAnalysisData) {
      setAnalysisData(existingAnalysisData);
      setIsAnalysisComplete(true);
      setLoading(false);
    }
    if (existingAnalysisData === null) {
      setAnalysisData(null);
      setIsAnalysisComplete(false);
      setLoading(false);
    }
  }, [existingAnalysisData, todayEntries]);

  // 分析情绪的函数
  const analyzeEmotions = async () => {
    if (!day_id || !created_date || !allEntryContents || allEntryContents.length === 0) {
      console.error('缺少必要的分析数据');
      return;
    }

    // 如果已经有分析数据或正在分析中，不重复请求
    // if (isAnalysisComplete || isAnalyzing) {
    //   return;
    // }

    setLoading(true);
    setIsAnalyzing(true);
    setStreamContent('');
    setStreamReasoning('');
    setIsAnalysisComplete(false);

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

      // 发送请求到API
      const response = await fetch('/api/talk/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          day_id,
          created_date,
          entry_contents: processedContents,
          type: 'emotion' // 明确指定为情绪分析
        }),
      });

      if (!response.ok) {
        throw new Error('分析请求失败');
      }

      // 检查是否是直接返回的现有数据
      const contentType = response.headers.get('Content-Type');
      if (contentType?.includes('application/json')) {
        const result = await response.json();
        if (result.success && result.data && result.existing) {
          setAnalysisData(result.data);
          setIsAnalysisComplete(true);
          setLoading(false);
          setIsAnalyzing(false);
          return;
        }
      }

      // 处理流响应
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      let done = false;
      let jsonData = null;
      let fullContent = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
          const chunk = decoder.decode(value);

          // 解析流中的JSON响应
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          // console.log('lines', lines)
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              // console.log('parsed', parsed)
              if (parsed.type === 'reasoning' && parsed.reasoning) {
                setStreamReasoning(prev => prev + parsed.reasoning);
              } else if (parsed.type === 'content' && parsed.content) {
                // 处理返回的实际内容
                setStreamContent(prev => prev + parsed.content);
                fullContent += parsed.content; // 累积所有 content
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      // 流读取结束后，统一做一次 JSON 提取，支持代码块和纯 JSON
      let jsonText = '';
      // 优先提取 Markdown JSON 代码块中的内容
      if (fullContent.includes('```json') && fullContent.includes('```')) {
        const jsonMatch = fullContent.match(/```json([\s\S]*?)```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonText = jsonMatch[1].trim();
          // console.log('jsonText', jsonText);
        }
      } else {
        // 无代码块时，尝试直接使用累积文本
        jsonText = fullContent.trim();
      }
      if (jsonText) {
        try {
          // 优先从 Markdown JSON 代码块提取
          const codeBlockMatch = jsonText.match(/```json([\s\S]*?)```/);
          let extractedJson = '';

          if (codeBlockMatch && codeBlockMatch[1]) {
            extractedJson = codeBlockMatch[1].trim();
            console.log('从```json代码块中提取JSON');
          } else {
            // 尝试直接提取大括号包裹的JSON
            const objMatch = jsonText.match(/\{[\s\S]*\}/);
            if (objMatch) {
              extractedJson = objMatch[0];
              console.log('从大括号中提取JSON');
            } else {
              extractedJson = jsonText;
              console.log('使用原始JSON文本');
            }
          }

          // 使用jsonrepair修复并解析
          const repairedJson = jsonrepair(extractedJson);
          jsonData = JSON.parse(repairedJson);

          setAnalysisData(jsonData);
          setIsAnalysisComplete(true);

          // 通知父组件刷新数据
          if (onAnalysisComplete) {
            onAnalysisComplete();
          }
        } catch (e) {
          console.error('解析JSON失败:', e, '原始jsonText前100字符:', jsonText.substring(0, 100));
        }
      }
      // 结束 JSON 提取

      setLoading(false);
      setIsAnalyzing(false);

    } catch (error) {
      console.error('分析情绪时出错:', error);
      setLoading(false);
      setIsAnalyzing(false);
    }
  };

  // 处理结束一天的点击
  const handleEndDay = () => {
    // 开始分析情绪
    analyzeEmotions();
  };

  // 判断是否应该显示情绪分析卡片
  const shouldShowAnalysisCard = existingAnalysisData || loading || isAnalysisComplete || streamContent.length > 0;
  // 判断结束一天按钮是否应该禁用
  const endDayButtonDisabled = isAnalysisComplete || loading || isAnalyzing;

  return (
    <>
      {/* New Module Section */}
      {/* <section className="mb-8 grid grid-cols-2 gap-4">
        <Link
          href="/analysis"
          className="bg-white rounded-xl p-4 cursor-pointer shadow-sm hover:shadow-md transition-shadow border border-secondary/20"
        >
          <div className="flex items-center mb-1">
            <BarChart3 className="text-dark/80 w-4 h-4 mr-2" />
            <h3 className="text-base font-bold text-dark">{t('home.regularAnalysis')}</h3>
          </div>
          <p className="text-gray-600 text-xs">{t('home.regularAnalysisSubtitle')}</p>
        </Link>

        <Link
          href="/framework"
          className="bg-dark/90 text-white rounded-xl p-4 cursor-pointer shadow-sm hover:shadow-md transition-shadow border border-secondary/20"
        >
          <div className="flex items-center mb-1">
            <FileText className="text-white/80 w-4 h-4 mr-2" />
            <h3 className="text-base font-bold">{t('home.journalTemplates')}</h3>
          </div>
          <p className="text-white/70 text-xs">{t('home.journalTemplatesSubtitle')}</p>
        </Link>
      </section> */}

      {/* Entries Section */}
      <section>
        <div className="uppercase text-gray-400 tracking-widest text-xs font-medium mb-6">
          {t('home.records')}
        </div>

        {hasData ? (
          <>
            {/* 情绪分析卡片 */}
            {shouldShowAnalysisCard && (
              <EmotionAnalysisCard
                dayEntry={todayEntries?.[0]}
                streamContent={streamContent}
                streamReasoning={streamReasoning}
                loading={loading}
                isAnalysisComplete={isAnalysisComplete}
                diaryInsights={diaryInsights}
                allEntryContents={allEntryContents}
                onAnalysisComplete={onAnalysisComplete}
              />
            )}

            {/* Morning Entry */}
            {morningContent && (
              <div className="mb-6">
                <EntryItem entry={morningContent} type="morning" showTags />
              </div>
            )}

            {/* Snippet Items */}
            <div className="space-y-4 mb-6">
              {snippetEntries && snippetEntries.length > 0 &&
                snippetEntries.map((snippet, index) => (
                  <EntryItem
                    key={snippet.euuid || index}
                    entry={snippet}
                    type="snippet"
                    showTags
                  />
                ))
              }
            </div>

            {/* Evening Entry */}
            {eveningContent && (
              <div className="mb-6">
                <EntryItem entry={eveningContent} type="evening" showTags />
              </div>
            )}

            <div className="flex justify-center mt-8">
              <button
                className={`bg-secondary text-white px-6 py-2 rounded-full flex items-center transition-colors shadow-md text-sm ${endDayButtonDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary/90 cursor-pointer'
                  }`}
                onClick={handleEndDay}
              // disabled={endDayButtonDisabled}
              >
                <span>{isAnalysisComplete ? t('home.dayEnded') : t('home.endDay')}</span>
              </button>
            </div>
            <p className="text-center text-xs text-gray-500 mt-2 mb-14">
              {isAnalysisComplete ? t('home.dayEndedTip') : t('home.endDayTip')}
            </p>
          </>
        ) : (
          <EmptyRecord />
        )}
      </section>
    </>
  )
} 