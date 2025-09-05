/*
 * @Author: Allen Bei
 * @Date: 2025-05-15 10:41:15
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-06-05 12:19:01
 * @FilePath: /AnotherMe_AI_Web/lib/emotion-map.ts
 * @Description: 根据 Robert Plutchik 的情绪轮理论，情绪可以分为三种类型：
  1.	基本情绪（Primary Emotions）：共有八种，成对出现，分别是：
  •	喜悦（Joy）
  •	信任（Trust）
  •	恐惧（Fear）
  •	惊讶（Surprise）
  •	悲伤（Sadness）
  •	厌恶（Disgust）
  •	愤怒（Anger）
  •	期待（Anticipation） ￼ ￼ ￼
  2.	复合情绪（Dyads）：由两种基本情绪组合而成，分为三类：
  •	初级复合情绪（Primary Dyads）：相邻的基本情绪组合，如：
  •	喜悦 + 信任 = 爱（Love）
  •	信任 + 恐惧 = 顺从（Submission）
  •	恐惧 + 惊讶 = 敬畏（Awe）
  •	惊讶 + 悲伤 = 不满（Disapproval）
  •	悲伤 + 厌恶 = 懊悔（Remorse）
  •	厌恶 + 愤怒 = 轻蔑（Contempt）
  •	愤怒 + 期待 = 侵略（Aggressiveness）
  •	期待 + 喜悦 = 乐观（Optimism）
  •	次级复合情绪（Secondary Dyads）：间隔一个基本情绪的组合，如：
  •	喜悦 + 恐惧 = 罪恶感（Guilt）
  •	信任 + 惊讶 = 好奇（Curiosity）
  •	恐惧 + 悲伤 = 绝望（Despair）
  •	惊讶 + 厌恶 = 不信（Unbelief）
  •	悲伤 + 愤怒 = 嫉妒（Envy）
  •	厌恶 + 期待 = 愤世嫉俗（Cynicism）
  •	愤怒 + 喜悦 = 骄傲（Pride）
  •	期待 + 信任 = 希望（Hope）
  •	三级复合情绪（Tertiary Dyads）：间隔两个基本情绪的组合，如：
  •	喜悦 + 惊讶 = 欣喜（Delight）
  •	信任 + 悲伤 = 多愁善感（Sentimentality）
  •	恐惧 + 厌恶 = 羞耻（Shame）
  •	惊讶 + 愤怒 = 愤怒（Outrage）
  •	悲伤 + 期待 = 悲观（Pessimism）
  •	厌恶 + 喜悦 = 病态（Morbidness）
  •	愤怒 + 信任 = 支配（Dominance）
  •	期待 + 恐惧 = 焦虑（Anxiety）
  3.	情绪强度（Intensity-Scaled Emotions）：每种基本情绪都有不同的强度层级，从弱到强，如：
  •	喜悦（Joy）：
  •	平静（Serenity）
  •	喜悦（Joy）
  •	狂喜（Ecstasy）
  •	信任（Trust）：
  •	接受（Acceptance）
  •	信任（Trust）
  •	钦佩（Admiration）
  •	恐惧（Fear）：
  •	担忧（Apprehension）
  •	恐惧（Fear）
  •	惊恐（Terror）
  •	惊讶（Surprise）：
  •	分心（Distraction）
  •	惊讶（Surprise）
  •	惊愕（Amazement）
  •	悲伤（Sadness）：
  •	沉思（Pensiveness）
  •	悲伤（Sadness）
  •	悲痛（Grief）
  •	厌恶（Disgust）：
  •	厌烦（Boredom）
  •	厌恶（Disgust）
  •	憎恶（Loathing）
  •	愤怒（Anger）：
  •	恼怒（Annoyance）
  •	愤怒（Anger）
  •	愤怒（Rage）
  •	期待（Anticipation）
  •	兴趣（Interest）
  •	期待（Anticipation）
  •	警觉（Vigilance）
  这些情绪的组合和强度层级展示了人类情绪的复杂性和多样性。Plutchik 的情绪轮提供了一个框架，帮助我们理解和识别这些情绪及其相互关系。
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
import React from 'react';
import type { EmotionAnalysisItem } from "@/types/entries"

export interface StandardEmotion {
  id: string; // e.g., 'joy', lowercase and simple
  name_en: string;
  name_zh: string;
  emoji: string;
  color: string; // Default color for this emotion
  category?: string; // Optional: e.g., 'positive', 'negative', or from Plutchik's wheel like 'basic', 'mixed'
}
// 🌈 Primary emotions
const primaryEmotions = [
  'joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'
];

// 🔺 Intensity-scaled (per Plutchik)
const intensityScaledEmotions = [
  'serenity', 'joy', 'ecstasy', 'acceptance', 'trust', 'admiration',
  'apprehension', 'fear', 'terror', 'distraction', 'surprise', 'amazement',
  'pensiveness', 'sadness', 'grief', 'boredom', 'disgust', 'loathing',
  'annoyance', 'anger', 'rage', 'interest', 'anticipation', 'vigilance'
];

// 🧬 Primary dyads (adjacent basic emotions)
const primaryDyads = [
  'love', 'submission', 'awe', 'disapproval',
  'remorse', 'contempt', 'aggressiveness', 'optimism',
]
// 🧬 Secondary dyads (skip-1 emotions)
const secondaryDyads = [
  'guilt', 'curiosity', 'despair', 'unbelief',
  'envy', 'cynicism', 'pride', 'hope',
]
// 🧬 Tertiary dyads (skip-2 emotions)
const tertiaryDyads = [
  'delight', 'sentimentality', 'shame', 'outrage',
  'pessimism', 'morbidness', 'dominance', 'anxiety',
]

const additionalEmotions = [
  'fatigue', 'stress', 'confusion', 'excitement', 'relief', 
  'contentment', 'determination', 'motivation'
];

export const ALLOWED_EMOTION_KEYWORDS: string[] = [
  ...primaryEmotions,
  ...intensityScaledEmotions,
  ...primaryDyads,
  // ...secondaryDyads,
  // ...tertiaryDyads,
];

export const EMOTION_MAP: Record<string, StandardEmotion> = {
  // Primary Emotions with Intensity Variants
  'ecstasy': { id: 'ecstasy', name_en: 'Ecstasy', name_zh: '狂喜', emoji: '🤩', color: 'rgba(255, 215, 0, 1)', category: 'basic' },
  'joy': { id: 'joy', name_en: 'Joy', name_zh: '喜悦', emoji: '😊', color: 'rgba(255, 224, 102, 1)', category: 'basic' },
  'serenity': { id: 'serenity', name_en: 'Serenity', name_zh: '宁静', emoji: '😌', color: 'rgba(255, 250, 205, 1)', category: 'basic' },

  'admiration': { id: 'admiration', name_en: 'Admiration', name_zh: '钦佩', emoji: '😍', color: 'rgba(76, 175, 80, 1)', category: 'basic' },
  'trust': { id: 'trust', name_en: 'Trust', name_zh: '信任', emoji: '🤝', color: 'rgba(139, 195, 74, 1)', category: 'basic' },
  'acceptance': { id: 'acceptance', name_en: 'Acceptance', name_zh: '接受', emoji: '😊', color: 'rgba(197, 225, 165, 1)', category: 'basic' },

  'terror': { id: 'terror', name_en: 'Terror', name_zh: '惊恐', emoji: '😱', color: 'rgba(81, 45, 168, 1)', category: 'basic' },
  'fear': { id: 'fear', name_en: 'Fear', name_zh: '恐惧', emoji: '😨', color: 'rgba(103, 58, 183, 1)', category: 'basic' },
  'apprehension': { id: 'apprehension', name_en: 'Apprehension', name_zh: '忧虑', emoji: '😟', color: 'rgba(149, 117, 205, 1)', category: 'basic' },

  'amazement': { id: 'amazement', name_en: 'Amazement', name_zh: '惊奇', emoji: '🤯', color: 'rgba(158, 158, 158, 1)', category: 'basic' },
  'surprise': { id: 'surprise', name_en: 'Surprise', name_zh: '惊讶', emoji: '😮', color: 'rgba(189, 189, 189, 1)', category: 'basic' },
  'distraction': { id: 'distraction', name_en: 'Distraction', name_zh: '分心', emoji: '😵', color: 'rgba(224, 224, 224, 1)', category: 'basic' },

  'grief': { id: 'grief', name_en: 'Grief', name_zh: '悲恸', emoji: '😭', color: 'rgba(33, 150, 243, 1)', category: 'basic' },
  'sadness': { id: 'sadness', name_en: 'Sadness', name_zh: '悲伤', emoji: '😢', color: 'rgba(3, 169, 244, 1)', category: 'basic' },
  'pensiveness': { id: 'pensiveness', name_en: 'Pensiveness', name_zh: '沉思', emoji: '😔', color: 'rgba(129, 212, 250, 1)', category: 'basic' },

  'loathing': { id: 'loathing', name_en: 'Loathing', name_zh: '厌恶', emoji: '🤢', color: 'rgba(51, 105, 30, 1)', category: 'basic' },
  'disgust': { id: 'disgust', name_en: 'Disgust', name_zh: '厌烦', emoji: '🤮', color: 'rgba(104, 159, 56, 1)', category: 'basic' },
  'boredom': { id: 'boredom', name_en: 'Boredom', name_zh: '无聊', emoji: '😒', color: 'rgba(174, 213, 129, 1)', category: 'basic' },

  'rage': { id: 'rage', name_en: 'Rage', name_zh: '狂怒', emoji: '😡', color: 'rgba(183, 28, 28, 1)', category: 'basic' },
  'anger': { id: 'anger', name_en: 'Anger', name_zh: '愤怒', emoji: '😠', color: 'rgba(244, 67, 54, 1)', category: 'basic' },
  'annoyance': { id: 'annoyance', name_en: 'Annoyance', name_zh: '恼怒', emoji: '😤', color: 'rgba(239, 154, 154, 1)', category: 'basic' },

  'vigilance': { id: 'vigilance', name_en: 'Vigilance', name_zh: '警觉', emoji: '👁️', color: 'rgba(245, 124, 0, 1)', category: 'basic' },
  'anticipation': { id: 'anticipation', name_en: 'Anticipation', name_zh: '期待', emoji: '🤔', color: 'rgba(255, 152, 0, 1)', category: 'basic' },
  'interest': { id: 'interest', name_en: 'Interest', name_zh: '兴趣', emoji: '🧐', color: 'rgba(255, 204, 128, 1)', category: 'basic' },

  // Mixed Emotions (Primary Dyads)
  'love': { id: 'love', name_en: 'Love', name_zh: '爱', emoji: '❤️', color: 'rgba(240, 98, 146, 1)', category: 'mixed' },
  'submission': { id: 'submission', name_en: 'Submission', name_zh: '顺从', emoji: '🙇', color: 'rgba(129, 199, 132, 1)', category: 'mixed' },
  'alarm': { id: 'alarm', name_en: 'Alarm', name_zh: '警觉', emoji: '🚨', color: 'rgba(126, 87, 194, 1)', category: 'mixed' },
  'disappointment': { id: 'disappointment', name_en: 'Disappointment', name_zh: '失望', emoji: '😞', color: 'rgba(144, 164, 174, 1)', category: 'mixed' },
  'remorse': { id: 'remorse', name_en: 'Remorse', name_zh: '懊悔', emoji: '😔', color: 'rgba(161, 136, 127, 1)', category: 'mixed' },
  'contempt': { id: 'contempt', name_en: 'Contempt', name_zh: '轻蔑', emoji: '😒', color: 'rgba(141, 110, 99, 1)', category: 'mixed' },
  'aggressiveness': { id: 'aggressiveness', name_en: 'Aggressiveness', name_zh: '攻击性', emoji: '🥊', color: 'rgba(229, 57, 53, 1)', category: 'mixed' },
  'optimism': { id: 'optimism', name_en: 'Optimism', name_zh: '乐观', emoji: '☀️', color: 'rgba(255, 193, 7, 1)', category: 'mixed' },

  // Additional Positive Emotions
  'gratitude': { id: 'gratitude', name_en: 'Gratitude', name_zh: '感恩', emoji: '🙏', color: 'rgba(76, 175, 80, 1)', category: 'positive' },
  'hope': { id: 'hope', name_en: 'Hope', name_zh: '希望', emoji: '🤞', color: 'rgba(33, 150, 243, 1)', category: 'positive' },
  'pride': { id: 'pride', name_en: 'Pride', name_zh: '自豪', emoji: '🏆', color: 'rgba(156, 39, 176, 1)', category: 'positive' },
  'confidence': { id: 'confidence', name_en: 'Confidence', name_zh: '自信', emoji: '😎', color: 'rgba(255, 152, 0, 1)', category: 'positive' },
  'excitement': { id: 'excitement', name_en: 'Excitement', name_zh: '兴奋', emoji: '🎉', color: 'rgba(233, 30, 99, 1)', category: 'positive' },
  'relief': { id: 'relief', name_en: 'Relief', name_zh: '释然', emoji: '😌', color: 'rgba(0, 188, 212, 1)', category: 'positive' },
  'contentment': { id: 'contentment', name_en: 'Contentment', name_zh: '满足', emoji: '😊', color: 'rgba(139, 195, 74, 1)', category: 'positive' },

  // Additional Negative Emotions
  'anxiety': { id: 'anxiety', name_en: 'Anxiety', name_zh: '焦虑', emoji: '😟', color: 'rgba(255, 87, 34, 1)', category: 'negative' },
  'shame': { id: 'shame', name_en: 'Shame', name_zh: '羞愧', emoji: '😳', color: 'rgba(233, 30, 99, 1)', category: 'negative' },
  'guilt': { id: 'guilt', name_en: 'Guilt', name_zh: '内疚', emoji: '😔', color: 'rgba(121, 85, 72, 1)', category: 'negative' },
  'frustration': { id: 'frustration', name_en: 'Frustration', name_zh: '沮丧', emoji: '😤', color: 'rgba(255, 112, 67, 1)', category: 'negative' },
  'loneliness': { id: 'loneliness', name_en: 'Loneliness', name_zh: '孤独', emoji: '🚶', color: 'rgba(189, 189, 189, 1)', category: 'negative' },
  'jealousy': { id: 'jealousy', name_en: 'Jealousy', name_zh: '嫉妒', emoji: '😒', color: 'rgba(205, 220, 57, 1)', category: 'negative' },

  // Complex / Action Emotions
  'determination': { id: 'determination', name_en: 'Determination', name_zh: '决心', emoji: '💪', color: 'rgba(255, 152, 0, 1)', category: 'complex' },
  'motivated': { id: 'motivated', name_en: 'Motivated', name_zh: '动力', emoji: '⚡', color: 'rgba(255, 235, 59, 1)', category: 'complex' },

  // Newly added based on ALLOWED_EMOTION_KEYWORDS
  'awe': { id: 'awe', name_en: 'Awe', name_zh: '敬畏', emoji: '😲', color: 'rgba(188, 160, 220, 1)', category: 'mixed' },
  'disapproval': { id: 'disapproval', name_en: 'Disapproval', name_zh: '不满', emoji: '🤨', color: 'rgba(168, 186, 193, 1)', category: 'mixed' },
  'curiosity': { id: 'curiosity', name_en: 'Curiosity', name_zh: '好奇', emoji: '🔎', color: 'rgba(160, 217, 185, 1)', category: 'complex' },
  'despair': { id: 'despair', name_en: 'Despair', name_zh: '绝望', emoji: '😩', color: 'rgba(74, 74, 127, 1)', category: 'negative' },
  'unbelief': { id: 'unbelief', name_en: 'Unbelief', name_zh: '不信', emoji: '🤷‍♀️', color: 'rgba(159, 168, 159, 1)', category: 'complex' },
  'envy': { id: 'envy', name_en: 'Envy', name_zh: '嫉妒', emoji: '😠', color: 'rgba(139, 69, 110, 1)', category: 'negative' },
  'cynicism': { id: 'cynicism', name_en: 'Cynicism', name_zh: '愤世嫉俗', emoji: '🙄', color: 'rgba(160, 120, 85, 1)', category: 'negative' },
  'delight': { id: 'delight', name_en: 'Delight', name_zh: '欣喜', emoji: '✨', color: 'rgba(255, 240, 165, 1)', category: 'positive' },
  'sentimentality': { id: 'sentimentality', name_en: 'Sentimentality', name_zh: '多愁善感', emoji: '🥲', color: 'rgba(121, 189, 177, 1)', category: 'complex' },
  'outrage': { id: 'outrage', name_en: 'Outrage', name_zh: '愤慨', emoji: '🤬', color: 'rgba(211, 47, 47, 1)', category: 'negative' },
  'pessimism': { id: 'pessimism', name_en: 'Pessimism', name_zh: '悲观', emoji: '🙁', color: 'rgba(154, 140, 152, 1)', category: 'negative' },
  'morbidness': { id: 'morbidness', name_en: 'Morbidness', name_zh: '病态', emoji: '💀', color: 'rgba(174, 189, 120, 1)', category: 'negative' },
  'dominance': { id: 'dominance', name_en: 'Dominance', name_zh: '支配', emoji: '👑', color: 'rgba(46, 125, 50, 1)', category: 'complex' },

  // Newly added based on ALLOWED_EMOTION_KEYWORDS
  'fatigue': { id: 'fatigue', name_en: 'Fatigue', name_zh: '疲劳', emoji: '😴', color: 'rgba(154, 140, 152, 1)', category: 'negative' },
  'stress': { id: 'stress', name_en: 'Stress', name_zh: '压力', emoji: '😫', color: 'rgba(120, 30, 122, 1)', category: 'negative' },
  'confusion': { id: 'confusion', name_en: 'Confusion', name_zh: '困惑', emoji: '🤔', color: 'rgba(154, 120, 122, 1)', category: 'complex' },
};

// Function to get standard emotion data.
// It tries to find a mapped emotion first; if not found, it uses the AI-provided data as a fallback,
// ensuring essential fields like name_en, emoji, and color have some value.
export const getStandardizedEmotion = (
  aiEmotionName: string,
  aiEmoji?: string,
  aiColor?: string,
  aiNameZh?: string // New parameter for original Chinese name from DB
): StandardEmotion => {
  const key = aiEmotionName ? aiEmotionName.toLowerCase().trim() : "__unknown__"; // Handle potential null/empty aiEmotionName
  const mapped = EMOTION_MAP[key];

  if (mapped) {
    return {
      ...mapped, // id, name_en, name_zh from map
      // Prioritize AI-provided emoji and color if they exist, otherwise use map's
      emoji: aiEmoji || mapped.emoji,
      color: aiColor || mapped.color,
    };
  }

  // Fallback for unmapped emotions:
  // Use AI provided data directly or provide sensible defaults.
  // Generate a more robust ID for unmapped emotions.
  const generatedId = key.replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, '') || 'unknown_emotion';

  return {
    id: generatedId,
    name_en: aiEmotionName || "Unknown", // Ensure name_en is not empty
    name_zh: aiNameZh || aiEmotionName || "未知情绪", // Use aiNameZh if available, else fallback to aiEmotionName, then a generic Chinese placeholder
    emoji: aiEmoji || '💭',
    color: aiColor || '#BDBDBD',
    // category can be undefined as it's optional
  };
}

// 生成情绪毛玻璃拟态+极光背景样式
export const generateGradientStyle = (emotionAnalysis: EmotionAnalysisItem[]): React.CSSProperties => {
  if (!emotionAnalysis || emotionAnalysis.length === 0) {
    return {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      position: 'relative'
    }
  }

  // 按情绪强度排序，取前3个主要情绪
  const topEmotions = [...emotionAnalysis]
    .sort((a, b) => (b.percent || 0) - (a.percent || 0))
    .slice(0, 3)

  // 提取情绪颜色
  const colors = topEmotions.map(emotion => {
    const standardEmotion = getStandardizedEmotion(
      emotion.name_en || '',
      emotion.emoji,
      emotion.color,
      emotion.name_zh
    );
    
    let color = standardEmotion.color;
    // 移除透明度，使用原始颜色
    if (color.includes('rgba')) {
      color = color.replace(/,\s*[\d.]+\)$/, ', 1)');
    } else if (color.includes('rgb')) {
      // rgb 格式已经没有透明度
    } else if (color.startsWith('#')) {
      // hex 格式保持原样
    }
    
    return color;
  });

  // 如果颜色不足3个，用默认颜色补充
  const defaultColors = ['#4ecdc4', '#45b7d1', '#ff6b6b'];
  while (colors.length < 3) {
    colors.push(defaultColors[colors.length] || '#4ecdc4');
  }

  return {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
    backdropFilter: 'blur(20px)',
    // border: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'relative',
    overflow: 'hidden',
    // 使用 CSS 变量来动态设置极光背景
    '--aurora-color-1': colors[0],
    '--aurora-color-2': colors[1],
    '--aurora-color-3': colors[2],
  } as React.CSSProperties & Record<string, string>
}

// 生成情绪毛玻璃样式的核心逻辑（共享函数）
const generateEmotionGlassColors = (emotions: Array<{name_zh: string; name_en: string; emoji: string; percent: number}>): { color1: string; color2: string } => {
  if (!emotions || emotions.length === 0) {
    return {
      color1: 'rgba(245, 245, 245, 0.4)',
      color2: 'rgba(230, 230, 230, 0.3)'
    };
  }

  // 按情绪强度排序，取前3个主要情绪
  const topEmotions = [...emotions]
    .sort((a, b) => (b.percent || 0) - (a.percent || 0))
    .slice(0, 3);

  // 提取情绪颜色并降低饱和度
  const colors = topEmotions.map(emotion => {
    const standardEmotion = getStandardizedEmotion(
      emotion.name_en || '',
      emotion.emoji,
      '',
      emotion.name_zh
    );
    
    let color = standardEmotion.color;
    
    // 转换为rgba格式并降低透明度，营造柔和的毛玻璃效果
    if (color.includes('rgba')) {
      color = color.replace(/,\s*[\d.]+\)$/, ', 0.25)');
    } else if (color.includes('rgb')) {
      color = color.replace('rgb(', 'rgba(').replace(')', ', 0.25)');
    } else if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      color = `rgba(${r}, ${g}, ${b}, 0.25)`;
    }
    
    return color;
  });

  // 确保至少有2个颜色
  if (colors.length === 0) {
    colors.push('rgba(255, 107, 107, 0.25)', 'rgba(78, 205, 196, 0.25)');
  } else if (colors.length === 1) {
    colors.push('rgba(78, 205, 196, 0.25)');
  }

  return {
    color1: colors[0],
    color2: colors[1]
  };
};

// 生成情绪毛玻璃样式（专用于日历视图，返回CSS字符串）
export const generateCalendarGlassStyle = (emotions: Array<{name_zh: string; name_en: string; emoji: string; percent: number}>): string => {
  const { color1, color2 } = generateEmotionGlassColors(emotions);
  return `background: linear-gradient(135deg, ${color1}, ${color2}); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.3);`;
};

// 生成情绪毛玻璃样式（专用于组件使用，返回React.CSSProperties对象）
export const generateComponentGlassStyle = (emotions: Array<{name_zh: string; name_en: string; emoji: string; percent: number}>): React.CSSProperties => {
  const { color1, color2 } = generateEmotionGlassColors(emotions);
  return {
    background: `linear-gradient(135deg, ${color1}, ${color2})`,
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  };
};


