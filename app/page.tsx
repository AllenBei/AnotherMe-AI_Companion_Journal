/*
 * @Author: Allen Bei
 * @Date: 2025-03-24 10:38:52
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-08-04 10:52:50
 * @FilePath: /AnotherMe_AI_Web/app/page.tsx
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen, All Rights Reserved. 
 */
"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/app/components/Layout'
import { useI18n } from '@/app/i18n'
import { Header } from '@/app/components/Header'
import { QuickEntry } from '@/app/components/QuickEntry'
import { JournalSection } from '@/app/components/JournalSection'
import { useUser } from '@/components/UserProvider'
import { PageLoading, LoadingDots } from './components/LoadingDots'
import { toast } from 'sonner'


export default function Home() {
  const router = useRouter();
  const selectedDayRef = useRef<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [todayEntries, setTodayEntries] = useState<any[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState<boolean>(false);
  const { language, setLanguage, t } = useI18n()
  const [isClient, setIsClient] = useState(false)
  const { user, loading, userProfile } = useUser()
  const prevRequestRef = useRef<string | null>(null);
  const analysisTimerRef = useRef<number | null>(null);
  const checkCountRef = useRef<number>(0);

  // 客户端渲染检测
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 密码设置检查：对于通过社交登录且未设置密码的用户，引导其设置密码
  // useEffect(() => {
  //   if (isClient && !loading && user) {
  //     // 检查用户是否只有社交登录 provider（没有 email provider）
  //     const hasEmailProvider = user.identities?.some(id => id.provider === 'email');
  //     const hasOnlySocialProviders = user.identities?.every(id => 
  //       ['google', 'github', 'facebook', 'twitter', 'apple', 'discord'].includes(id.provider)
  //     );
      
  //     const skippedSetup = sessionStorage.getItem('skippedPasswordSetup') === 'true';
  //     const completedSetup = sessionStorage.getItem('passwordSetupCompleted') === 'true';
      
  //     console.log('hasEmailProvider', hasEmailProvider)
  //     console.log('hasOnlySocialProviders', hasOnlySocialProviders)
  //     console.log('skippedSetup', skippedSetup)
  //     console.log('completedSetup', completedSetup)
      
  //     // 只有在用户只有社交登录且没有跳过设置且没有完成设置的情况下才引导设置密码
  //     if (hasOnlySocialProviders && !skippedSetup && !completedSetup) {
  //       router.push('/auth/set-password');
  //     }
  //   }
  // }, [isClient, loading, user, router]);

  // 用户状态检查（中间件已处理未登录重定向，这里主要用于显示加载状态）
  useEffect(() => {
    // 如果用户状态加载完成但没有用户信息，说明中间件可能还没生效
    // 这里可以添加额外的客户端检查，但通常中间件已经处理了重定向
    if (isClient && !loading && (!user || !userProfile)) {
      console.log(`[Root Page] User state: user=${!!user}, userProfile=${!!userProfile}, loading=${loading}`);
    }
  }, [user, userProfile, loading, isClient])

  // 同步用户语言偏好 - 数据库偏好优先级最高，但不干扰用户主动切换
  useEffect(() => {
    if (isClient && userProfile) {
      // 🔧 检查是否是用户主动切换，如果是则跳过强制同步，等待数据库更新完成
      const isUserInitiated = sessionStorage.getItem('user_initiated_language_change') === 'true';
      
      // 🔧 当 language_preference 为 null 时，默认使用 'en'
      const preferredLanguage = userProfile.language_preference || 'en';
      
      console.log(`[Language Sync] User profile data:`, {
        userEmail: userProfile.email,
        language_preference_raw: userProfile.language_preference,
        preferredLanguage,
        currentLanguage: language,
        isUserInitiated
      });
      
      if (preferredLanguage !== language && !isUserInitiated) {
        console.log(`[Language Sync] Setting language to ${preferredLanguage} (from DB: ${userProfile.language_preference})`);
        setLanguage(preferredLanguage, userProfile)
      } else if (isUserInitiated) {
        // 🔧 如果数据库偏好已经和当前语言一致，说明 API 更新成功，清除标记
        if (preferredLanguage === language) {
          console.log(`[Language Sync] User-initiated language change completed`);
          sessionStorage.removeItem('user_initiated_language_change');
        } else {
          console.log(`[Language Sync] Waiting for database update to complete`);
        }
      }
    }
  }, [userProfile?.language_preference, language, isClient, setLanguage])

  // 加载一周的日期
  useEffect(() => {
    // 初始日期设置移到这里统一处理，避免重复设置
    if (isClient && !loading) {
      // 只有在客户端渲染且加载完成时才设置日期
      setSelectedDay(new Date());
    }
  }, [isClient, loading]);

  // 同步 selectedDay 到 ref
  useEffect(() => {
    if (selectedDay) {
      selectedDayRef.current = selectedDay;
    }
  }, [selectedDay]);

  // 监听并处理分析状态的函数
  const checkAnalysisStatus = () => {
    // 检查 analysis_pending 是否为 true
    const isPending = sessionStorage.getItem('analysis_pending') === 'true';
    console.log("进入检测", isPending)
    if (isPending && !analysisTimerRef.current) {
      // 重置检查计数
      checkCountRef.current = 0;

      // 开始定时检查分析结果
      analysisTimerRef.current = window.setInterval(() => {
        const isCompleted = sessionStorage.getItem('analysis_completed') === 'true';
        const isFailed = sessionStorage.getItem('analysis_failed') === 'true';
        checkCountRef.current += 1;

        console.log("checkCountRef", checkCountRef.current)
        if (isCompleted || isFailed || checkCountRef.current >= 15) {
          // 清除所有相关的 sessionStorage 项
          sessionStorage.removeItem('analysis_pending');
          sessionStorage.removeItem('analysis_completed');
          sessionStorage.removeItem('analysis_failed');
          sessionStorage.removeItem('analysis_euuid');
          sessionStorage.removeItem('analysis_timestamp');

          // 停止定时器
          if (analysisTimerRef.current) {
            clearInterval(analysisTimerRef.current);
            analysisTimerRef.current = null;
          }
          console.log("分析完成，刷新日记内容")
          // 刷新日记内容
          fetchEntries(selectedDayRef.current);
        }
      }, 5000); // 每5秒检查一次
    }
  };

  // 将 fetchEntries 函数提取到组件级别，以便其他 useEffect 可以调用
  const fetchEntries = async (selectedDay?: Date) => {
    setIsLoadingEntries(true);
    // 添加缓存检查
    const dateStr = selectedDay ? formatDateForApi(selectedDay) : formatDateForApi(new Date());
    try {
      const response = await fetch(`/api/entries?start_date=${dateStr}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)
      const result = await response.json();

      if (result.success) {
        if (result.data.length > 0 && result.data[0].day_id) {
          sessionStorage.setItem('day_id', result.data[0].day_id);
          
          // 检查是否有正在处理的批量分析，如果当前日记已有分析数据，清除处理标记
          if (user?.id) {
            const processingKey = `batch_analysis_processing_${user.id}`
            const isProcessing = sessionStorage.getItem(processingKey)
            if (isProcessing && result.data[0].analysis_data) {
              console.log('[Batch Analysis] Detected completed analysis, clearing processing flag')
              sessionStorage.removeItem(processingKey)
              // 也清除检查缓存，让系统知道可以重新检查其他日期
              const sessionKey = `batch_analysis_checked_${user.id}`
              sessionStorage.removeItem(sessionKey)
            }
          }
        } else {
          // 删除day_id
          sessionStorage.removeItem('day_id');
        }
        setTodayEntries(result.data || []);
      } else {
        console.error('读取日记失败:', result.error);
        setTodayEntries([]);
      }
    } catch (error) {
      console.error('读取日记出错:', error);
      setTodayEntries([]);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  // 监听分析状态并更新日记
  useEffect(() => {
    if (!isClient || loading || !user || !userProfile) return;

    // 初始检查
    checkAnalysisStatus();

    // 设置 storage 变化事件监听器
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'analysis_pending' && e.newValue === 'true') {
        checkAnalysisStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 清理函数
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (analysisTimerRef.current) {
        console.log('清理定时analysisTimerRef')
        clearInterval(analysisTimerRef.current);
        analysisTimerRef.current = null;
      }
    };
  }, [isClient, loading, user, userProfile]);

  // 加载当天或选中日期的日记
  useEffect(() => {
    if (!isClient || loading || !user || !userProfile) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentSelectedDate = new Date(selectedDay);
    currentSelectedDate.setHours(0, 0, 0, 0);

    if (currentSelectedDate.getTime() > today.getTime()) {
      setTodayEntries([]);
      setIsLoadingEntries(false);
      prevRequestRef.current = null;
      return;
    }

    // 添加请求去重
    const requestId = JSON.stringify({
      date: formatDateForApi(selectedDay),
      user: user?.id
    });

    // 如果是第一次请求或者请求参数变化了，才执行 fetchEntries
    if (prevRequestRef.current !== requestId) {
      fetchEntries(selectedDay);
      prevRequestRef.current = requestId;
    }

  }, [selectedDay, isClient, loading, user, userProfile]);

     // 🎯 批量分析触发 - 检查并自动生成缺失的分析
   useEffect(() => {
     if (!isClient || loading || !user || !userProfile) return;

     // 智能缓存逻辑：结合时间和实际检查结果
     if (!user?.id) return
     
     const sessionKey = `batch_analysis_checked_${user.id}`
     const processingKey = `batch_analysis_processing_${user.id}`
     const lastChecked = sessionStorage.getItem(sessionKey)
     const isProcessing = sessionStorage.getItem(processingKey)
     const now = Date.now()
     const thirtyMinutes = 30 * 60 * 1000 // 30分钟检查一次
     const fiveMinutes = 5 * 60 * 1000 // 5分钟后检查处理结果

     // 如果正在处理中，5分钟后重新检查结果
     if (isProcessing) {
       const processingData = JSON.parse(isProcessing)
       if ((now - processingData.timestamp) > fiveMinutes) {
         console.log('[Batch Analysis] Checking if background processing completed...')
         sessionStorage.removeItem(processingKey) // 清除处理标记，重新检查
         sessionStorage.removeItem(sessionKey) // 清除检查缓存，强制重新检查
       } else {
         console.log('[Batch Analysis] Background processing in progress, waiting...')
         return
       }
     }

     // 如果30分钟内已经检查过且没有待分析数据，跳过
     if (lastChecked) {
       const checkData = JSON.parse(lastChecked)
       if ((now - checkData.timestamp) < thirtyMinutes && checkData.noPendingData) {
         console.log('[Batch Analysis] Skipped - no pending data within 30 minutes')
         return
       }
     }

     // 异步触发批量分析，不阻塞 UI
    //  const triggerBatchAnalysis = async () => {
    //    try {
    //      console.log('[Batch Analysis]', t('batchAnalysis.triggering'))
         
    //      const response = await fetch('/api/entries/trigger-batch-analysis', {
    //        method: 'POST',
    //        headers: {
    //          'Content-Type': 'application/json',
    //        },
    //        body: JSON.stringify({ days: 7 }) // 可配置天数
    //      })

    //      if (response.ok) {
    //        const result = await response.json()
    //        console.log('[Batch Analysis] Success:', result.message)
           
    //        // 智能记录：区分是否有待分析数据
    //        const cacheData = {
    //          timestamp: now,
    //          noPendingData: result.queued_count === 0
    //        }
    //        sessionStorage.setItem(sessionKey, JSON.stringify(cacheData))
           
    //        // 显示用户友好的提示
    //        if (result.queued_count > 0) {
    //          // 设置处理中标记
    //          const processingData = {
    //            timestamp: now,
    //            count: result.queued_count
    //          }
    //          sessionStorage.setItem(processingKey, JSON.stringify(processingData))
             
    //          // 更友好的提示信息
    //          toast.info(t('batchAnalysis.weeklyCheck'))
    //          console.log(`[Batch Analysis] ${t('batchAnalysis.weeklyCheck')} (${result.queued_count} days, ~${result.estimated_time_minutes} minutes)`)
    //        } else {
    //          console.log('[Batch Analysis]', t('batchAnalysis.noData'))
    //        }
    //      } else {
    //        console.error('[Batch Analysis] Failed:', await response.text())
    //        // 失败时不设置缓存，允许重试
    //        toast.error(t('batchAnalysis.error'))
    //      }
    //    } catch (error) {
    //      console.error('[Batch Analysis] Error:', error)
    //      toast.error(t('batchAnalysis.error'))
    //    }
    //  }

    //  // 延迟2秒后触发，让页面先加载完成
    //  const timeoutId = setTimeout(triggerBatchAnalysis, 2000)

    //  return () => {
    //    clearTimeout(timeoutId)
    //  }
   }, [isClient, loading, user, userProfile, t])

  // 格式化日期为YYYY-MM-DD格式，用于API调用
  const formatDateForApi = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 如果正在加载或未登录，显示加载界面
  if (!isClient || loading || !user || !userProfile) {
    return (
      <PageLoading />
    )
  }

  return (
    <Layout>
      <div className="container mx-auto py-4 max-w-3xl px-4">
        <Header
          selectedDate={selectedDay}
          isLoadingData={isLoadingEntries}
          onDateSelect={(date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const newSelectedDate = new Date(date);
            newSelectedDate.setHours(0, 0, 0, 0);

            setSelectedDay(date);

            if (newSelectedDate.getTime() > today.getTime()) {
              setTodayEntries([]);
              setIsLoadingEntries(false);
              prevRequestRef.current = null;
            } else {
              if (newSelectedDate.getDate() !== selectedDay.getDate() ||
                newSelectedDate.getMonth() !== selectedDay.getMonth() ||
                newSelectedDate.getFullYear() !== selectedDay.getFullYear()) {
                // Date changed, will trigger useEffect to fetch new data
              } else if (newSelectedDate.getTime() === selectedDay.getTime() && todayEntries.length === 0) {
                // Same date but no data, allow re-fetch
                prevRequestRef.current = null;
              }
            }
          }}
        />
        <QuickEntry isLoggedIn={!!user} />
        {isLoadingEntries ? (
          <div className="flex justify-center items-center py-10">
            <LoadingDots size="lg" />
          </div>
        ) : (
          <JournalSection
            todayEntries={todayEntries}
            isLoading={isLoadingEntries}
            onAnalysisComplete={() => {
              if (selectedDayRef.current) {
                console.log('分析完成，刷新日记条目');
                fetchEntries(selectedDayRef.current);
              }
            }}
          />
        )}
      </div>
    </Layout>
  )
}




