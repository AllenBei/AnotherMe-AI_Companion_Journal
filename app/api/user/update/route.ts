/*
 * @Author: Allen Bei
 * @Date: 2025-03-27 17:42:29
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-07-24 17:02:19
 * @FilePath: /AnotherMe_AI_Web/app/api/user/update/route.ts
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
import { NextResponse } from 'next/server';
import createSupabaseServerClient from '@/lib/supabase/server';
import { z } from 'zod';

// 定义允许更新的字段
const updateUserSchema = z.object({
  name: z.string().optional(),
  avatar_url: z.string().optional(),
  language_preference: z.enum(['zh', 'en']).optional(),
  ip_address: z.string().optional(),
  ip_country: z.string().optional(),
});

export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // 获取当前认证用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: '用户未认证' }, { status: 401 });
    }

    // 获取请求体
    const body = await request.json();
    
    // 验证请求数据
    const validatedData = updateUserSchema.parse(body);
    
    // 更新用户信息
    const { error: updateError } = await supabase
      .from('users')
      .update(validatedData)
      .eq('auid', user.id);
    
    if (updateError) {
      console.error('更新用户信息失败:', updateError);
      return NextResponse.json({ error: '更新用户信息失败' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return NextResponse.json({ error: '更新用户信息失败' }, { status: 500 });
  }
} 