import { supabase } from './supabase/client';

export async function signOut() {
  try {
    // 先尝试使用客户端 supabase 退出
    const { error } = await supabase.auth.signOut();
    
    // 如果成功或客户端退出失败，调用服务端退出API确保彻底清除cookies
    await fetch('/api/user/logout', { 
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // 清除本地存储的用户数据
    if (typeof window !== 'undefined') {
      localStorage.removeItem('anothermeweb-auth');
      localStorage.removeItem('supabase-auth-token');
      localStorage.removeItem('pendingRegistration');
      
      // 设置退出登录标记cookie，告知中间件不要添加语言参数
      document.cookie = 'signout-redirect=true; path=/; max-age=10;'; // 10秒后自动过期
    }
    
    // 重定向到产品页面
    window.location.href = '/';
    
    return { error };
  } catch (error) {
    console.error('退出登录失败:', error);
    return { error };
  }
}

export async function updateUserProfile(updates: {
  name?: string;
  avatar_url?: string;
}) {
  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  });
  return { data, error };
}


