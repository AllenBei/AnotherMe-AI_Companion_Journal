"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DailyEntryCard } from "@/components/daily-entry-card"
import Layout from '@/app/components/Layout'
import { InfiniteScroll } from "@/components/infinite-scroll"
import { useI18n } from '@/app/i18n'
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry"
import type { 
  DayEntry, 
  PaginationState
} from "@/types/entries"
import { PageLoading } from "../components/LoadingDots"

export default function EntriesPage() {
  const { t } = useI18n()
  const params = useParams();
  const router = useRouter();
  const year = (typeof params?.year === 'string' ? params.year : new Date().getFullYear().toString());
  
  // 直接使用DayEntry类型，不再转换
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [userTimezone, setUserTimezone] = useState('UTC');
  
  // 添加一个初始化标志和当前请求状态
  const initializedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const currentPageRef = useRef(1);

  const fetchEntries = useCallback(async (resetPage: boolean = false) => {
    // 防止重复请求
    if (isLoadingRef.current) return;
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      
      // 确定当前页码
      const page = resetPage ? 1 : currentPageRef.current;
      
      console.log(`Fetching entries for page ${page}`);
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString(),
        timezone: userTimezone
      });
      
      // 如果有year参数且不是当前年，按年份筛选
      if (year && year !== new Date().getFullYear().toString()) {
        queryParams.append('created_year', year);
      }
      
      const response = await fetch(`/api/entries?${queryParams.toString()}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // 直接使用API返回的数据，不再转换格式
        if (resetPage) {
          setEntries(result.data);
          currentPageRef.current = 1;
        } else {
          setEntries(prevEntries => [...prevEntries, ...result.data]);
        }
        
        // 更新分页信息
        setPagination(result.pagination);
        
        console.log(`Fetched page ${page}, total pages: ${result.pagination.totalPages}`);
      } else {
        console.error('获取日记失败', result.error);
        if (resetPage) {
          setEntries([]);
        }
      }
    } catch (error) {
      console.error('获取日记失败', error);
      if (resetPage) {
        setEntries([]);
      }
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [year, pagination.pageSize, userTimezone]);

  // 首次加载，使用useEffect + initializedRef确保只请求一次
  useEffect(() => {
    // 在组件挂载时获取并设置用户时区
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(tz);
    
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchEntries(true);
    }
  }, [fetchEntries]);

  // 加载更多数据
  const loadMore = useCallback(() => {
    // 检查是否正在加载
    if (isLoadingRef.current) return;
    
    // 检查是否已经到达最后一页
    if (currentPageRef.current >= pagination.totalPages) {
      console.log('已到达最后一页，不再加载更多');
      return;
    }
    
    // 设置下一页
    const nextPage = currentPageRef.current + 1;
    console.log(`加载更多，页码：${nextPage}`);
    
    // 更新当前页码
    currentPageRef.current = nextPage;
    
    // 请求数据
    fetchEntries(false);
  }, [pagination.totalPages, fetchEntries]);

  // 刷新数据
  const refreshData = useCallback(async (): Promise<void> => {
    // 重置页码为1
    currentPageRef.current = 1;
    
    // 请求新数据
    return fetchEntries(true).then(() => {
      console.log('数据刷新完成');
    });
  }, [fetchEntries]);

  // 判断是否还有更多数据可加载
  const hasMore = currentPageRef.current < pagination.totalPages;

  return (
    <Layout>
      <div className="min-h-screen bg-[#F6F5F1] px-4 pt-4 pb-20 md:p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            
            {/* <div className="flex items-center mb-8">
              <Link href="/entries" className="mr-4">
                <ChevronLeft className="w-6 h-6 text-[#075071]" />
              </Link>
              <h1 className="text-3xl font-bold text-[#075071]">{year}年日记</h1>
            </div> */}

            {/* <div className="flex items-center mb-8">
              <Link href="/entries" className="mr-4">
                <ChevronLeft className="w-6 h-6 text-[#075071]" />
              </Link>
              <h1 className="text-3xl font-bold text-[#075071]">{year}年日记</h1>
            </div> */}

            {loading && entries.length === 0 ? (
              <PageLoading />
            ) : entries.length > 0 ? (
              <InfiniteScroll 
                onLoadMore={loadMore}
                hasMore={hasMore}
                isLoading={loading}
                onRefresh={refreshData}
              >
                {/* 使用ResponsiveMasonry库实现瀑布流布局 */}
                <ResponsiveMasonry
                  columnsCountBreakPoints={{
                    0: 1,     // 移动端：单列
                    600: 1,   // 小屏：单列
                    768: 2,   // 平板：双列
                    1200: 3,  // 桌面：三列
                    1600: 4,  // 大屏：四列
                  }}
                  className="flex w-full max-w-full"
                >
                  <Masonry gutter="24px" className="box-border">
                    {entries
                      .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
                      .map((entry) => (
                        <div key={entry.day_id} className="w-full box-border pb-2 break-inside-avoid">
                          <DailyEntryCard dayEntry={entry} />
                        </div>
                      ))}
                  </Masonry>
                </ResponsiveMasonry>
              </InfiniteScroll>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  {t('entries.noRecords')}
                </p>
                <button
                  onClick={() => router.push('/entries/new?type=snippet')}
                  className="px-4 py-2 bg-[#075071] text-white rounded-lg hover:bg-[#053e58] transition-colors"
                >
                  {t('entries.startWriting')}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}

