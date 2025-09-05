import { NextResponse } from 'next/server';
import createSupabaseServerClient from '@/lib/supabase/server';
import { formatToDate, htmlToPlainTextServer } from '@/lib/utils';
import type { DayEntry } from '@/types/entries';

// 定义返回数据的类型
interface JournalReviewData {
  [key: string]: DayEntry | null;
}

// 计算特定时间点的日期并记录日志
const getTargetDates = (): { [key: string]: string } => {
  const now = new Date();
  const intervals = {
    today: 0,
    '1week_ago': 7,
    '1month_ago': 30,
    '1quarter_ago': 90,
    '6months_ago': 180,
    '1year_ago': 365,
  };

  return Object.fromEntries(
    Object.entries(intervals).map(([key, days]) => {
      const targetDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      console.log(`${key}: ${formatToDate(targetDate)}`);
      return [key, formatToDate(targetDate)];
    })
  );
};

// 处理单个日记条目的内容
const processEntryContents = (entry: DayEntry): DayEntry => {
  if (entry.entry_contents && Array.isArray(entry.entry_contents)) {
    const processedContents = entry.entry_contents
      .map((item: any) => ({
        ...item,
        text: htmlToPlainTextServer(item.content)
      }))
      .sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    
    return { ...entry, entry_contents: processedContents };
  }
  return entry;
};

// 查询单个日期的日记数据
const fetchEntryByDate = async (supabase: any, userId: string, targetDate: string): Promise<DayEntry | null> => {
  const { data: entries, error } = await supabase
    .from('entries')
    .select(`
      *,
      entry_contents (*),
      entries_comments (*)
    `)
    .eq('user_id', userId)
    .eq('created_date', targetDate)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error(`查询日记失败 (${targetDate}):`, error);
    return null;
  }

  return entries ? processEntryContents(entries as DayEntry) : null;
};

// GET：获取特定日期的日记数据
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // 获取当前认证用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '用户未认证' }, { status: 401 });
    }

    const targetDates = getTargetDates();
    const journalReviewData: JournalReviewData = {};

    // 顺序查询所有日期的数据（避免并发问题）
    for (const [timeKey, targetDate] of Object.entries(targetDates)) {
      try {
        const entry = await fetchEntryByDate(supabase, user.id, targetDate);
        journalReviewData[timeKey] = entry;
      } catch (err) {
        console.error(`处理${timeKey}(${targetDate})的数据时出错:`, err);
        journalReviewData[timeKey] = null;
      }
    }

    return NextResponse.json({
      success: true,
      data: journalReviewData,
      target_dates: targetDates // 返回目标日期供调试使用
    });

  } catch (error) {
    console.error('获取Journal Review数据失败:', error);
    return NextResponse.json({ error: '获取Journal Review数据失败' }, { status: 500 });
  }
}