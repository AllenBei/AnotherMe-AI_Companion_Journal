/*
 * @Author: Allen Bei
 * @Date: 2025-03-25 19:55:29
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-08-22 17:03:07
 * @FilePath: /AnotherMe-AI_Companion_Journal/lib/supabase/server.ts
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    const cookie = cookieStore.get(name);
                    return cookie?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    console.log(`移除Cookie: ${name}`);
                    try {
                        cookieStore.set({ name, value: '', ...options });
                        console.log(`Cookie ${name} 移除成功`);
                    } catch (err) {
                        console.error(`移除Cookie ${name} 失败:`, err);
                    }
                },
            },
        }
    );
} 