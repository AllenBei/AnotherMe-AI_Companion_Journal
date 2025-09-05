/*
 * @Author: Allen Bei
 * @Date: 2025-03-10 17:15:49
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-06-27 10:55:33
 * @FilePath: /AnotherMe_AI_Web/app/entries/new/page.tsx
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ChevronLeft, MoreVertical, Trash2 } from "lucide-react"
import Link from "next/link"
import Layout from '@/app/components/Layout'
import { RichTextEditor, RichTextEditorRef } from '@/components/rich-text-editor'
import { getPageInfo } from '@/app/templates/journal-templates'
import { filterUserContent, generateNewEntryEuuid, getTodayDate } from "@/lib/utils"
import { toast } from 'sonner'
import { useI18n } from '@/app/i18n'
import { ConfirmDialog } from '@/components/confirm-dialog'


// 封装获取 day_id 的函数
const getDayId = async (todayDate: string) => {
  // 首先从 sessionStorage 中获取 day_id
  const day_id = sessionStorage.getItem('day_id');
  if (day_id) {
    return day_id; // 如果存在，直接返回
  }

  // 如果不存在，进行 API 查询
  const checkResponse = await fetch(`/api/entries?start_date=${todayDate}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  const checkResult = await checkResponse.json();

  // 如果存在当天的日记，则返回其 day_id
  if (checkResult.success && checkResult.data && checkResult.data.length > 0) {
    return checkResult.data[0].day_id;
  }
  return null; // 如果没有找到，返回 null
}

function NewEntryPageContent() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const router = useRouter()
  const type = searchParams.get('type') || 'snippet'
  const euuid = searchParams.get('euuid') || generateNewEntryEuuid()
  const isEdit = !!searchParams.get('euuid')

  // 在组件的状态中添加原始内容
  const [originalContent, setOriginalContent] = useState<string>(""); // 假设 content 是传入的初始内容
  const [content, setContent] = useState("")
  const [userContent, setUserContent] = useState("") // 追踪用户原始内容，不包含AI生成的部分
  const [isEditorFocused, setIsEditorFocused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoingDeeper, setIsGoingDeeper] = useState(false)
  const [isPositive, setIsPositive] = useState(false)
  const [isStory, setIsStory] = useState(false)
  const [isLoading, setIsLoading] = useState(isEdit) // 如果有euuid参数，表示是编辑模式，需要先加载内容
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<RichTextEditorRef>(null)
  const fetchContentExecutedRef = useRef(false) // 新增：追踪是否已执行过fetchContent

  // AI related
  const [reasoningText, setReasoningText] = useState('')

  // Toast management for reasoning text
  const toastIdRef = useRef<string | number | undefined>(undefined);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 获取页面信息
  const pageInfoObj = getPageInfo(t);
  const pageInfo = pageInfoObj[type as keyof typeof pageInfoObj] || pageInfoObj.snippet as { title: string; placeholder: string; buttonClass: string; template: string; backgroundImg: string | null };

  // 计算字数
  const countWords = (htmlContent: string) => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    const text = tempDiv.textContent || ""
    return text.trim().length
  }


  useEffect(() => {
    if (reasoningText.length === 0) return;

    // 处理 toast 显示"思考中"
    if (toastIdRef.current) {
      toast.message(t('toaster.thinking'), {
        id: toastIdRef.current,
        duration: Infinity,
      });
    } else {
      toastIdRef.current = toast.message(t('toaster.thinking'), {
        duration: Infinity,
      });
    }

    // 清除旧的 dismiss timer
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    // 设置 1 秒后更新为"想到了"
    const changeTimer = setTimeout(() => {
      if (toastIdRef.current) {
        toast.message(t('toaster.gotIt'), {
          id: toastIdRef.current,
          duration: 1000,
        });

        dismissTimerRef.current = setTimeout(() => {
          toast.dismiss(toastIdRef.current!);
          toastIdRef.current = undefined;
        }, 1000);
      }
    }, 1000);

    // 清理 changeTimer
    return () => {
      clearTimeout(changeTimer);
    };
  }, [reasoningText, t]);

  // 根据euuid加载内容
  useEffect(() => {
    const fetchContent = async () => {
      if (!isEdit) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/entries/edit?euuid=${euuid}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const result = await response.json();

        if (result.success && result.data && result.data.content) {
          // 清空编辑器内容，然后设置新内容
          setContent("");
          setTimeout(() => {
            setContent(result.data.content);
            setOriginalContent(result.data.content);
          }, 50);
        } else {
          console.error('获取内容失败:', result.error);
          // 如果获取失败，则使用模板内容
          if (pageInfo.template) {
            setContent(pageInfo.template);
          }
        }
      } catch (error) {
        console.error('获取内容失败:', error);
        if (pageInfo.template) {
          setContent(pageInfo.template);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // 只在组件挂载时获取一次内容
    if (isEdit && !fetchContentExecutedRef.current) {
      fetchContentExecutedRef.current = true;
      fetchContent();
    }
  }, [euuid, isEdit, pageInfo?.template]); // 添加pageInfo.template为可选链


  // 处理提交
  const handleSubmit = async () => {
    if (isSubmitting) return

    // 检查 filteredContent 是否与 originalContent 一致
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const tipElements = tempDiv.querySelectorAll('.template-tips');
    if (tipElements.length > 0) {
      tipElements.forEach(el => el.remove());
    }
    const filteredContent = tempDiv.innerHTML;

    // 如果内容一致，按钮置灰
    if (filteredContent === originalContent) {
      // 这里可以设置按钮的状态为不可点击
      toast.error(t('toaster.noChanges'), {
        icon: '😢'
      })
      return; // 直接返回，不执行后续逻辑
    }

    setIsSubmitting(true);

    try {
      // 使用过滤后的内容
      const filteredContent = tempDiv.innerHTML

      // 如果是编辑模式，直接更新内容
      if (isEdit) {
        const response = await fetch('/api/entries/edit', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            euuid,
            content: filteredContent
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || '更新失败');
        }

        toast.success(t('toaster.saveSuccess'), {
          icon: '😄'
        });
        summarizeEntry({
          content: filteredContent,
          euuid: euuid,
        })
        setTimeout(() => {
          router.push('/');
        }, 1000);
        return;
      }

      // 准备要保存的内容对象（新建模式）
      const contentObj = {
        euuid, // 每个content都有自己的euuid
        type,
        content: filteredContent,
        words_written: countWords(filteredContent),
        tags: null,
        icon: null,
      }

      // 获取当前年份作为created_year
      const currentYear = new Date().getFullYear().toString()
      const todayDate = getTodayDate()
      // 获取 day_id
      const day_id = await getDayId(todayDate);
      
      // 新增：获取客户端时区，这是确保日记日期正确的关键
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // 如果 sessionStorage 中没有 day_id，则请求获取当天的日记数据
      let entryData: any = {
        entry_contents: contentObj,
        created_year: currentYear,
        day_id,
        timezone: timezone, // 新增：将时区信息包含在请求体中
      };
      // 使用PUT方法创建或更新日记
      const response = await fetch('/api/entries', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '保存失败')
      }
      // 保存成功后，如果内容足够长，调用AI分析
      if (filteredContent.length > 20) {
        // 显示AI分析正在进行的提示
        toast.success(t('toaster.analyzing') + t('toaster.saveSuccess'), {
          icon: '😄',
          duration: 1500
        })

        summarizeEntry({
          content: filteredContent,
          euuid: euuid
        })
      } else {
        // 内容太短，仅显示保存成功
        toast.success(t('toaster.saveSuccess'), {
          icon: '😄'
        })
      }

      // 1秒后跳转到首页
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } catch (error) {
      console.error('保存日记失败:', error)
      toast.error(t('toaster.saveFailed'), {
        icon: '😢'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const summarizeEntry = async ({ content, euuid }: { content: string, euuid: string }) => {
    // 保存成功后，如果内容足够长，调用AI分析
    if (content.length > 20) {
      try {
        // 设置分析状态为进行中
        sessionStorage.setItem('analysis_pending', 'true');
        sessionStorage.setItem('analysis_euuid', euuid);
        sessionStorage.setItem('analysis_timestamp', Date.now().toString());

        const userOnlyContent = filterUserContent(content)
        
        // // 异步调用AI分析API
        const response = await fetch('/api/talk/entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: userOnlyContent, // 只发送用户原始内容用于分析
            fullContent: content, // 保留完整内容用于备份
            euuid,
          }),
        });

        // 分析已完成(无论成功失败)
        sessionStorage.setItem('analysis_pending', 'false');

        if (response.ok) {
          // 分析成功，设置分析状态为已完成
          sessionStorage.setItem('analysis_completed', 'true');
        } else {
          // 分析失败
          sessionStorage.setItem('analysis_failed', 'true');
        }
      } catch (error) {
        console.error('AI分析请求失败:', error);
        // 分析失败，也设置状态
        sessionStorage.setItem('analysis_pending', 'false');
        sessionStorage.setItem('analysis_failed', 'true');
      }
    }
  }

  // 处理深入对话
  const handleGoDeeper = async () => {
    if (isGoingDeeper) return
    setIsGoingDeeper(true)

    try {
      console.log("go deeper")

      // 获取当前富文本内容并清理AI生成的内容
      const currentContent = filterUserContent(content || '')

      // 调用AI服务生成深度问题
      const response = await fetch('/api/talk/deeper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: currentContent, type: 'deeper' }),
      })
      // console.log('response', response)
      if (!response.ok) {
        throw new Error('Failed to generate question')
      }

      const data = response.body
      if (!data) {
        throw new Error('No data returned')
      }

      // 处理流式响应
      const reader = data.getReader()
      const decoder = new TextDecoder('utf-8')
      let done = false
      let questionText = ''
      // let reasoningText = ''
      setReasoningText('')

      while (!done) {
        try {
          const { value, done: readerDone } = await reader.read()
          if (value) {
            const decodedValue = decoder.decode(value)
            try {
              // 处理可能包含多个JSON对象的情况
              const jsonStrings = decodedValue.split(/\n+/).filter(str => str.trim())

              for (const jsonStr of jsonStrings) {
                try {
                  const streamResponse = JSON.parse(jsonStr)
                  // console.log('streamResponse', streamResponse)

                  // 处理内容类型
                  if (streamResponse.type === 'content' 
                    && streamResponse.content !== undefined 
                    && streamResponse.content !== null 
                    && streamResponse.content !== 'null'
                    && streamResponse.content !== '') {
                    questionText += streamResponse.content
                  }

                  // 处理推理内容（可以存储但不展示）
                  if (streamResponse.type === 'reasoning' 
                    && streamResponse.reasoning !== undefined
                    && streamResponse.reasoning !== null
                    && streamResponse.reasoning !== 'null'
                    && streamResponse.reasoning !== ''
                  ) {
                    setReasoningText(prev => prev + streamResponse.reasoning)
                  }
                } catch (innerError) {
                  console.error('Error parsing individual JSON:', jsonStr, innerError)
                }
              }
            } catch (parseError) {
              console.error('Error processing stream chunks:', parseError)
            }
          }

          done = readerDone
        } catch (error) {
          console.error('Error reading stream:', error)
          done = true
        }
      }

      console.log('Final question text:', questionText)

      // 将生成的问题添加到编辑器中
      if (questionText.trim() && editorRef.current) {
        // 将 **text** 格式转换为 <strong>text</strong> HTML 标签
        const formattedText = questionText.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        
        // 使用新的appendContentByMode方法添加内容，根据模式选择模板类型
        editorRef.current.appendContentByMode(formattedText, 'deeper')
      }
    } catch (error) {
      console.error('生成问题失败:', error)
      toast.error(t('toaster.generateQuestionFailed'), {
        icon: '😢'
      })
    } finally {
      setIsGoingDeeper(false)
    }
  }

  // 处理正能量模式
  const handlePositive = async () => {
    if (isPositive) return
    setIsPositive(true)

    try {
      console.log("positive mode")

      // 获取当前富文本内容并清理AI生成的内容
      const currentContent = filterUserContent(content || '')

      // 调用AI服务生成正能量回复
      const response = await fetch('/api/talk/deeper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: currentContent, type: 'positive' }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate positive response')
      }

      const data = response.body
      if (!data) {
        throw new Error('No data returned')
      }

      // 处理流式响应
      const reader = data.getReader()
      const decoder = new TextDecoder('utf-8')
      let done = false
      let responseText = ''
      setReasoningText('')

      while (!done) {
        try {
          const { value, done: readerDone } = await reader.read()
          if (value) {
            const decodedValue = decoder.decode(value)
            try {
              // 处理可能包含多个JSON对象的情况
              const jsonStrings = decodedValue.split(/\n+/).filter(str => str.trim())

              for (const jsonStr of jsonStrings) {
                try {
                  const streamResponse = JSON.parse(jsonStr)

                  // 处理内容类型
                  if (streamResponse.type === 'content' 
                    && streamResponse.content !== undefined 
                    && streamResponse.content !== null 
                    && streamResponse.content !== 'null'
                    && streamResponse.content !== '') {
                    responseText += streamResponse.content
                  }

                  // 处理推理内容
                  if (streamResponse.type === 'reasoning' 
                    && streamResponse.reasoning !== undefined
                    && streamResponse.reasoning !== null
                    && streamResponse.reasoning !== 'null'
                    && streamResponse.reasoning !== ''
                  ) {
                    setReasoningText(prev => prev + streamResponse.reasoning)
                  }
                } catch (innerError) {
                  console.error('Error parsing individual JSON:', jsonStr, innerError)
                }
              }
            } catch (parseError) {
              console.error('Error processing stream chunks:', parseError)
            }
          }

          done = readerDone
        } catch (error) {
          console.error('Error reading stream:', error)
          done = true
        }
      }

      // console.log('Final positive response:', responseText)

      // 将生成的回复添加到编辑器中
      if (responseText.trim() && editorRef.current) {
        // 将 **text** 格式转换为 <strong>text</strong> HTML 标签
        const formattedText = responseText.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        
        // 使用新的appendContentByMode方法添加内容，根据模式选择模板类型
        editorRef.current.appendContentByMode(formattedText, 'positive')
      }
    } catch (error) {
      console.error('生成正能量回复失败:', error)
      toast.error(t('toaster.generateQuestionFailed'), {
        icon: '😢'
      })
    } finally {
      setIsPositive(false)
    }
  }

  // 处理故事模式
  const handleStory = async () => {
    if (isStory) return
    setIsStory(true)

    try {
      console.log("story mode")

      // 获取当前富文本内容并清理AI生成的内容
      const currentContent = filterUserContent(content || '')

      // 调用AI服务生成故事回复
      const response = await fetch('/api/talk/deeper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: currentContent, type: 'story' }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate story response')
      }

      const data = response.body
      if (!data) {
        throw new Error('No data returned')
      }

      // 处理流式响应
      const reader = data.getReader()
      const decoder = new TextDecoder('utf-8')
      let done = false
      let responseText = ''
      setReasoningText('')

      while (!done) {
        try {
          const { value, done: readerDone } = await reader.read()
          if (value) {
            const decodedValue = decoder.decode(value)
            try {
              // 处理可能包含多个JSON对象的情况
              const jsonStrings = decodedValue.split(/\n+/).filter(str => str.trim())

              for (const jsonStr of jsonStrings) {
                try {
                  const streamResponse = JSON.parse(jsonStr)

                  // 处理内容类型
                  if (streamResponse.type === 'content' 
                    && streamResponse.content !== undefined 
                    && streamResponse.content !== null 
                    && streamResponse.content !== 'null'
                    && streamResponse.content !== '') {
                    responseText += streamResponse.content
                  }

                  // 处理推理内容
                  if (streamResponse.type === 'reasoning' 
                    && streamResponse.reasoning !== undefined
                    && streamResponse.reasoning !== null
                    && streamResponse.reasoning !== 'null'
                    && streamResponse.reasoning !== ''
                  ) {
                    setReasoningText(prev => prev + streamResponse.reasoning)
                  }
                } catch (innerError) {
                  console.error('Error parsing individual JSON:', jsonStr, innerError)
                }
              }
            } catch (parseError) {
              console.error('Error processing stream chunks:', parseError)
            }
          }

          done = readerDone
        } catch (error) {
          console.error('Error reading stream:', error)
          done = true
        }
      }

      console.log('Final story response:', responseText)

      // 将生成的回复添加到编辑器中
      if (responseText.trim() && editorRef.current) {
        // 将 **text** 格式转换为 <strong>text</strong> HTML 标签
        const formattedText = responseText.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        
        // 使用新的appendContentByMode方法添加内容，根据模式选择模板类型
        editorRef.current.appendContentByMode(formattedText, 'story')
      }
    } catch (error) {
      console.error('生成故事回复失败:', error)
      toast.error(t('toaster.generateQuestionFailed'), {
        icon: '😢'
      })
    } finally {
      setIsStory(false)
    }
  }

  // 初始化模板内容
  useEffect(() => {
    // 如果不是编辑模式，且内容为空，则设置模板
    if (!isEdit && !content && pageInfo.template && !isLoading) {
      setContent(pageInfo.template)
    }
  }, [type, pageInfo.template, content, isEdit, isLoading])

  // 关闭菜单的处理函数
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsMenuOpen(false)
    }
  }

  // 添加全局点击事件监听，以便在点击外部时关闭菜单
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 切换菜单开关
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // 显示删除确认弹窗
  const showDeleteConfirm = () => {
    setIsMenuOpen(false) // 关闭菜单
    setIsDeleteConfirmOpen(true)
  }

  // 取消删除操作
  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false)
  }

  // 确认并执行删除
  const confirmDelete = async () => {
    if (isDeleting || !isEdit) return
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/entries?euuid=${euuid}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success(t('entries.deleteSuccess'))
        // 成功删除后返回首页
        setTimeout(() => {
          setIsDeleteConfirmOpen(false)
          router.push('/')
        }, 1000)
      } else {
        throw new Error(result.error || t('toaster.deleteFailed'))
      }
    } catch (error) {
      console.error('删除条目失败:', error)
      toast.error(error instanceof Error ? error.message : t('toaster.deleteFailed'))
      setIsDeleting(false)
      setIsDeleteConfirmOpen(false)
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#F6F5F1] flex items-center justify-center">
          <div className="loader"></div>
          <style jsx>{`
            .loader {
              border: 5px solid #f3f3f3;
              border-top: 5px solid #183861;
              border-radius: 50%;
              width: 50px;
              height: 50px;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="min-h-screen bg-[#F6F5F1] pb-20 bg-cover bg-center bg-no-repeat relative"
        style={{
          backgroundImage: `url(${(pageInfo as { backgroundImg: string | null }).backgroundImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* 添加一个半透明的遮罩层，确保内容可读性 */}
        <div className="absolute inset-0 bg-white bg-opacity-30"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          {/* 标题区域 - 只在编辑器未获得焦点时显示 */}
          <div className={`transition-all duration-300 ${isEditorFocused ? 'h-0 opacity-0 overflow-hidden' : 'h-16 opacity-100'}`}>
            <div className="flex items-center justify-between h-full">
              <Link href="/" className="flex items-center">
                <ChevronLeft className="w-6 h-6 text-[#075071]" />
              </Link>
              <h1 className="text-2xl font-bold text-[#075071] my-0 flex-grow text-center">
                {pageInfo.title}
              </h1>
              {isEdit && (
                <div className="relative">
                  <button
                    onClick={toggleMenu}
                    className="text-gray-500 hover:text-[#075071] transition-colors"
                  >
                    <MoreVertical className="w-6 h-6" />
                  </button>

                  {/* 菜单弹出层 */}
                  {isMenuOpen && (
                    <div
                      ref={menuRef}
                      className="absolute top-full right-0 mt-2 w-36 bg-white rounded-md shadow-lg z-10 overflow-hidden"
                    >
                      <button
                        onClick={showDeleteConfirm}
                        className="flex items-center w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-gray-100"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('entries.delete')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg">
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder={pageInfo.placeholder}
              onFocusChange={setIsEditorFocused}
              showButtons={true}
              onSubmit={handleSubmit}
              onGoDeeper={handleGoDeeper}
              onPositive={handlePositive}
              onStory={handleStory}
              isSubmitting={isSubmitting}
              isGoingDeeper={isGoingDeeper}
              isPositive={isPositive}
              isStory={isStory}
              isEdit={isEdit}
              ref={editorRef}
            />
          </div>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={t('entries.deleteConfirmTitle')}
        message={t('entries.deleteConfirmMessage')}
        confirmText={t('entries.confirm')}
        cancelText={t('entries.cancel')}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={isDeleting}
      />
    </Layout>
  )
}

export default function NewEntryPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen bg-[#F6F5F1] flex items-center justify-center">
          <div className="loader"></div>
          <style jsx>{`
            .loader {
              border: 5px solid #f3f3f3;
              border-top: 5px solid #183861;
              border-radius: 50%;
              width: 50px;
              height: 50px;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </Layout>
    }>
      <NewEntryPageContent />
    </Suspense>
  )
}