import { NextResponse } from 'next/server';
import createSupabaseServerClient from '@/lib/supabase/server';
import { htmlToPlainTextServer } from '@/lib/utils';

// GET: 根据euuid获取特定内容
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // 获取当前认证用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '用户未认证' }, { status: 401 });
    }

    // 获取URL参数
    const url = new URL(request.url);
    const euuid = url.searchParams.get('euuid');

    if (!euuid) {
      return NextResponse.json({ error: '必须提供euuid参数' }, { status: 400 });
    }

    // 查询特定内容
    const { data: contentData, error: contentError } = await supabase
      .from('entry_contents')
      .select('*')
      .eq('euuid', euuid)
      .eq('user_id', user.id) // <-- 增加用户ID校验
      .single();

    if (contentError) {
      console.error('获取内容失败:', contentError);
      return NextResponse.json({ error: '获取内容失败' }, { status: 500 });
    }

    if (!contentData) {
      return NextResponse.json({ error: '未找到内容' }, { status: 404 });
    }

    // 添加纯文本版本
    const processedContent = {
      ...contentData,
      text: htmlToPlainTextServer(contentData.content)
    };

    return NextResponse.json({ success: true, data: processedContent });
  } catch (error) {
    console.error('获取内容失败:', error);
    return NextResponse.json({ error: '获取内容失败' }, { status: 500 });
  }
}

// PUT: 更新特定内容
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
    if (!body.euuid || !body.content) {
      return NextResponse.json({ error: '缺少有效的euuid或content数据' }, { status: 400 });
    }

    // 获取当前时间
    const now = new Date();
    const updatedAt = now.toISOString();

    // 更新内容
    const { data, error } = await supabase
      .from('entry_contents')
      .update({
        content: body.content,
        updated_at: updatedAt
      })
      .eq('euuid', body.euuid)
      .eq('user_id', user.id) // <-- 增加用户ID校验
      .select()
      .single();

    if (error) {
      console.error('更新内容失败:', error);
      return NextResponse.json({ error: '更新内容失败' }, { status: 500 });
    }

    // 添加纯文本版本
    const processedContent = {
      ...data,
      text: htmlToPlainTextServer(data.content)
    };

    return NextResponse.json({ success: true, data: processedContent });
  } catch (error) {
    console.error('更新内容失败:', error);
    return NextResponse.json({ error: '更新内容失败' }, { status: 500 });
  }
} 