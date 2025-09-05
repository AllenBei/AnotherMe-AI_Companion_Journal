/*
 * @Author: Allen Bei
 * @Date: 2025-04-11 16:17:00
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-06-25 12:16:54
 * @FilePath: /AnotherMe_AI_Web/app/api/talk/entries/route.ts
 * @Description: API endpoint for generating deep reflection questions and updating entry_contents
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
import { generateReply } from '@/ai/services/generateReply';
import { NextRequest, NextResponse } from 'next/server';
import { entrySummarizerPrompt } from '@/ai/prompt/scenario/interaction';
import { htmlToPlainTextServer } from '@/lib/server-utils';
import { Message } from '@/ai/utils/getStreamResponse';
import createSupabaseServerClient from '@/lib/supabase/server';

interface AIAnalysisData extends Partial<EntryAISummaryItem> { }

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '用户未认证' }, { status: 401 });
    }

    const { content, euuid } = await req.json();
    // Convert HTML content to plain text (only user content for analysis)
    const plainTextContent = htmlToPlainTextServer(content);

    // Skip processing if content is too short
    if (!plainTextContent || plainTextContent.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Content too short' },
        { status: 400 }
      );
    }
    console.log('plainTextContent', plainTextContent);
    // Create messages for the AI
    const messages: Message[] = [{ role: 'user', content: plainTextContent }];

    // Use the guide question prompt as input
    const action = entrySummarizerPrompt;

    // Generate the AI response
    const aiResponse = await generateReply({
      provider: 'deepseek',
      action,
      messages
    });

    // If euuid is provided, process the stream and update the database
    if (euuid) {
      try {
        // Create a reader to process the stream
        const reader = aiResponse.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        let questionText = '';
        let jsonContent = '';
        let aiData: AIAnalysisData = {};

        while (!done) {
          try {
            const { value, done: readerDone } = await reader.read();

            if (value) {
              const decodedValue = decoder.decode(value);
              // console.log('Decoded chunk:', decodedValue);

              try {
                // Split the chunk into individual JSON objects
                const jsonStrings = decodedValue.split(/\n+/).filter(str => str.trim());

                for (const jsonStr of jsonStrings) {
                  try {
                    // Parse each JSON string
                    const streamResponse = JSON.parse(jsonStr);

                    // Process content chunks
                    if (streamResponse.type === 'content') {
                      const content = streamResponse.content || '';
                      questionText += content;

                      // Look for JSON code blocks
                      if (content.includes('```json')) {
                        // Start of JSON block
                        const jsonStart = content.indexOf('```json') + 7;
                        if (jsonStart < content.length) {
                          jsonContent += content.substring(jsonStart);
                        }
                      } else if (content.includes('```') && jsonContent) {
                        // End of JSON block
                        const jsonEnd = content.indexOf('```');
                        if (jsonEnd > 0) {
                          jsonContent += content.substring(0, jsonEnd);
                        }
                        // console.log('JSON content extracted:', jsonContent);

                        // Try to parse the complete JSON content
                        try {
                          const cleanedJson = jsonContent.trim();
                          console.log('Attempting to parse JSON:', cleanedJson);

                          if (cleanedJson) {
                            aiData = JSON.parse(cleanedJson);
                            // console.log('Successfully parsed AI data:', aiData);
                          }
                        } catch (jsonError) {
                          console.error('Error parsing JSON:', jsonError);
                        }
                      } else if (jsonContent) {
                        // Inside JSON block, accumulate content
                        jsonContent += content;
                      }
                    }
                  } catch (innerError) {
                    console.error('Error parsing individual JSON:', jsonStr, innerError);
                  }
                }
              } catch (parseError) {
                console.error('Error processing stream chunks:', parseError);
              }
            }

            done = readerDone;
          } catch (error) {
            console.error('Error reading stream:', error);
            done = true;
          }
        }

        // console.log('Final questionText:', questionText);
        // console.log('Final JSON content:', jsonContent);

        // If we didn't extract JSON from code blocks, try to find it in the complete response
        if (!aiData.language && jsonContent === '') {
          // Try to extract JSON from the complete response
          const jsonMatch = questionText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              aiData = JSON.parse(jsonMatch[0]);
              console.log('Extracted JSON from complete response:', aiData);
            } catch (jsonError) {
              console.error('Error parsing extracted JSON:', jsonError);
            }
          }
        }

        // Get Supabase client and update the database
        if (Object.keys(aiData).length > 0) {
          // Update entry_contents with AI analysis results
          const { error: updateAiError } = await supabase
            .from('entry_contents')
            .update({
              status: 'analysed', // Update status to 'analysed'
              language: aiData.language,
              icon: aiData.icon || null,
              content_type: aiData.content_type,
              title: aiData.title,
              summary: aiData.summary,
              summary_en: aiData.summary_en,
              tags: aiData.tags,
              is_reflective: aiData.is_reflective,
              reflection_types: aiData.reflection_types || null,
              reflection_explanation: aiData.reflection_explanation || null,
              key_quotes: aiData.key_quotes || null,
              insight_path: aiData.insight_path || null,
              analogy: aiData.analogy || null,
            })
            .eq('euuid', euuid)
            .eq('user_id', user.id); // <-- 增加用户ID校验
          if (updateAiError) {
            console.error('Failed to update AI analysis results:', updateAiError);
            return NextResponse.json(
              { success: false, error: 'Failed to update AI analysis results' },
              { status: 500 }
            );
          }

          return NextResponse.json({ success: true, data: aiData });
        } else {
          console.error('No valid AI data extracted from response');
          return NextResponse.json(
            { success: false, error: 'Failed to extract AI analysis data' },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error('Error processing AI response:', error);
        return NextResponse.json(
          { success: false, error: 'Error processing AI response' },
          { status: 500 }
        );
      }
    } else {
      // If euuid is not provided, just return the stream response
      return new NextResponse(aiResponse, {
        headers: { 'Content-Type': 'text/event-stream' }
      });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
