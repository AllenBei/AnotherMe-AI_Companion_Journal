/*
 * @Author: Allen Bei
 * @Date: 2025-04-25 16:17:00
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-08-25 10:46:57
 * @FilePath: /AnotherMe-AI_Companion_Journal/app/api/talk/journal/route.ts
 * @Description: API endpoint for generating emotion analysis for daily entries
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
import { generateReply } from '@/ai/services/generateReply';
import { NextRequest, NextResponse } from 'next/server';
import { dailyEmotionAnalysisPrompt } from '@/ai/prompt/scenario/emotionAnalysis';
import { adviceGenerationPrompt } from '@/ai/prompt/scenario/advice';
import { createClient } from "@supabase/supabase-js";
import { Message } from '@/ai/utils/getStreamResponse';
import createSupabaseServerClient from '@/lib/supabase/server';
import { jsonrepair } from 'jsonrepair';
import { EntryContent } from '@/types/entries';
import { detectUserLanguage } from '@/lib/language-utils';
import { Provider } from '@/ai/utils/getApiConfig';

type ProcessedEntryContent = Partial<EntryContent>;


type KeyQuote = {
  quote: string;
  type: string;
}


export const runtime = 'edge';

// 创建具有管理员权限的Supabase客户端
const createSupabaseAdminClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('缺少Supabase URL或Service Role Key。请检查环境变量NEXT_PUBLIC_SUPABASE_URL和NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY。')
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY)
}

export async function POST(req: NextRequest) {
  try {
    // 移除 _internal_call，安全验证改由请求头完成
    const { day_id, created_date, entry_contents, type = 'emotion', _user_id } = await req.json();

    if (!day_id || !created_date) {
      console.error('缺少day_id或created_date');
      return NextResponse.json(
        { success: false, error: 'Missing day_id or created_date' },
        { status: 400 }
      );
    }

    // 验证type参数
    if (!['emotion', 'advice'].includes(type)) {
      console.error('无效的type参数:', type);
      return NextResponse.json(
        { success: false, error: 'Invalid type parameter. Must be "emotion" or "advice"' },
        { status: 400 }
      );
    }

    // 检测用户语言偏好
    const userLanguage = detectUserLanguage(req);
    console.log(`[${type === 'emotion' ? 'Emotion Analysis' : 'Advice Generation'}] Detected user language: ${userLanguage}`);

    let supabase;
    let userId: string;
    let isInternalCall = false;

    // 安全检查：用秘密密钥验证内部调用
    const authHeader = req.headers.get('Authorization');
    const internalApiSecret = process.env.SUPABASE_INTERNAL_API_ADMIN_AUTH_SECRET;

    if (!internalApiSecret) {
      console.error('CRITICAL SECURITY_ERROR: SUPABASE_INTERNAL_API_ADMIN_AUTH_SECRET is not set. All internal calls will be rejected.');
    }

    // 检查是否是合法的内部调用
    if (authHeader && authHeader.startsWith('Bearer ') && internalApiSecret && authHeader.substring(7) === internalApiSecret) {
      
      isInternalCall = true;

      if (!_user_id) {
        return NextResponse.json({ error: '内部调用缺少 _user_id' }, { status: 400 });
      }

      supabase = createSupabaseAdminClient();
      userId = _user_id;

      // 验证用户是否存在
      const { error: userError } = await supabase
        .from('users')
        .select('auid') // 使用正确的列名 'auid'
        .eq('auid', userId) // 使用正确的列名 'auid'
        .single();
        
      if (userError) {
        return NextResponse.json({ error: `用户不存在: ${_user_id}` }, { status: 404 });
      }

    } else {
      // 公开调用
      supabase = await createSupabaseServerClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: '未授权访问' }, { status: 401 });
      }

      userId = user.id;
      
      // 非内部调用需要验证 day_id 是否属于用户
      const { data: validEntry, error: validationError } = await supabase
        .from('entries')
        .select('user_id')
        .eq('day_id', day_id)
        .eq('user_id', userId)
        .single();

      if (validationError || !validEntry) {
        return NextResponse.json({ error: '无效的day_id或无权限访问' }, { status: 403 });
      }
    }


    const langCount: Record<string, number> = {};
    const processedContents: ProcessedEntryContent[] = [];

    (entry_contents || []).forEach((item: any) => {
      const lang = item.language || 'en';
      langCount[lang] = (langCount[lang] || 0) + 1;

      const processedItem: ProcessedEntryContent = {};
      if (item.euuid) processedItem.euuid = item.euuid;
      if (item.summary) {
        processedItem.summary = item.summary;
      } else if (item.summary_en) {
        processedItem.summary_en = item.summary_en;
      }
      if (item.tags) {
        processedItem.tags = item.tags.map((tag: string) => tag.trim()).join(',');
      }
      if (item.reflection_explanation) {
        processedItem.reflection_explanation = item.reflection_explanation;
      }
      if (item.reflection_types) {
        processedItem.reflection_types = item.reflection_types.join(',');
      }
      if (item.key_quotes) {
        processedItem.key_quotes = item.key_quotes.map((q: KeyQuote) => q.quote.trim());
      }


      processedContents.push(processedItem);
    });

    // 使用检测到的用户语言，而不是从内容中统计语言
    // const majorityLanguage = Object.entries(langCount).reduce((a, b) => (b[1] > a[1] ? b : a))[0];

    // 构造最终结构并序列化
    const aiInputPayload = {
      language: userLanguage,
      data: processedContents
    };
    const contentForAI = JSON.stringify(aiInputPayload);
    // 创建消息
    const messages: Message[] = [{ role: 'user', content: contentForAI }];

    // 根据type和用户语言选择对应的提示
    let action: string;
    let provider: Provider = 'deepseek';
    if (type === 'emotion') {
      action = dailyEmotionAnalysisPrompt.en;
    } else {
      action = adviceGenerationPrompt.en;
      provider = 'deepseek_r1'
    }

    // 生成AI响应流
    const aiResponseStream = await generateReply({
      provider,
      action,
      messages
    });
    // 创建一个Reader处理流数据
    const reader = aiResponseStream.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulatedResponse = '';

    // 创建一个新的TransformStream仅用于转发数据给客户端
    const passthroughStream = new TransformStream({
      transform(chunk, controller) {
        // 直接将数据块转发给客户端
        controller.enqueue(chunk);
      }
    });

    // 异步处理流读取和数据处理
    const processStream = async () => {
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          // 累积完整响应文本
          accumulatedResponse += decoder.decode(value, { stream: true });

          // 将数据块写入转发流
          const writer = passthroughStream.writable.getWriter();
          await writer.write(value);
          writer.releaseLock();
        }
      }
      // 流结束后，关闭转发流
      const writer = passthroughStream.writable.getWriter();
      await writer.close();
      writer.releaseLock();

      // 在流结束后处理累积的数据
      let aiData = {};
      let jsonParseError = null;
      try {
        // 新增：直接拼接所有content字段内容
        const lines = accumulatedResponse.split('\n');
        let allContent = '';
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'content' && parsed.content) {
              allContent += parsed.content;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
        // console.log('allContent', allContent)
        // 优先从 Markdown JSON 代码块提取
        const codeBlockMatch = allContent.match(/```json([\s\S]*?)```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          const jsonText = codeBlockMatch[1].trim();
          try {
            // 使用 jsonrepair 替代 dirtyJSON.parse，确保JSON格式正确
            const repairedJson = jsonrepair(jsonText);
            aiData = JSON.parse(repairedJson);
          } catch (e) {
          }
        } else {
          const objMatch = allContent.match(/\{[\s\S]*\}/);
          if (objMatch) {
            const jsonText = objMatch[0];
            try {
              // 使用 jsonrepair 替代 dirtyJSON.parse，确保JSON格式正确
              const repairedJson = jsonrepair(jsonText);
              aiData = JSON.parse(repairedJson);
            } catch (e) {
              console.error('从大括号提取JSON失败:', e, '原始jsonText:', jsonText);
            }
          } else {
            console.warn('未能从content拼接内容中提取到JSON对象');
          }
        }
      } catch (e) {
        jsonParseError = e;
        console.error('解析最终JSON失败:', e);
      }

      // 如果成功解析出数据，则更新数据库
      if (Object.keys(aiData).length > 0) {
        try {
          if (type === 'emotion') {
            // 情绪分析：直接更新整个analysis_data
            let updateQuery = supabase
              .from('entries')
              .update({
                analysis_data: aiData,
                updated_at: new Date().toISOString()
              })
              .eq('day_id', day_id);
            
            // 公开调用时，必须匹配用户ID以遵循RLS
            if (!isInternalCall) {
              updateQuery = updateQuery.eq('user_id', userId);
            }
            
            const { error: updateError } = await updateQuery;

            if (updateError) {
              console.error('情绪分析数据库更新失败:', updateError);
            } 
          } else {
            // 建议生成：只更新encouragement_and_suggestions字段
            // 首先获取现有的analysis_data
            let queryBuilder = supabase
              .from('entries')
              .select('analysis_data')
              .eq('day_id', day_id);
            
            // 公开调用时，必须匹配用户ID
            if (!isInternalCall) {
              queryBuilder = queryBuilder.eq('user_id', userId);
            }
            
            const { data: existingEntry, error: queryError } = await queryBuilder.single();

            if (queryError) {
              console.error('查询现有分析数据失败:', queryError);
              return;
            }

            // 合并数据：保留现有的analysis_data，只更新encouragement_and_suggestions
            // AI返回的格式是: { "responses": [{ "type": "...", "content": "..." }, ...] }
            const responses = (aiData as any).responses || [];
            const updatedAnalysisData = {
              ...(existingEntry?.analysis_data || {}),
              encouragement_and_suggestions: responses.map((response: any) => ({
                type: response.type,
                content: response.content
              }))
            };
            // console.log('准备更新的encouragement_and_suggestions:', updatedAnalysisData.encouragement_and_suggestions);

            let suggestionUpdateQuery = supabase
              .from('entries')
              .update({
                analysis_data: updatedAnalysisData,
                updated_at: new Date().toISOString()
              })
              .eq('day_id', day_id);
            
            // 公开调用时，必须匹配用户ID
            if (!isInternalCall) {
              suggestionUpdateQuery = suggestionUpdateQuery.eq('user_id', userId);
            }
            
            const { error: updateError } = await suggestionUpdateQuery;

            if (updateError) {
              console.error('建议数据库更新失败:', updateError);
            }
          }
        } catch (dbError) {
          console.error('数据库操作时出错:', dbError);
        }
      } else {
        console.warn('未解析到有效JSON数据，不更新数据库');
      }
    };

    // 添加超时保护和更好的错误处理
    const processStreamWithTimeout = async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('流处理超时')), 120000); // 120秒超时
      });

      try {
        await Promise.race([processStream(), timeoutPromise]);
      } catch (error) {
        console.error('异步流处理失败:', error);
        // 不抛出错误，避免影响客户端响应
      }
    };

    // 启动异步处理，使用 setTimeout 确保在 serverless 环境中异步操作有机会完成
    setTimeout(() => {
      processStreamWithTimeout().catch(err => {
        console.error('处理流过程中发生未捕获错误:', err);
      });
    }, 600);

    return new NextResponse(passthroughStream.readable, {
      headers: { 'Content-Type': 'text/event-stream' }
    }); 

  } catch (error) {
    console.error('API整体处理出错:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
