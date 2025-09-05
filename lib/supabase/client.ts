/*
 * @Author: Allen Bei
 * @Date: 2025-03-25 19:55:29
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-04-01 13:10:12
 * @FilePath: /AnotherMe_AI_Web/lib/supabase/client.ts
 * @Description: Supabase 客户端创建工具
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
import { useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 直接导出一个 supabase 客户端实例，用于非 React 组件中
export const supabase = getSupabaseBrowserClient();

// React Hook 用于在组件中获取 Supabase 客户端
function useSupabaseClient() {
  return useMemo(getSupabaseBrowserClient, []);
}

export default useSupabaseClient;
