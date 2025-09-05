/*
 * @Author: Allen Bei
 * @Date: 2025-05-13 16:38:31
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-06-28 14:56:22
 * @FilePath: /AnotherMe_AI_Web/app/components/LoadingDots.tsx
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
import React, { useEffect } from 'react';
import { useI18n, getInitialLanguage } from '@/app/i18n';

interface LoadingDotsProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingDots({ 
  color = '#183861', 
  size = 'md',
  className = ''
}: LoadingDotsProps) {
  // 根据大小设置点的尺寸
  const getDotSize = () => {
    switch(size) {
      case 'sm': return 'w-2 h-2';
      case 'lg': return 'w-4 h-4';
      case 'md':
      default: return 'w-3 h-3';
    }
  };

  const dotSize = getDotSize();

  return (
    <div className={`flex items-center ${className}`}>
      <div 
        className={`${dotSize} rounded-full animate-bounce mr-1`} 
        style={{ backgroundColor: color }}
      ></div>
      <div 
        className={`${dotSize} rounded-full animate-bounce mr-1`} 
        style={{ backgroundColor: color, animationDelay: '0.2s' }}
      ></div>
      <div 
        className={`${dotSize} rounded-full animate-bounce`} 
        style={{ backgroundColor: color, animationDelay: '0.4s' }}
      ></div>
    </div>
  );
}

// 提供一个完整页面加载组件
export function PageLoading() {
  const { t, language, setLanguage } = useI18n();

  // 语言初始化 - 确保在加载页面时使用正确的语言偏好
  useEffect(() => {
    const initialLanguage = getInitialLanguage()
    if (initialLanguage !== language) {
      setLanguage(initialLanguage, null)
    }
  }, [language, setLanguage])

  return (
    <div className="min-h-screen bg-[#F6F5F1] flex items-center justify-center flex-col">
      <svg className="w-64 h-20" viewBox="0 0 300 50">
        <text
          x="50%"
          y="35"
          fontSize="45"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          fill="none"
          stroke="#183861"
          strokeWidth="1"
          className="text-stroke-animation"
          textAnchor="middle"
        >
          Another.Me
        </text>
      </svg>
      <p className="text-[#075071] text-sm mb-10 text-center">
        {t('brand.slogan')}
      </p>
      <LoadingDots size="md" />
    </div>
  );
} 