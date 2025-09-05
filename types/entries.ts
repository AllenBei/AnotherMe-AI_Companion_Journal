/*
 * @Author: Allen Bei
 * @Date: 2025-05-11 16:30:09
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-06-10 18:15:35
 * @FilePath: /AnotherMe_AI_Web/types/entries.ts
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
// API返回的情绪分析项
export interface EmotionAnalysisItem {
  emoji: string;
  name_en: string;
  name_zh?: string;
  percent: number;
  color: string;
  source_euuid: string[];
  explanation: string;
}

// 分析数据结构
export interface AnalysisData {
  language?: string;
  minimal_context?: string;
  insight_focus?: string;
  encouragement_and_suggestions?: Array<{ type?: string; content: string }>;
  mood_badge?: {
    name_en: string;
    name_zh?: string;
  };
  emotion_analysis?: EmotionAnalysisItem[];
  tracked_recent_events?: Array<{
    event: string;
    trigger_quote: string;
    status: string;
  }>;
  [key: string]: any;
}

// API返回的条目内容
export interface EntryContent {
  euuid: string;
  day_id: string;
  type: string;
  content_type?:string| null
  content: string;
  title?: string;
  icon?: string;
  summary?: string;
  language?: string;
  created_at: string;
  summary_en?: string;
  updated_at?: string | null;
  is_reflective?: boolean;
  words_written?: number;
  reflection_types?: string[] | null;
  // tracked_questions?: Array<{
  //   context?: string;
  //   question: string;
  // }> | null;
  key_quotes?: {
    quote: string;
    type: string;
  }[] | null;
  reflection_explanation?: string | null;
  insight_path?: string | null  // 数据库中可能为null
  analogy?: string | null       // 数据库中可能为null
  text?: string;
  tags?: string[];
  status?: string;
}

// 评论数据结构
export interface JournalComment {
  id: string;
  day_id: string;
  user_id: string;
  content: string;
  likes: number;
  created_at: string;
  updated_at: string;
}

// API返回的日记条目
export interface DayEntry {
  day_id: string;
  created_date: string;
  user_id: string;
  analysis_data: AnalysisData | null;
  created_year: string;
  created_at: string;
  updated_at: string;
  status: string;
  entry_contents: EntryContent[];
  entries_comments: JournalComment[] | null;
  likes: number; // 当天所有评论的likes总和
}

export interface DiaryInsight{
  icon: string;
  title: string;
  insight_path: string;
  analogy: string;
}


// 分页状态
export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// 日历日期情绪数据
export interface CalendarDayData {
  date: string; // YYYY-MM-DD
  mood_badge: {
    name_zh: string;
    name_en: string;
  };
  insight_focus: string; // 简化版洞察，30-40字
  word_count: number;
  main_event?: string; // 主要事件
  emotions: Array<{
    name_zh: string;
    name_en: string;
    emoji: string;
    percent: number;
  }>;
  key_quote?: string; // 关键语录
  day_id: string;
  gradient_style: string; // CSS 渐变样式
}

// 扩展后的统计数据接口
export interface InsightsStatsResponse {
  streak_data: {
    streak_start: string | null;
    streak_end: string | null;
    streak_length: number;
  };
  recorded_dates: string[]; // 保留向后兼容
  daily_data: CalendarDayData[]; // 新增详细日历数据
  total_entries: number;
  total_words_written: number;
} 