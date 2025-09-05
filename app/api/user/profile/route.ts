/*
 * @Author: Allen Bei
 * @Date: 2025-04-08 13:01:35
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-09-02 13:48:42
 * @FilePath: /AnotherMe-AI_Companion_Journal/app/api/user/profile/route.ts
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
import { NextResponse } from 'next/server';
import createSupabaseServerClient from '@/lib/supabase/server';

// 🔧 移除缓存，确保数据实时性（特别是语言偏好切换）

export async function GET(request: Request) {
    try {
        const supabase = await createSupabaseServerClient();
        // 使用getUser代替getSession，更安全的方式获取用户信息
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            // 如果是认证会话缺失，不输出错误日志，这是正常的未登录状态
            if (error.message?.includes('Auth session missing') || error.message?.includes('session_missing')) {
                return NextResponse.json(
                    { user: null, error: 'Not authenticated' },
                    { status: 401 }
                );
            }

            // 其他认证错误才记录日志
            console.error('获取用户失败:', error);
            return NextResponse.json(
                { user: null, error: error.message },
                { status: 401 }
            );
        }

        if (!user) {
            return NextResponse.json(
                { user: null },
                { status: 200 }
            );
        }

        // 🔧 直接查询数据库，确保数据实时性

        // 获取用户附加信息
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('auid, name, email, avatar_url, language_preference, ip_address, ip_country, created_at')
            .eq('auid', user.id)
            .single();
            
        // 🔧 添加调试日志，查看现有用户的语言偏好
        if (userData) {
            console.log(`[Profile GET] Existing user language_preference:`, {
                userEmail: user.email,
                language_preference: userData.language_preference,
                userAuid: user.id
            });
        }

        // 如果用户不存在于users表中，创建新用户记录
        if (userError && userError.code === 'PGRST116') {
            const isVerified = !!user.email_confirmed_at ||
                (user.phone_confirmed_at && !!user.phone) ||
                (user.identities && user.identities.some((i: any) => i.provider !== 'email'));

            if (isVerified) {
                const displayName = user.user_metadata?.name ||
                    user.user_metadata?.display_name ||
                    user.email?.split('@')[0] || '';

                // 🔧 优先从 cookie 检测用户主动选择的语言，否则默认为 'en'
                // 如果用户之前在前端选择过语言，会存储在 cookie 中
                const cookieLang = (request as any).cookies?.get?.('preferredLanguage')?.value;
                const defaultLanguage = (cookieLang === 'zh' || cookieLang === 'en') ? cookieLang : 'en';
                
                console.log(`[Profile Creation] Setting language for new user:`, {
                    cookieLang,
                    defaultLanguage,
                    userEmail: user.email
                });

                const { data: insertData, error: insertError } = await supabase
                    .from('users')
                    .insert([{
                        auid: user.id,
                        email: user.email,
                        name: displayName,
                        providers: [user.app_metadata?.provider || 'email'],
                        status: 1,
                        email_verified: !!user.email_confirmed_at,
                        language_preference: defaultLanguage  // 👈 修改：优先使用 cookie，否则默认为 'en'
                    }])
                    .select();

                if (insertError) {
                    console.error('创建用户失败:', insertError);
                    return NextResponse.json(
                        { user: user, userProfile: null },
                        { status: 200 }
                    );
                }

                return NextResponse.json(
                    { user: user, userProfile: insertData[0] },
                    { status: 200 }
                );
            }
        }

        return NextResponse.json(
            { user: user, userProfile: userData },
            { status: 200 }
        );
    } catch (error) {
        // 只有真正的系统错误才记录日志
        if (error && !error.toString().includes('Auth session missing')) {
            console.error('会话API错误:', error);
        }

        return NextResponse.json(
            { user: null, error: '获取用户失败' },
            { status: 500 }
        );
    }
}
