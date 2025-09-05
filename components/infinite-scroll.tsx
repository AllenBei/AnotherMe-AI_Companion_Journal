"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { MoveUp,Smile } from 'lucide-react'
import { useI18n } from '@/app/i18n'

interface InfiniteScrollProps {
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  children: React.ReactNode
  onRefresh?: () => Promise<void>
}

export function InfiniteScroll({ onLoadMore, hasMore, isLoading, children, onRefresh }: InfiniteScrollProps) {
  const { t } = useI18n()
  const loaderRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [startY, setStartY] = useState(0)
  const [pullDistance, setPullDistance] = useState(0)
  const REFRESH_THRESHOLD = 80 // 下拉刷新的阈值（像素）
  
  // 添加一个节流标志，避免重复触发loadMore
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(isLoading);
  
  // 更新isLoadingRef，以便在回调中访问最新的isLoading值
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // 优化的loadMore函数，添加节流控制
  const handleLoadMore = useCallback(() => {
    if (throttleTimerRef.current || isLoadingRef.current || !hasMore) return;
    
    // 调用外部传入的加载函数
    onLoadMore();
    
    // 设置节流定时器，防止短时间内重复触发
    throttleTimerRef.current = setTimeout(() => {
      throttleTimerRef.current = null;
    }, 1000); // 1秒内不重复触发
  }, [onLoadMore, hasMore]);

  // 使用Intersection Observer监听底部loader元素是否出现在视口中
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingRef.current) {
          console.log("Intersection detected, loading more...");
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px 0px" } // 提前200px开始加载，当10%的元素可见时触发
    );

    observer.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
      
      // 清除任何存在的节流定时器
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
    };
  }, [hasMore, handleLoadMore]);

  // 处理下拉刷新手势
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onRefresh) return;
    // 只有在滚动到顶部时才允许下拉刷新
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!onRefresh || startY === 0) return;
    // 计算下拉距离
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    
    // 只处理向下拉动
    if (distance > 0 && window.scrollY === 0) {
      // 增加一些阻力，避免拉得太远
      const resistedDistance = Math.min(distance * 0.5, 120);
      setPullDistance(resistedDistance);
      e.preventDefault(); // 防止滚动
    }
  };

  const handleTouchEnd = () => {
    if (!onRefresh || startY === 0) return;
    
    // 如果拉动距离超过阈值，触发刷新
    if (pullDistance > REFRESH_THRESHOLD) {
      setIsRefreshing(true);
      onRefresh().finally(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        setStartY(0);
      });
    } else {
      // 否则重置状态
      setPullDistance(0);
      setStartY(0);
    }
  };

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full"
    >
      {/* 下拉刷新指示器 */}
      {onRefresh && (
        <div 
          className="flex justify-center items-center text-gray-500 text-sm"
          style={{ 
            height: `${pullDistance}px`,
            opacity: pullDistance / REFRESH_THRESHOLD,
            transition: isRefreshing ? 'none' : 'height 0.2s ease-out'
          }}
        >
          {isRefreshing ? 
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#075071] mr-2"></div>
            <span>{t('entries.refreshing')}</span>
          </> : 
          <>
            <MoveUp className="w-4 h-4 mr-2" />
            <span>{t('entries.pull2refresh')}</span>
          </>
          }
        </div>
      )}

      {/* 内容 */}
      {children}

      {/* 底部加载更多指示器 */}
      <div 
        ref={loaderRef} 
        className="flex justify-center items-center py-6 text-gray-500 text-sm"
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#075071] mr-2"></div>
            <span>{t('entries.loadingMore')}</span>
          </div>
        ) : !hasMore ? (
          <>
            <Smile className="w-4 h-4 mr-2" />
            <span>{t('entries.noMoreData')}</span>
          </>
        ) : null}
      </div>
    </div>
  );
} 