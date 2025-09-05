/*
 * @Author: Allen Bei
 * @Date: 2025-03-25 19:46:20
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-09-02 11:31:22
 * @FilePath: /AnotherMe-AI_Companion_Journal/middleware.ts
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// 语言检测配置
const SUPPORTED_LANGUAGES = ['en', 'zh'] as const;
// 🔧 修复：与 app/i18n/index.ts 保持一致的默认语言配置
const CONFIGURABLE_DEFAULT_LANGUAGE = 'en' as const;
const DEFAULT_LANGUAGE = CONFIGURABLE_DEFAULT_LANGUAGE;

type Language = typeof SUPPORTED_LANGUAGES[number];

// 语言检测函数
function detectLanguage(request: NextRequest): Language {
  const { searchParams } = request.nextUrl;

  // 1. URL参数优先级最高
  const urlLang = searchParams.get('lang');
  if (urlLang && SUPPORTED_LANGUAGES.includes(urlLang as Language)) {
    return urlLang as Language;
  }

  // 2. localStorage preferredLanguage (从cookie中读取，因为中间件无法访问localStorage)
  const storedLang = request.cookies.get('preferredLanguage')?.value;
  if (storedLang && SUPPORTED_LANGUAGES.includes(storedLang as Language)) {
    return storedLang as Language;
  }

  // 3. 浏览器语言检测
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    // console.log(`[Middleware Language Detection] Accept-Language: ${acceptLanguage}`);

    // 解析 Accept-Language 头，格式如: "zh-CN,zh;q=0.9,en;q=0.8"
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [locale, qValue] = lang.trim().split(';q=');
        return {
          locale: locale.toLowerCase(),
          quality: qValue ? parseFloat(qValue) : 1.0
        };
      })
      .sort((a, b) => b.quality - a.quality); // 按质量值排序

    console.log(`[Middleware Language Detection] Parsed languages:`, languages);

    // 🔧 修复：按权重顺序检查支持的语言，找到第一个支持的就返回
    for (const { locale, quality } of languages) {
      console.log('locale',locale)
      if (locale.startsWith('en')) {
        console.log(`[Middleware Language Detection] Found English with quality ${quality}, returning 'en'`);
        return 'en';
      }
      if (locale.startsWith('zh')) {
        console.log(`[Middleware Language Detection] Found Chinese with quality ${quality}, returning 'zh'`);
        return 'zh';
      }
    }
  }

  // 4. 默认fallback

  return DEFAULT_LANGUAGE;
}

// 轻量级认证状态检查 - 只检查token是否存在，不调用API
function hasAuthToken(request: NextRequest): boolean {
  // 检查 Supabase 认证相关的 cookies
  const accessToken = request.cookies.get('sb-access-token')?.value ||
    request.cookies.get('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token')?.value;

  // 检查 session cookies
  const authCookies = request.cookies.getAll().filter(cookie =>
    cookie.name.includes('supabase') ||
    cookie.name.includes('sb-') ||
    cookie.name.includes('auth-token')
  );

  return authCookies.length > 0 && authCookies.some(cookie => cookie.value && cookie.value !== '');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If the request is for an auth callback, pass it through without Supabase session handling.
  // The client-side page or route handler will handle token exchange.
  if (pathname === '/auth/callback' || pathname === '/auth/phone-magic-link-callback') {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  );

  // 处理根路径重定向逻辑 - 使用轻量级token检查
  if (pathname === '/') {
    const hasToken = hasAuthToken(request);

    if (!hasToken) {
      // 检查是否是从 signOut 重定向的请求 (通过 referrer 或者特殊cookie标记)
      const isSignOutRedirect = request.cookies.get('signout-redirect')?.value === 'true';
      
      if (isSignOutRedirect) {
        // 如果是退出登录的重定向，直接重定向到 / 不添加语言参数
        const redirectUrl = new URL('/', request.url);
        console.log(`[Sign Out Redirect] Redirecting to product page without lang param`);
        
        // 创建响应并清除标记cookie
        const response = NextResponse.redirect(redirectUrl);
        response.cookies.delete('signout-redirect');
        return response;
      } else {
        // 正常情况下，未登录用户重定向到根路径，不添加语言参数
        const redirectUrl = new URL('/auth/login', request.url);
        console.log(`[Root Redirect] No auth token found, redirecting to: ${redirectUrl.pathname}`);
        return NextResponse.redirect(redirectUrl);
      }
    } else {
      // 有token，允许访问首页（具体的用户验证由页面组件负责）
      console.log(`[Root Redirect] Auth token found, allowing access to home page`);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
