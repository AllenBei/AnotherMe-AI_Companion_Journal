/**
 * 替换 AI prompt 中的模板变量
 * @param prompt 包含模板变量的 prompt 字符串
 * @param variables 要替换的变量对象 { variableName: value }
 * @returns 替换后的 prompt 字符串
 */
export function replacePromptVariables(
  prompt: string, 
  variables: Record<string, string>
): string {
  let result = prompt;
  
  Object.entries(variables).forEach(([key, value]) => {
    // 使用全局正则替换所有 {{variableName}} 出现的地方
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
}

/**
 * 专门用于情绪分析 prompt 的语言变量替换
 * @param prompt 情绪分析 prompt
 * @param language 目标语言 ('en' | 'zh')
 * @returns 替换后的 prompt
 */
export function replaceEmotionAnalysisLanguage(
  prompt: string, 
  language: string
): string {
  return replacePromptVariables(prompt, { language });
} 