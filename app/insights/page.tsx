/*
 * @Author: Allen Bei
 * @Date: 2025-03-07 15:53:44
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-08-22 17:16:27
 * @FilePath: /AnotherMe-AI_Companion_Journal/app/insights/page.tsx
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
"use client"

import { HabitTracking } from "@/components/habit-tracking"
import { EmotionalState } from "@/components/emotional-state"
import Layout from '@/app/components/Layout'
import { useEffect, useState } from "react"
import { useI18n } from '@/app/i18n'
import { PageLoading } from "../components/LoadingDots"
import type { InsightsStatsResponse, DayEntry } from '@/types/entries'
// import { useTranslation } from 'react-i18next'; // Placeholder for i18n

// Define the type for the stats data
interface StreakData {
  streak_start: string | null;
  streak_end: string | null;
  streak_length: number;
}

interface WritingStats {
  streak_data: StreakData;
  recorded_dates: string[]; // Array of "YYYY-MM-DD"
  total_entries: number;
  total_words_written: number;
}

// Journal Review数据类型
interface JournalReviewData {
  [key: string]: DayEntry | null;
}

export default function InsightsPage() {
  const { t } = useI18n(); // Placeholder for i18n

  const [stats, setStats] = useState<InsightsStatsResponse | null>(null);
  const [journalData, setJournalData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/insights/stats');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      const data: InsightsStatsResponse = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to fetch writing stats:", err);
    } finally {
      setLoading(false);
    }
  }

  const fetchJournalReviewData = async () => {
    try {
      const response = await fetch('/api/insights/journal-review');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        // console.log('API返回的原始数据:', result.data);
        setJournalData(result.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch journal review data:", err);
      // 如果获取失败，设置为空对象，不影响其他功能
      setJournalData({});
    }
  }

  useEffect(() => {
    console.log("InsightsPage useEffect triggered");
    const fetchData = async () => {
      await Promise.all([
        fetchStats(),
        fetchJournalReviewData()
      ]);
    };
    fetchData();
  }, []);

  if (loading) {
    return <Layout><PageLoading /></Layout>;
  }

  if (error) {
    return <Layout><div className="container mx-auto pt-4 pb-20 max-w-5xl px-4 text-center text-red-500">{t('insights.error')}</div></Layout>;
  }

  if (!stats) {
    return <Layout><div className="container mx-auto pt-4 pb-20 max-w-5xl px-4 text-center">{t('insights.noData')}</div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto pt-4 pb-20 max-w-5xl px-4">
        {/* <h1 className="text-4xl font-bold text-dark mb-1">{t('insights.title')}</h1> */}

        {/* Emotional State */}
        <EmotionalState />

        {/* Habit Tracking */}
        <HabitTracking
          totalEntries={stats.total_entries}
          longestStreak={stats.streak_data.streak_length}
          totalWordsWritten={stats.total_words_written}
        />

      </div>
    </Layout>
  )
} 