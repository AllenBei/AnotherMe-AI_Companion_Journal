/*
 * @Author: Allen Bei
 * @Date: 2025-05-19 17:25:27
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-06-03 14:14:29
 * @FilePath: /AnotherMe_AI_Web/app/api/insights/stats/route.ts
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
import createSupabaseServerClient from '@/lib/supabase/server'; 
import { NextRequest, NextResponse } from 'next/server';
import { generateCalendarGlassStyle } from '@/lib/emotion-map';
import type { CalendarDayData, InsightsStatsResponse } from '@/types/entries';
import { getStandardizedEmotion } from '@/lib/emotion-map';

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();

  if (getUserError || !user) {
    console.error('Error fetching user or no user:', getUserError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 解析查询参数
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    // 获取基础统计数据 (不受日期范围限制)
    const { data: statsData, error: rpcError } = await supabase.rpc('get_user_writing_stats', { p_user_id: user.id });

    if (rpcError) {
      console.error('Supabase RPC error in get_user_writing_stats:', rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    // 获取日历情绪数据 (支持日期范围过滤)
    let calendarData = null;
    let calendarError = null;

    if (startDate && endDate) {
      // 有日期范围的情况，调用带日期参数的函数
      const { data, error } = await supabase.rpc('get_calendar_emotion_data_range', { 
        p_user_id: user.id,
        p_start_date: startDate,
        p_end_date: endDate
      });
      calendarData = data;
      calendarError = error;
    } else {
      // 没有日期范围，获取所有数据
      const { data, error } = await supabase.rpc('get_calendar_emotion_data', { p_user_id: user.id });
      calendarData = data;
      calendarError = error;
    }

    if (calendarError) {
      console.error('Supabase RPC error in get_calendar_emotion_data:', calendarError);
      // 即使日历数据失败，也返回基础统计数据
    }

    // 处理基础统计数据
    const stats = Array.isArray(statsData) ? statsData[0] : statsData;
    if (!stats) {
      console.warn('Empty data array from get_user_writing_stats RPC for user:', user.id);
      return NextResponse.json({
        streak_data: { streak_start: null, streak_end: null, streak_length: 0 },
        recorded_dates: [],
        daily_data: [],
        total_entries: 0,
        total_words_written: 0,
      });
    }

    // 处理日历情绪数据
    const processedCalendarData: CalendarDayData[] = calendarData ? calendarData.map((day: any) => {
      const emotions = day.emotions || [];
      
      // 为每个情绪添加emoji和颜色信息
      const processedEmotions = emotions.map((emotion: any) => {
        const standardEmotion = getStandardizedEmotion(
          emotion.name_en || '',
          emotion.emoji,
          emotion.color,
          emotion.name_zh
        );
        return {
          name_zh: emotion.name_zh || standardEmotion.name_zh,
          name_en: emotion.name_en || standardEmotion.name_en,
          emoji: standardEmotion.emoji, // 使用标准化的emoji
          percent: emotion.percent || 0
        };
      });
      
      // 使用现有的 generateCalendarGlassStyle 函数生成渐变
      const gradientStyle = processedEmotions.length > 0 
        ? generateCalendarGlassStyle(processedEmotions)
        : 'linear-gradient(135deg, #f3f4f6, #e5e7eb)'; // 默认灰色渐变

      return {
        date: day.date,
        mood_badge: {
          name_zh: day.mood_badge_zh || '',
          name_en: day.mood_badge_en || ''
        },
        insight_focus: day.insight_focus || '',
        word_count: parseInt(day.word_count?.toString() || '0', 10),
        main_event: day.main_event || '',
        emotions: processedEmotions,
        key_quote: day.key_quote || '',
        day_id: day.day_id,
        gradient_style: gradientStyle
      };
    }) : [];

    // 返回完整数据
    const response: InsightsStatsResponse = {
      streak_data: {
        streak_start: stats.streak_start,
        streak_end: stats.streak_end,
        streak_length: stats.streak_length || 0,
      },
      recorded_dates: stats.recorded_dates || [], // 保留向后兼容
      daily_data: processedCalendarData, // 新增详细日历数据
      total_entries: stats.total_entries || 0,
      total_words_written: stats.total_words_written || 0,
    };

    return NextResponse.json(response);

  } catch (e: any) {
    console.error('API route /api/insights/stats error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
} 