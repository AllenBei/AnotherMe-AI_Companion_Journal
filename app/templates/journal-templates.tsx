/*
 * @Author: Allen Bei
 * @Date: 2025-03-12 11:37:12
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-08-22 17:43:06
 * @FilePath: /AnotherMe-AI_Companion_Journal/app/templates/journal-templates.tsx
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */

// 导出模板类型
export type TemplateType = 'snippet';

// 导出国际化 key 常量
export const TEMPLATE_KEYS = {
  snippet: {
    pageTitle: 'templates.snippet.pageTitle',
    placeholder: 'templates.snippet.placeholder'
  }
};

// 样式配置（硬编码，不需要国际化）
export const STYLE_CONFIG = {
  snippet: {
    buttonClass: "bg-white text-[#075071]",
    backgroundImg: null
  }
};

// 问题模板生成函数（用于深入思考模式）
export const questionTemplate = (question: string) => {
  return `<div class="question-template" style="margin-top: 0.8em; margin-bottom: 0.3em; display: flex; align-items: center; position: relative;" data-action="toggle-delete-icon"><div class="question-delete-icon" style="cursor: pointer; padding: 2px 5px 2px 2px; color: #757575; display: none; align-items: center; position: absolute; left: 0; top: 50%; transform: translateY(-50%);" data-action="delete-question"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg></div><p style="border-left: 2px solid #0288D1; padding-left: 4px; background-color: rgba(163, 216, 240, 0.05); margin: 0.3em 0; color: #0288D1; flex-grow: 1; font-size: 1em; margin-left: 24px;">${question}</p></div><p>&nbsp;</p>`;
}

// 页面信息配置函数
export function getPageInfo(t: (k: string) => string) {
  return {
    snippet: {
      title: t(TEMPLATE_KEYS.snippet.pageTitle),
      placeholder: t(TEMPLATE_KEYS.snippet.placeholder),
      buttonClass: STYLE_CONFIG.snippet.buttonClass,
      template: '',
      backgroundImg: STYLE_CONFIG.snippet.backgroundImg
    }
  }
}