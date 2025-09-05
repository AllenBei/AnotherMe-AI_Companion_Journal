// /ai/utils/getStreamResponse.ts
import { createParser, ParserCallbacks, EventSourceMessage } from 'eventsource-parser'

export interface Message {
    role: string
    content: string
}

// 定义流式响应的数据结构
export interface StreamResponse {
    content?: string;
    reasoning?: string;
    type?: 'content' | 'reasoning';
}

export async function getStreamResponse(
    apiUrl: string,
    apiKey: string,
    model: string,
    messages: Message[]
) {
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const res = await fetch(apiUrl, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'api-key': `${apiKey}`
        },
        method: 'POST',
        body: JSON.stringify({
            model,
            messages,
            stream: true,
            max_tokens: 4000,
            temperature: 0.75,
            top_p: 0.9,       
            frequency_penalty: 0.35, 
            presence_penalty: 0.65,  
        }),
        signal: AbortSignal.timeout(180000)
    })

    if (res.status !== 200) {
        const responseBody = await res.text()
        console.error(`OpenAI API response error: ${responseBody}`)
        throw new Error(
            `API error ${res.status}: ${responseBody}`
        )
    }

    return new ReadableStream({
        async start(controller) {
            let isControllerClosed = false; 
            let hasError = false;
            
            const safeClose = () => {
                if (!isControllerClosed && !hasError) {
                    isControllerClosed = true;
                    controller.close();
                    console.log('Controller安全关闭');
                }
            };

            // 安全抛出错误的辅助函数
            const safeError = (error: any) => {
                if (!isControllerClosed && !hasError) {
                    hasError = true;
                    isControllerClosed = true;
                    controller.error(error);
                    console.error('Controller错误关闭:', error);
                }
            };
            
            const parserCallbacks: ParserCallbacks = {
                onEvent: (event: EventSourceMessage) => {
                    if (hasError || isControllerClosed) return;
                    
                    if (event.data === '[DONE]') {
                        console.log('AI流响应完成 - 收到[DONE]信号');
                        safeClose();
                        return
                    }

                    try {
                        const data = event.data
                        const parsedData = JSON.parse(data)
                        // 检查是否有choices
                        if (parsedData.choices && parsedData.choices.length > 0) {
                            const choice = parsedData.choices[0]
                            const delta = choice.delta
                            // 处理content字段
                            if (delta.content !== undefined) {
                                const response: StreamResponse = {
                                    content: delta.content,
                                    type: 'content'
                                }
                                // 确保每个JSON对象单独一行，避免解析错误
                                if (!isControllerClosed) {
                                    controller.enqueue(encoder.encode(JSON.stringify(response) + '\n'))
                                }
                            }

                            // 处理reasoning_content字段
                            if (delta.reasoning_content !== undefined) {
                                const response: StreamResponse = {
                                    reasoning: delta.reasoning_content,
                                    type: 'reasoning'
                                }
                                // 确保每个JSON对象单独一行，避免解析错误
                                if (!isControllerClosed) {
                                    controller.enqueue(encoder.encode(JSON.stringify(response) + '\n'))
                                }
                            }

                            // 处理完成原因
                            if (choice.finish_reason === 'stop') {
                                console.log('AI流响应完成 - finish_reason: stop');
                                // 不在这里关闭，让[DONE]信号或循环结束来处理
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing event data:', e)
                        safeError(e);
                    }
                }
            }

            const parser = createParser(parserCallbacks)

            try {
                // 延长超时时间以支持长时间的reasoning
                const timeoutId = setTimeout(() => {
                    if (!isControllerClosed && !hasError) {
                        console.warn('流读取超时，强制关闭 (180秒)');
                        safeError(new Error('Stream timeout after 180 seconds'));
                    }
                }, 180000); // 180秒超时，给reasoning更多时间

                for await (const chunk of res.body as any) {
                    if (hasError || isControllerClosed) break;
                    
                    const str = decoder.decode(chunk).replace('[DONE]\n', '[DONE]\n\n')
                    parser.feed(str)
                }

                clearTimeout(timeoutId);
                
                // 如果循环正常结束且Controller未关闭，则安全关闭
                if (!isControllerClosed && !hasError) {
                    console.log('流数据读取循环完成');
                    safeClose();
                }
            } catch (error) {
                console.error('流读取过程中出错:', error);
                safeError(error);
            }
        }
    })
}