/*
 * @Author: Allen Bei
 * @Date: 2025-04-11 16:17:00
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-09-02 11:17:59
 * @FilePath: /AnotherMe-AI_Companion_Journal/app/api/talk/deeper/route.ts
 * @Description: API endpoint for generating AI responses with different modes (deeper, positive, story) and language-aware prompts
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
import { generateReply } from '@/ai/services/generateReply';
import { NextRequest, NextResponse } from 'next/server';
import { therapistAskPrompt } from '@/ai/prompt/system/therapist'
import { htmlToPlainTextServer } from '@/lib/server-utils';
import { Message } from '@/ai/utils/getStreamResponse';
import createSupabaseServerClient from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '用户未认证' }, { status: 401 });
    }
    
    const { content, type = 'deeper' } = await req.json();
    
    // Convert HTML content to plain text
    const plainTextContent = htmlToPlainTextServer(content);

    // Skip processing if content is too short
    if (!plainTextContent || plainTextContent.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Content too short' },
        { status: 400 }
      );
    }

    // 根据type选择对应的prompt
    let promptToUse;
    switch (type) {
      case 'deeper':
      default:
        promptToUse = therapistAskPrompt;
        break;
    }

    // therapist prompt
    const selectedTherapistPrompt = promptToUse.en;
    const messages: Message[] = [
      { role: 'user', content: plainTextContent },
    ];

    // Use the guide question prompt as input
    // const action = guideQuestionPrompt;

    // Generate the stream response with language-specific therapist prompt
    const stream: ReadableStream = await generateReply({
      provider: 'deepseek',
      action:selectedTherapistPrompt,
      messages
    });
    // console.log(selectedTherapistPrompt)
    return new NextResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream' }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
