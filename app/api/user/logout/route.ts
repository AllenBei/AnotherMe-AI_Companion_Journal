/*
 * @Author: Allen Bei
 * @Date: 2025-07-21 14:43:36
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-09-02 13:53:31
 * @FilePath: /AnotherMe-AI_Companion_Journal/app/api/user/logout/route.ts
 * @Description: ...
 * 
 */
import { NextResponse } from 'next/server';
import createSupabaseServerClient from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { type RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';

export async function POST() {
  try {
    // 1. 获取服务端Supabase客户端
    const supabase = await createSupabaseServerClient();
    
    // 2. 执行服务端退出登录
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('服务端登出错误:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    // 3. 手动清除相关的cookie
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const authCookies = allCookies.filter((cookie: RequestCookie) => 
      cookie.name.includes('sb-') || 
      cookie.name.includes('supabase') ||
      cookie.name.includes('-auth-') ||
      cookie.name.includes('anothermeweb')
    );
    
    // 清除所有认证相关的cookie
    for (const cookie of authCookies) {
      cookieStore.set({
        name: cookie.name,
        value: '',
        expires: new Date(0),
        path: '/'
      });
    }
    
    // 返回成功响应并添加重定向头部
    return NextResponse.json(
      { success: true, message: '成功登出' },
      { 
        status: 200,
        headers: {
          'Location': '/product'
        }
      }
    );
  } catch (error) {
    console.error('登出过程发生错误:', error);
    return NextResponse.json(
      { success: false, error: '登出过程发生错误' },
      { status: 500 }
    );
  }
} 