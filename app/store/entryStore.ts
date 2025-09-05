/*
 * @Author: Allen Bei
 * @Date: 2025-05-11 15:36:19
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-05-11 15:38:45
 * @FilePath: /AnotherMe_AI_Web/app/store/entryStore.ts
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
import { create } from 'zustand';
import type { DayEntry } from '@/types/entries';

// 定义是否在客户端环境
const isClient = typeof window !== 'undefined';

// 从sessionStorage获取存储的dayEntry
const getStoredDayEntry = (): DayEntry | null => {
  if (isClient) {
    const stored = sessionStorage.getItem('currentDayEntry');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('解析存储的dayEntry失败:', e);
        return null;
      }
    }
  }
  return null;
};

// 定义store类型
interface EntryStore {
  currentEntry: DayEntry | null;
  setCurrentEntry: (entry: DayEntry) => void;
  clearCurrentEntry: () => void;
}

// 创建store
export const useEntryStore = create<EntryStore>((set) => ({
  // 初始state，尝试从sessionStorage获取
  currentEntry: getStoredDayEntry(),
  
  // 设置当前的Entry并存储到sessionStorage
  setCurrentEntry: (entry: DayEntry) => {
    if (isClient) {
      sessionStorage.setItem('currentDayEntry', JSON.stringify(entry));
    }
    set({ currentEntry: entry });
  },
  
  // 清除当前的Entry
  clearCurrentEntry: () => {
    if (isClient) {
      sessionStorage.removeItem('currentDayEntry');
    }
    set({ currentEntry: null });
  },
})); 