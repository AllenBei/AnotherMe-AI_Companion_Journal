/*
 * @Author: Allen Bei
 * @Date: 2025-03-10 17:16:23
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-08-25 10:29:19
 * @FilePath: /AnotherMe-AI_Companion_Journal/components/rich-text-editor.tsx
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
"use client"

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { Bold, Italic, Underline, List, Strikethrough, PaintBucket, ChevronUp, ChevronDown, Heart, ArrowRight, Loader2, Trash } from "lucide-react"
import { questionTemplate } from "@/app/templates/journal-templates"
import { useI18n } from '@/app/i18n'
import { useIsMobile } from '@/hooks/use-mobile'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onFocusChange?: (focused: boolean) => void
  showButtons?: boolean
  onSubmit?: () => void
  onGoDeeper?: () => void
  isSubmitting?: boolean
  isGoingDeeper?: boolean
  isEdit?: boolean
}

// 定义组件暴露给父组件的方法
export interface RichTextEditorRef {
  appendContentByMode: (content: string, mode: 'deeper' ) => void;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  value,
  onChange,
  placeholder = "...",
  onFocusChange,
  showButtons = false,
  onSubmit,
  onGoDeeper,
  isSubmitting = false,
  isGoingDeeper = false,
  isEdit = false
}, ref) => {
  const { t } = useI18n()
  const isMobile = useIsMobile()
  const [isFocused, setIsFocused] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0) // 用于强制重新渲染
  const editorRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 过滤模板提示内容
  const filterTemplateTips = (content: string): string => {
    // 创建一个临时的DOM元素来解析HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = content

    // console.log("过滤前内容长度:", content.length)

    // 检查HTML结构
    const allElements = tempDiv.querySelectorAll('*')

    // 统计各类元素
    const elementCounts: Record<string, number> = {}
    allElements.forEach(el => {
      const tagName = el.tagName.toLowerCase()
      elementCounts[tagName] = (elementCounts[tagName] || 0) + 1
    })
    // console.log("元素统计:", elementCounts)

    // 查找所有段落元素，检查它们的类和样式
    // const paragraphs = tempDiv.querySelectorAll('p')
    // console.log(`找到 ${paragraphs.length} 个段落元素`)

    // paragraphs.forEach((p, i) => {
    //   console.log(`段落 ${i + 1} 详情:`)
    //   console.log(`- 类名: "${p.className}"`)
    //   console.log(`- 样式: "${p.getAttribute('style')}"`)
    //   console.log(`- 内容前20个字符: ${p.textContent?.substring(0, 20)}...`)
    // })

    // 从TEMPLATE_KEYS中获取所有提示内容
    const defaultTips: string[] = []

    // console.log("默认提示内容:", defaultTips)

    // 尝试多种方法找到并删除模板提示内容
    let removedCount = 0

    // 方法1: 使用类选择器
    const tipElements = tempDiv.querySelectorAll('.template-tips')
    // console.log(`使用类选择器找到 ${tipElements.length} 个模板提示元素`)

    // 方法2: 使用样式选择器
    // const styleTipElements = tempDiv.querySelectorAll('p[style*="color: #666"][style*="font-style: italic"]')
    // console.log(`使用样式选择器找到 ${styleTipElements.length} 个可能的提示元素`)

    // 方法3: 使用内容匹配
    const allParagraphs = tempDiv.querySelectorAll('p')
    let contentMatchedElements: Element[] = []

    allParagraphs.forEach(p => {
      const text = p.textContent?.trim() || ""
      // 检查是否与默认提示匹配
      for (const defaultTip of defaultTips) {
        if (text === defaultTip.trim()) {
          contentMatchedElements.push(p)
          break
        }
      }
    })

    // console.log(`使用内容匹配找到 ${contentMatchedElements.length} 个可能的提示元素`)

    // 合并所有找到的元素
    const allPossibleTipElements = new Set<Element>()

    // styleTipElements.forEach(el => allPossibleTipElements.add(el))
    tipElements.forEach(el => allPossibleTipElements.add(el))
    contentMatchedElements.forEach(el => allPossibleTipElements.add(el))

    // console.log(`合并后共有 ${allPossibleTipElements.size} 个可能的提示元素`)

    // 检查并删除匹配的元素
    allPossibleTipElements.forEach((element, index) => {
      const elementText = element.textContent?.trim() || ""

      // 检查是否与默认提示匹配
      let isDefaultTip = false
      let matchedTip = ""

      for (const defaultTip of defaultTips) {
        const normalizedDefaultTip = defaultTip.trim()

        if (elementText === normalizedDefaultTip) {
          isDefaultTip = true
          matchedTip = defaultTip
          break
        }
      }

      if (isDefaultTip) {
        // console.log(`删除提示元素，匹配默认提示: "${matchedTip.substring(0, 30)}..."`)
        element.remove()
        removedCount++
      }
    })

    // 方法4: 直接使用正则表达式替换HTML字符串中的模板提示内容
    let htmlString = tempDiv.innerHTML

    // 为每个默认提示创建一个正则表达式
    defaultTips.forEach(tip => {
      const escapedTip = tip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim()
      const regex = new RegExp(`<p[^>]*class=['"]template-tips['"][^>]*>[\\s\\S]*?${escapedTip}[\\s\\S]*?<\\/p>`, 'g')

      // 替换匹配的内容
      const beforeLength = htmlString.length
      htmlString = htmlString.replace(regex, '')
      const afterLength = htmlString.length

      if (beforeLength !== afterLength) {
        // console.log(`使用正则表达式删除了提示内容，减少了 ${beforeLength - afterLength} 个字符`)
        removedCount++
      }
    })

    // 更新tempDiv的内容
    tempDiv.innerHTML = htmlString

    // console.log(`总共删除了 ${removedCount} 个默认提示元素`)
    const result = tempDiv.innerHTML
    // console.log("过滤后内容长度:", result.length)
    // console.log("内容减少了:", content.length - result.length, "字符")

    return result
  }

  // 处理删除问题模板
  const handleDeleteQuestionTemplate = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const deleteIcon = target.closest('[data-action="delete-question"]');

    if (deleteIcon) {
      event.preventDefault();
      event.stopPropagation();

      // 找到整个模板元素并删除（支持问题模板、生成模板和引导模板）
      const templateElement = deleteIcon.closest('.question-template, .generate-template, .guide-template');
      if (templateElement && editorRef.current) {
        templateElement.remove();

        // 直接从DOM获取更新后的内容并更新状态
        const updatedContent = editorRef.current.innerHTML;
        onChange(updatedContent);

        // 强制组件重新渲染以确保按钮状态更新
        setTimeout(() => {
          if (editorRef.current) {
            const currentContent = editorRef.current.innerHTML;
            // 再次调用onChange确保父组件状态同步
            onChange(currentContent);
            // 强制重新渲染以更新按钮状态
            setForceUpdate(prev => prev + 1);
          }
        }, 0);
      }
    }
  };

  // 处理模板的鼠标悬停和点击事件
  const handleQuestionTemplateInteraction = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const templateElement = target.closest('[data-action="toggle-delete-icon"]');

    if (templateElement) {
      // 如果是点击事件，切换删除图标的显示状态
      if (event.type === 'click') {
        const deleteIcon = templateElement.querySelector('.question-delete-icon') as HTMLElement;
        if (deleteIcon) {
          // 切换显示/隐藏状态
          if (deleteIcon.style.display === 'none' || !deleteIcon.style.display) {
            deleteIcon.style.display = 'flex';
          } else {
            deleteIcon.style.display = 'none';
          }
        }
      }
    }
  };

  // 处理模板的鼠标进入事件
  const handleQuestionTemplateMouseEnter = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const templateElement = target.closest('.question-template, .generate-template, .guide-template');

    if (templateElement) {
      const deleteIcon = templateElement.querySelector('.question-delete-icon') as HTMLElement;
      if (deleteIcon) {
        deleteIcon.style.display = 'flex';
      }
    }
  };

  // 处理模板的鼠标离开事件
  const handleQuestionTemplateMouseLeave = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const templateElement = target.closest('.question-template, .generate-template, .guide-template');

    if (templateElement) {
      const deleteIcon = templateElement.querySelector('.question-delete-icon') as HTMLElement;
      if (deleteIcon) {
        deleteIcon.style.display = 'none';
      }
    }
  };

  // 添加问题模板到编辑器底部
  const appendQuestionTemplate = (question: string) => {
    if (editorRef.current) {
      // 获取当前内容
      const currentContent = editorRef.current.innerHTML;

      // 创建问题模板HTML
      const templateHTML = questionTemplate(question);

      // 将模板添加到当前内容末尾
      const newContent = currentContent + templateHTML;

      // 更新编辑器内容
      editorRef.current.innerHTML = newContent;

      // 更新React状态
      onChange(newContent);
    }
  };

  // 根据AI模式添加内容的新方法
  const appendContentByMode = (content: string, mode: 'deeper') => {
    if (editorRef.current) {
      // 获取当前内容
      const currentContent = editorRef.current.innerHTML;

      // 根据模式选择模板函数
      let templateHTML: string;
      if (mode === 'deeper') {
        templateHTML = questionTemplate(content);
      }

      // 将模板添加到当前内容末尾
      const newContent = currentContent + templateHTML;

      // 更新编辑器内容
      editorRef.current.innerHTML = newContent;

      // 更新React状态
      onChange(newContent);
    }
  };

  useImperativeHandle(ref, () => ({ 
    appendContentByMode,
  }), [appendContentByMode]);
  

  // 获取当前编辑器的实际文本内容长度（不包含HTML标签）
  const getCurrentContentLength = () => {
    if (editorRef.current) {
      const textContent = editorRef.current.textContent || '';
      return textContent.trim().length;
    }
    return 0;
  };

  // 监听问题模板相关的事件
  useEffect(() => {
    // 删除事件
    document.addEventListener('click', handleDeleteQuestionTemplate);

    // 点击切换显示/隐藏删除图标
    document.addEventListener('click', handleQuestionTemplateInteraction);

    // 鼠标悬停事件
    if (editorRef.current) {
      // 使用事件委托，将事件绑定到编辑器容器上
      editorRef.current.addEventListener('mouseover', handleQuestionTemplateMouseEnter);
      editorRef.current.addEventListener('mouseout', handleQuestionTemplateMouseLeave);
    }

    return () => {
      document.removeEventListener('click', handleDeleteQuestionTemplate);
      document.removeEventListener('click', handleQuestionTemplateInteraction);

      if (editorRef.current) {
        editorRef.current.removeEventListener('mouseover', handleQuestionTemplateMouseEnter);
        editorRef.current.removeEventListener('mouseout', handleQuestionTemplateMouseLeave);
      }
    };
  }, []);

  // 监听滚动事件
  // useEffect(() => {
  //   const handleScroll = () => {
  //     if (containerRef.current) {
  //       const { scrollTop, scrollHeight, clientHeight } = containerRef.current
  //       setIsContentOverflow(scrollTop > 0 || scrollHeight > clientHeight)
  //     }
  //   }

  //   const container = containerRef.current
  //   if (container) {
  //     container.addEventListener('scroll', handleScroll)
  //     // 初始检查
  //     handleScroll()
  //   }

  //   return () => {
  //     if (container) {
  //       container.removeEventListener('scroll', handleScroll)
  //     }
  //   }
  // }, [])

  // 颜色选项
  const colorOptions = [
    { name: "浅黄色", value: "#FFF9C4" },
    { name: "浅蓝色", value: "#E3F2FD" },
    { name: "浅绿色", value: "#E8F5E9" },
    { name: "浅红色", value: "#FFEBEE" },
    { name: "浅紫色", value: "#F3E5F5" },
  ]

  // 防止工具栏点击导致编辑器失焦
  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  // 执行编辑命令
  const execCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus()
      try {
        document.execCommand(command, false, value)
      } catch (error) {
        console.error(`执行命令 ${command} 失败:`, error)
      }
    }
  }

  // 处理内容变化
  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      onChange(content)

      // 强制组件重新渲染以更新按钮状态
      // 这确保了删除操作或内容变化后按钮能及时切换
      setTimeout(() => {
        if (editorRef.current) {
          // 强制重新渲染以更新按钮状态
          setForceUpdate(prev => prev + 1)
        }
      }, 0)
    }
  }

  // 处理获得焦点
  const handleFocus = () => {
    setIsFocused(true)
    if (onFocusChange) onFocusChange(true)
  }

  // 处理失去焦点
  const handleBlur = (e: React.FocusEvent) => {
    // 检查是否点击了工具栏
    const toolbar = document.querySelector('.editor-toolbar')
    if (toolbar && toolbar.contains(e.relatedTarget as Node)) {
      return
    }

    // 检查是否点击了颜色选择器
    const colorPicker = document.querySelector('.color-picker')
    if (colorPicker && colorPicker.contains(e.relatedTarget as Node)) {
      return
    }

    // 检查是否点击了按钮区域
    const buttonArea = document.querySelector('.editor-buttons')
    if (buttonArea && buttonArea.contains(e.relatedTarget as Node)) {
      return
    }

    setIsFocused(false)
    if (onFocusChange) onFocusChange(false)
  }

  // 处理背景色
  const handleBackgroundColor = (color: string) => {
    execCommand('backColor', color)
    setShowColorPicker(false)
  }


  // 处理项目符号列表
  const handleBulletList = () => {
    if (editorRef.current) {
      editorRef.current.focus()

      try {
        // 方法1: 标准方法
        // console.log("尝试使用 execCommand 插入项目符号列表")
        document.execCommand('insertUnorderedList', false)

        // 确保列表样式正确应用
        setTimeout(() => {
          if (editorRef.current) {
            const lists = editorRef.current.querySelectorAll('ul')
            lists.forEach(ul => {
              ul.style.listStyleType = 'disc'
              ul.style.paddingLeft = '2em'
              ul.style.marginTop = '0.5em'
              ul.style.marginBottom = '0.5em'
            })

            // 触发内容变化
            handleContentChange()
          }
        }, 0)
      } catch (e) {
        console.error("execCommand 插入项目符号列表失败:", e)
      }
    }
  }

  // 初始化编辑器内容
  useEffect(() => {
    if (editorRef.current) {
      if (!editorRef.current.innerHTML || editorRef.current.innerHTML !== value) {
        // 使用dangerouslySetInnerHTML的方式设置内容，确保HTML标签被正确解析
        editorRef.current.innerHTML = value

        // 应用样式到列表元素
        const lists = editorRef.current.querySelectorAll('ul')
        lists.forEach(ul => {
          ul.style.listStyleType = 'disc'
          ul.style.paddingLeft = '2em'
          ul.style.marginTop = '0.5em'
          ul.style.marginBottom = '0.5em'
        })

        const items = editorRef.current.querySelectorAll('li')
        items.forEach(li => {
          li.style.display = 'list-item'
        })

        // 应用样式到标题元素
        const headings = editorRef.current.querySelectorAll('h3')
        headings.forEach(h3 => {
          h3.style.fontSize = '1.25rem'
          h3.style.fontWeight = 'bold'
          h3.style.marginTop = '1em'
          h3.style.marginBottom = '0.5em'
        })
      }
    }
  }, [value])

  // 点击外部关闭颜色选择器和AI模式选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const colorPicker = document.querySelector('.color-picker')
      const colorButton = document.querySelector('.color-button')

      if (
        colorPicker &&
        colorButton &&
        !colorPicker.contains(event.target as Node) &&
        !colorButton.contains(event.target as Node)
      ) {
        setShowColorPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 处理提交
  const handleSubmit = (): void => {
    if (editorRef.current && onSubmit) {

      // 获取当前内容
      const currentContent = editorRef.current.innerHTML
      // console.log("提交前原始内容:", currentContent)

      // 过滤掉模板提示内容
      const filteredContent = filterTemplateTips(currentContent)
      // console.log("过滤后内容:", filteredContent)

      // 更新编辑器内容和状态
      onChange(filteredContent)

      // 确保内容已更新后再调用提交回调
      // 使用setTimeout确保状态更新后再提交
      setTimeout(() => {
        // 再次检查过滤是否成功
        if (editorRef.current) {
          // 直接设置编辑器内容为过滤后的内容
          editorRef.current.innerHTML = filteredContent
        }

        // 调用提交回调
        onSubmit();

      }, 0)
    }
  }

  return (
    <div className="rounded-lg overflow-hidden relative max-w-5xl mx-auto flex flex-col min-h-[600px]" ref={containerRef}>
      {/* 工具栏 - 只在获得焦点时显示 */}
      <div
        className={`editor-toolbar flex items-center justify-center p-2 bg-[#F6F5F1] bg-opacity-10 transition-all duration-300 ${isFocused ? 'h-12 opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}
        onMouseDown={handleToolbarMouseDown}
      >
        <div className="flex items-center space-x-1">
          {/* H3 标题按钮 */}
          {/* <button 
            onMouseDown={(e) => {
              e.preventDefault()
              handleHeading()
            }}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-700 flex items-center justify-center"
            type="button"
          >
            <Heading size={18} />
          </button> */}
          {/* <div className="w-px h-6 bg-gray-300 mx-1"></div> */}
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              execCommand('bold')
            }}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-700 flex items-center justify-center"
            type="button"
          >
            <Bold size={18} />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              execCommand('italic')
            }}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-700 flex items-center justify-center"
            type="button"
          >
            <Italic size={18} />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              execCommand('underline')
            }}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-700 flex items-center justify-center"
            type="button"
          >
            <Underline size={18} />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              execCommand('strikeThrough')
            }}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-700 flex items-center justify-center"
            type="button"
          >
            <Strikethrough size={18} />
          </button>
          {/* <div className="w-px h-6 bg-gray-300 mx-1"></div> */}
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              handleBulletList()
            }}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-700 flex items-center justify-center"
            type="button"
          >
            <List size={18} />
          </button>
          <div className="relative">
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                setShowColorPicker(!showColorPicker)
              }}
              className="color-button p-1.5 rounded hover:bg-gray-200 text-gray-700 flex items-center justify-center"
              type="button"
            >
              <PaintBucket size={18} />
              {showColorPicker ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* 颜色选择器 */}
            {showColorPicker && (
              <div className="color-picker absolute top-full left-1/2 -translate-x-1/2 mt-1 p-2 bg-white shadow-lg rounded-md z-10">
                <div className="flex gap-1">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleBackgroundColor(color.value)
                      }}
                      className="flex items-center justify-center p-1 hover:bg-gray-100 rounded"
                      style={{ backgroundColor: color.value, width: '20px', height: '20px', flex: '0 0 auto' }}
                    >
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 编辑区域 - 使用flex-grow让它自动扩展高度 */}
      <div
        ref={editorRef}
        className={`px-5 py-2 flex-grow focus:outline-none bg-[#F6F5F1] bg-opacity-0 ${!value && !isFocused ? 'editor-placeholder' : ''}`}
        contentEditable="true"
        onInput={handleContentChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        data-placeholder={placeholder}
      ></div>

      {/* 按钮区域 - 使用sticky定位粘在底部，有自己的高度空间 */}
      {showButtons && (
        <div
          className={`editor-buttons sticky bottom-0 backdrop-blur-sm pt-3 px-4 z-50 ${isMobile ? 'w-full' : ''
            }`}
        >
          <div className="max-w-5xl mx-auto flex items-center gap-2">
            {onGoDeeper && (
              <button
                onClick={onGoDeeper}
                disabled={isGoingDeeper}
                className="px-4 py-2 rounded-2xl transition-colors bg-white text-[#075071] shadow-sm flex items-center hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGoingDeeper ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Heart className="w-4 h-4 mr-2" />
                )}
                {t('entries.deepThink')}
              </button>
            )}

            {onSubmit && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-2xl transition-colors bg-[#075071] text-white shadow-sm flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEdit ? t('entries.edit') : t('entries.submit')}
              </button>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .editor-placeholder:before {
          content: attr(data-placeholder);
          color: #aaa;
          pointer-events: none;
          position: absolute;
        }
        
        /* 确保列表样式正确显示 */
        div[contenteditable="true"] ul {
          list-style-type: disc !important;
          padding-left: 2em !important;
          margin-top: 0.5em !important;
          margin-bottom: 0.5em !important;
        }
        
        div[contenteditable="true"] li {
          display: list-item !important;
        }
        
        /* 确保标题样式正确显示 */
        div[contenteditable="true"] h3 {
          font-size: 1.25rem !important;
          font-weight: bold !important;
          margin-top: 1em !important;
          margin-bottom: 0.5em !important;
        }
        
        /* 确保段落样式正确显示 */
        div[contenteditable="true"] p {
          margin-bottom: 0.5em !important;
        }
        
        /* 确保斜体文本样式正确显示 */
        div[contenteditable="true"] p[style*="italic"] {
          color: #666 !important;
          font-style: italic !important;
        }
        
        /* 问题模板样式 */
        div[contenteditable="true"] .question-template {
          margin-top: 1em !important;
          margin-bottom: 1em !important;
          display: flex !important;
          align-items: center !important;
          position: relative !important;
          cursor: pointer !important;
        }
        
        /* 引导模板样式 */
        div[contenteditable="true"] .guide-template {
          margin-top: 1em !important;
          margin-bottom: 1em !important;
          display: flex !important;
          align-items: center !important;
          position: relative !important;
          cursor: pointer !important;
        }
        
        div[contenteditable="true"] .question-delete-icon {
          cursor: pointer !important;
          padding: 2px 5px 2px 2px !important;
          color: #757575 !important;
          position: absolute !important;
          left: 0 !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          z-index: 2 !important;
        }
        
        div[contenteditable="true"] .question-template h3 {
          margin: 0.5em 0 !important;
          color: #0288D1 !important;
          flex-grow: 1 !important;
          font-size: 1em !important;
          padding-left: 28px !important;
          border-left: 2px solid #0288D1 !important;
          background-color: rgba(163, 216, 240, 0.05) !important;
        }
        
        /* 引导模板的问题样式 */
        div[contenteditable="true"] .guide-template p {
          margin: 0.3em 0 !important;
          color: #666 !important;
          flex-grow: 1 !important;
          font-size: 1em !important;
          padding: 8px 12px !important;
          background-color: #F5F5F5 !important;
          border-radius: 6px !important;
          margin-left: 24px !important;
        }
        
        /* 确保SVG图标正确显示 */
        div[contenteditable="true"] .lucide {
          display: inline-block !important;
          vertical-align: middle !important;
        }
      `}</style>
    </div>
  )
})