import { NextResponse } from 'next/server';
import createSupabaseServerClient from '@/lib/supabase/server'; 
import { getStandardizedEmotion } from '@/lib/emotion-map';
// EmotionAnalysisItem might not be directly needed here anymore if SQL fn handles all unpacking
// import { EmotionAnalysisItem } from '@/types/entries'; 

// Expected row structure from the SQL function fn_get_emotion_summary
interface EmotionSummaryRow {
  standardized_name_en: string;
  original_name_zh: string | null; // New: To capture name_zh from DB
  original_emoji: string | null; // Added from SQL function
  original_color: string | null; // Added from SQL function
  total_percent_value: number;
  entry_count: number;
  all_source_euuids: string[] | null; // Matches the SQL function output
}

// Final structure for API response items
interface ApiProcessedEmotion {
  name_en: string;
  name_zh: string;
  emoji: string;
  total_percent: number; // This will be total_percent_value from SQL fn
  proportion: number;
  entry_count: number;
  euuids: string[];
  color?: string; // Adding color to the final API output for the frontend
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');

  if (!fromDate || !toDate) {
    return NextResponse.json({ error: 'Missing required parameters: from, to' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('User auth error:', userError);
    return NextResponse.json({ error: 'User authentication failed' }, { status: 401 });
  }

  // Call the SQL function fn_get_emotion_summary
  const { data: summaryData, error: rpcError } = await supabase.rpc(
    'fn_get_emotion_summary', 
    {
      p_user_id: user.id,
      p_from_date: fromDate,
      p_to_date: toDate,
    }
  ) as { data: EmotionSummaryRow[] | null; error: any }; 

  if (rpcError) {
    console.error('Supabase RPC error calling fn_get_emotion_summary:', rpcError);
    return NextResponse.json({ error: 'Failed to fetch emotion summary: ' + rpcError.message }, { status: 500 });
  }

  const finalEmotionsOutput: ApiProcessedEmotion[] = [];
  let grandTotalPercentForAllEmotions = 0;

  if (summaryData && Array.isArray(summaryData)) {
    // First pass: calculate the grand total of percent values for proportion calculation
    for (const row of summaryData) {
      if (typeof row.total_percent_value === 'number') {
        grandTotalPercentForAllEmotions += row.total_percent_value;
      }
    }

    // Second pass: build the final output using mapped names and calculate proportion
    for (const row of summaryData) {
      // Pass original_emoji, original_color, and new original_name_zh to getStandardizedEmotion
      // console.log('Processing row for API:', row); // Keep for debugging if needed
      const mappedEmotion = getStandardizedEmotion(
        row.standardized_name_en,
        row.original_emoji || undefined, 
        row.original_color || undefined,
        row.original_name_zh || undefined // New: Pass original_name_zh
      );
      
      const currentEmotionTotalPercent = typeof row.total_percent_value === 'number' ? row.total_percent_value : 0;

      finalEmotionsOutput.push({
        name_en: mappedEmotion.name_en,
        name_zh: mappedEmotion.name_zh, // This will now use original_name_zh for unmapped items if available
        emoji: mappedEmotion.emoji,
        color: mappedEmotion.color, 
        total_percent: currentEmotionTotalPercent,
        proportion: grandTotalPercentForAllEmotions > 0 ? currentEmotionTotalPercent / grandTotalPercentForAllEmotions : 0,
        entry_count: Number(row.entry_count) || 0, // Ensure entry_count is a number
        euuids: row.all_source_euuids || [], // Default to empty array if null
      });
    }
    
    // The SQL function already orders by total_percent_value DESC, 
    // so if that order is desired, no need to sort here unless by proportion.
    // If sorting by proportion is explicitly needed:
    // finalEmotionsOutput.sort((a, b) => b.proportion - a.proportion);

  } else {
    console.log('No summary data returned from fn_get_emotion_summary or data is not an array:', summaryData);
  }

  return NextResponse.json({
    total_emotion_percent: grandTotalPercentForAllEmotions, // This is the sum of all individual emotion total_percent values
    total_emotions: finalEmotionsOutput,
  });
} 