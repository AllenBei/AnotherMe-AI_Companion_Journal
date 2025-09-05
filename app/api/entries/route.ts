import { NextResponse } from 'next/server';
import createSupabaseServerClient from '@/lib/supabase/server';
import { z } from 'zod';
import { getDateRangeISO, formatToDate, formatToTimestampTZ, htmlToPlainTextServer } from '@/lib/utils';

// 定义内容项验证模式
const contentItemSchema = z.object({
  euuid: z.string().min(1),
  type: z.string().min(1),
  content: z.string().min(1),
  words_written: z.number().optional()
});

// 定义日记数据验证模式
const entrySchema = z.object({
  day_id: z.string().uuid().nullish(), // 可能是null，因为新建时可能不提供
  created_date: z.string().optional(), // 可选，API会自动处理
  entry_contents: contentItemSchema,
  created_year: z.string().optional(),
});

// 彻底替换旧的 getOrCreateDayId 函数
// 这个新函数是一个简单的RPC调用包装器
const getOrCreateDayId = async (timezone: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('get_or_create_day_id_for_today', {
    user_timezone: timezone
  });

  if (error) {
    console.error('Error in get_or_create_day_id_for_today RPC:', error);
    throw new Error('获取或创建日记ID失败');
  }

  if (!data) {
    throw new Error('RPC get_or_create_day_id_for_today returned no data');
  }

  return data;
};

// GET：查询日记
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
    const dayId = url.searchParams.get('day_id');
    const euuid = url.searchParams.get('euuid');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const bookName = url.searchParams.get('created_year');
    
    // 从查询参数中获取时区，如果没有提供，默认为UTC
    const timezone = url.searchParams.get('timezone') || 'UTC';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('page_size') || '10', 10);
    
    // 计算分页偏移量
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 构建查询
    let query = supabase
      .from('entries')
      .select(`
        *,
        entry_contents (*)
      `, { count: 'exact' })
      .eq('user_id', user.id);

    // 按特定day_id查询
    if (dayId) {
      query = query.eq('day_id', dayId);
    } 
    // 按日期查询 - **采纳用户的建议，使用更简洁、更可靠的created_date进行查询**
    else if (startDate) {
      query = query.eq('created_date', startDate);
    }

    // 按书名（年份）筛选
    if (bookName) {
      query = query.eq('created_year', bookName);
    }
    
    // 按创建时间降序排序
    query = query.order('created_at', { ascending: false });
    
    // 应用分页 - 仅当没有特定查询条件时才分页
    if (!dayId && !euuid && !startDate) {
      query = query.range(from, to);
    }
    
    // 执行查询
    let { data, error, count } = await query;

    if (error) {
      console.error('读取日记失败:', error);
      return NextResponse.json({ error: '读取日记失败' }, { status: 500 });
    }
    
    if (data) {
      // 为所有内容项添加纯文本版本
      data = data.map(entry => {
        if (entry.entry_contents && Array.isArray(entry.entry_contents)) {
          // 处理内容项
          const processedContents = entry.entry_contents.map((item: EntryItem) => ({
            ...item,
            text: htmlToPlainTextServer(item.content)
          }));
          processedContents.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          // 如果有 euuid，过滤内容项
          if (euuid) {
            const filteredContents = processedContents.filter((item: EntryItem) => item.euuid === euuid);
            if (filteredContents.length > 0) {
              return { ...entry, entry_contents: filteredContents };
            }
          } else {
            return { ...entry, entry_contents: processedContents };
          }
        }
        return entry; // 返回原始条目
      }).filter(Boolean); // 移除空条目
    }

    return NextResponse.json({ 
      success: true, 
      data,
      pagination: {
        page,
        pageSize,
        totalCount: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0
      }
    });
  } catch (error) {
    console.error('读取日记失败:', error);
    return NextResponse.json({ error: '读取日记失败' }, { status: 500 });
  }
}


// PUT：创建或更新日记
export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '用户未认证' }, { status: 401 });
    }

    const body = await request.json();

    // 从请求体中获取时区，如果没有提供，默认为UTC
    const timezone = body.timezone || 'UTC';

    // 验证整体结构
    const validationResult = entrySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        error: '数据验证失败',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    // 调用新的、时区感知的方法来获取day_id
    const dayId = await getOrCreateDayId(timezone);

    // 查找是否已有该 euuid 的内容
    const { data: existingContent, error: fetchError } = await supabase
      .from('entry_contents')
      .select('*')
      .eq('euuid', body.entry_contents.euuid)
      .eq('day_id', dayId)
      .maybeSingle();

    if (fetchError) {
      console.error('查询内容失败:', fetchError);
      return NextResponse.json({ error: '查询内容失败' }, { status: 500 });
    }

    if (existingContent) {
      // 更新已有内容
      const { error: updateError } = await supabase
        .from('entry_contents')
        .update({
          ...body.entry_contents,
          user_id: user.id,
          day_id: dayId,
          status: 'draft'
        })
        .eq('euuid', body.entry_contents.euuid)
        .eq('day_id', dayId);

      if (updateError) {
        console.error('更新内容失败:', updateError);
        return NextResponse.json({ error: '更新内容失败' }, { status: 500 });
      }
    } else {
      // 插入新内容
      const { error: insertError } = await supabase
        .from('entry_contents')
        .insert({
          ...body.entry_contents,
          user_id: user.id,
          day_id: dayId,
          status: 'draft'
        });

      if (insertError) {
        console.error('插入内容失败:', insertError);
        return NextResponse.json({ error: '插入内容失败' }, { status: 500 });
      }
    }

    // 更新 entries 表字段（如传入了新的 summary 等）
    // const updateData = {
    //   updated_at: formatToTimestampTZ(now),
    //   ...(body.created_year ? { created_year: body.created_year } : {}),
    //   ...(body.summary !== undefined ? { summary: body.summary } : {}),
    //   ...(body.encouragement !== undefined ? { encouragement: body.encouragement } : {}),
    // };

    // if (Object.keys(updateData).length > 1) {
    //   const { error: updateError } = await supabase
    //     .from('entries')
    //     .update(updateData)
    //     .eq('day_id', dayId)
    //     .eq('user_id', user.id);

    //   if (updateError) {
    //     console.error('更新日记失败:', updateError);
    //     return NextResponse.json({ error: '更新日记失败' }, { status: 500 });
    //   }
    // }

    return NextResponse.json({ success: true, data: { day_id: dayId } });
  } catch (error) {
    console.error('保存日记失败:', error);
    return NextResponse.json({ error: '保存日记失败' }, { status: 500 });
  }
}

// DELETE：删除日记或日记内容
export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // 获取当前认证用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '用户未认证' }, { status: 401 });
    }

    // 从URL中获取参数
    const url = new URL(request.url);
    const dayId = url.searchParams.get('day_id');
    const euuid = url.searchParams.get('euuid');

    if (!dayId && !euuid) {
      return NextResponse.json({ error: '必须提供day_id或euuid参数' }, { status: 400 });
    }

    // 删除整个日记条目
    if (dayId && !euuid) {
      // 先删除关联的内容
      const { error: deleteContentsError } = await supabase
        .from('entry_contents')
        .delete()
        .eq('day_id', dayId);

      if (deleteContentsError) {
        console.error('删除内容失败:', deleteContentsError);
        return NextResponse.json({ error: '删除内容失败' }, { status: 500 });
      }

      // 然后删除日记
      const { error: deleteEntryError } = await supabase
        .from('entries')
        .delete()
        .eq('day_id', dayId)
        .eq('user_id', user.id);

      if (deleteEntryError) {
        console.error('删除日记失败:', deleteEntryError);
        return NextResponse.json({ error: '删除日记失败' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // 删除特定内容项
    if (euuid) {
      // 先找到包含该euuid的日记
      const { data: content, error: findError } = await supabase
        .from('entry_contents')
        .select('day_id')
        .eq('euuid', euuid)
        .single();

      if (findError) {
        console.error('查询内容失败:', findError);
        return NextResponse.json({ error: '查询内容失败' }, { status: 500 });
      }

      if (!content) {
        return NextResponse.json({ error: '未找到指定的内容项' }, { status: 404 });
      }

      // 删除内容项
      const { error: deleteError } = await supabase
        .from('entry_contents')
        .delete()
        .eq('euuid', euuid);

      if (deleteError) {
        console.error('删除内容失败:', deleteError);
        return NextResponse.json({ error: '删除内容失败' }, { status: 500 });
      }

      // 检查是否还有其他内容
      const { data: remainingContents, error: checkError } = await supabase
        .from('entry_contents')
        .select('euuid')
        .eq('day_id', content.day_id);

      if (checkError) {
        console.error('检查剩余内容失败:', checkError);
        return NextResponse.json({ error: '检查剩余内容失败' }, { status: 500 });
      }

      // 如果没有其他内容，删除整个日记
      if (!remainingContents || remainingContents.length === 0) {
        const { error: deleteEntryError } = await supabase
          .from('entries')
          .delete()
          .eq('day_id', content.day_id)
          .eq('user_id', user.id);

        if (deleteEntryError) {
          console.error('删除日记失败:', deleteEntryError);
          return NextResponse.json({ error: '删除日记失败' }, { status: 500 });
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '无效的请求参数' }, { status: 400 });
  } catch (error) {
    console.error('删除操作失败:', error);
    return NextResponse.json({ error: '删除操作失败' }, { status: 500 });
  }
} 