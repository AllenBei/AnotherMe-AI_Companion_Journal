"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { useI18n } from '@/app/i18n'; // Assuming i18n setup is ready
import { StandardEmotion } from "@/lib/emotion-map"; // Import map and helper
import { LoadingDots } from "@/app/components/LoadingDots";

// Interface for the structure of an emotion object used for rendering bubbles
interface BubbleEmotion extends StandardEmotion { // Extends StandardEmotion from constants
  // name, emoji, color, etc. are inherited
  entries: number;      // from API entry_count
  proportion: number;   // from API proportion - used for radius calculation
  sourceEuuids: string[]; // from API euuids

  // Physics properties for the canvas animation
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

// Interface for the API response structure (matching the API output)
interface ApiEmotionData {
  name_en: string;
  name_zh: string;
  emoji: string;
  total_percent: number; // sum of percentages for this emotion across entries in range
  proportion: number;    // total_percent for this emotion / grand_total_percent for all emotions
  entry_count: number;
  euuids: string[];
  color?: string; // API will return a color, ensure this is uncommented
}

interface EmotionsApiResponse {
  total_emotion_percent: number; // sum of all total_percent values in the response
  total_emotions: ApiEmotionData[];
}

// Helper to calculate date ranges
const getIsoDateRange = (filter: string): { from: string; to: string } => {
  const to = new Date();
  let from = new Date();

  switch (filter) {
    case "this_week":
      from.setDate(to.getDate() - to.getDay() + (to.getDay() === 0 ? -6 : 1)); // Assuming week starts on Monday
      break;
    case "last_week":
      from.setDate(to.getDate() - to.getDay() - 6); // Assuming week starts on Monday
      break;
    case "this_month":
      from = new Date(to.getFullYear(), to.getMonth(), 1);
      break;
    case "last_6_months":
      from = new Date(to.getFullYear(), to.getMonth() - 5, 1); // Current month + 5 previous months
      break;
    default:
      // Default to this week or handle error
      from.setDate(to.getDate() - to.getDay() + (to.getDay() === 0 ? -6 : 1));
  }
  return {
    from: from.toISOString().split('T')[0], // YYYY-MM-DD
    to: to.toISOString().split('T')[0],     // YYYY-MM-DD
  };
};

export function EmotionalState() {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bubbles, setBubbles] = useState<BubbleEmotion[]>([]);
  const [timeFilter, setTimeFilter] = useState("this_week");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndSetEmotionData = async () => {
      setIsLoading(true);
      setError(null);
      const { from, to } = getIsoDateRange(timeFilter);

      try {
        const response = await fetch(`/api/insights/emotions?from=${from}&to=${to}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API request failed with status ${response.status}`);
        }
        const data: EmotionsApiResponse = await response.json();

        if (!data.total_emotions || data.total_emotions.length === 0) {
          setBubbles([]); // Set to empty if no emotions
          setIsLoading(false);
          return;
        }

        const newBubbles = data.total_emotions.map((apiEmotion): BubbleEmotion => {
          // API now returns fully processed emotion data, including id, name_en, name_zh, emoji, color.
          // No need to call getStandardizedEmotion here again.
          // Directly use fields from apiEmotion.
          // Generate a client-side id if not provided or ensure it exists, 
          // though the server-side getStandardizedEmotion should now provide an 'id'.
          // Let's assume apiEmotion might not have an 'id' yet, or we prefer a consistent client-side one for key prop.
          const id = (apiEmotion.name_en || "unknown").toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, '');

          return {
            id: id, // Use a generated or API-provided ID
            name_en: apiEmotion.name_en,
            name_zh: apiEmotion.name_zh,
            emoji: apiEmotion.emoji,
            color: apiEmotion.color || '#BDBDBD', // Fallback color if API somehow omits it
            entries: apiEmotion.entry_count,
            proportion: apiEmotion.proportion,
            sourceEuuids: apiEmotion.euuids,
            // Physics properties will be initialized by initBubbles
            x: 0, y: 0, vx: 0, vy: 0, radius: 0,
          };
        });
        setBubbles(newBubbles);
      } catch (err: any) {
        console.error("Failed to fetch emotion data:", err);
        setError(err.message || "Could not load data.");
        setBubbles([]); // Clear bubbles on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndSetEmotionData();
  }, [timeFilter]);

  useEffect(() => {
    const currentBubbles = [...bubbles];
    const canvas = canvasRef.current;
    if (!canvas || bubbles.length === 0) { // Don't run if no canvas or no bubbles
      // Clear canvas if bubbles are empty (e.g. after error or no data)
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const displayWidth = parseFloat(canvas.style.width) || canvas.clientWidth;
          const displayHeight = parseFloat(canvas.style.height) || canvas.clientHeight;
          ctx.fillStyle = '#FFFFFF'; // 设置白色背景
          ctx.fillRect(0, 0, displayWidth, displayHeight);
        }
      }
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      // 获取设备像素比
      const devicePixelRatio = window.devicePixelRatio || 1;
      
      // 获取CSS显示尺寸
      const displayWidth = parent.clientWidth;
      const displayHeight = parent.clientHeight;
      
      // 设置canvas的实际像素尺寸（乘以设备像素比）
      canvas.width = displayWidth * devicePixelRatio;
      canvas.height = displayHeight * devicePixelRatio;
      
      // 设置canvas的CSS显示尺寸
      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';
      
      // 缩放canvas context以匹配设备像素比
      if (ctx) {
        ctx.scale(devicePixelRatio, devicePixelRatio);
      }
      
      // 使用CSS显示尺寸初始化气泡
      initBubbles(displayWidth, displayHeight, currentBubbles);
      
      // 重置缓存的尺寸，让animate函数重新获取
      canvasDisplayWidth = displayWidth;
      canvasDisplayHeight = displayHeight;
    };

    const initBubbles = (width: number, height: number, bubblesToInit: BubbleEmotion[]) => {
      const isMobile = width < 500;
      const baseRadiusDesktop = 75; // Base radius for desktop (50 * 1.5)
      const baseRadiusMobile = 45;  // Base radius for mobile (30 * 1.5)
      // Max possible radius should be more conservative
      const maxPossibleRadius = Math.min(width, height) / (isMobile ? 4 : 6);

      bubblesToInit.forEach((bubble) => {
        // Calculate radius based on proportion.
        const baseSize = isMobile ? baseRadiusMobile : baseRadiusDesktop;
        // Ensure proportion is a number, default to a small value if not
        const proportionValue = typeof bubble.proportion === 'number' ? bubble.proportion : 0.01;

        // Adjust scaling factors for larger bubbles
        const scalingFactor = isMobile ? 120 : 180; // mobile: 80*1.5, desktop: 120*1.5
        let calculatedRadius = baseSize * 0.6 + proportionValue * scalingFactor;

        // Ensure radius is not too small, and not larger than maxPossibleRadius
        bubble.radius = Math.max(isMobile ? 18 : 30, Math.min(calculatedRadius, maxPossibleRadius)); // mobile: 12*2, desktop: 20*1.5

        // Ensure radius is not NaN if proportion was 0 or very small
        if (isNaN(bubble.radius) || bubble.radius <= 0) bubble.radius = isMobile ? 24 : 30;

        // Ensure bubbles don't spawn too close to edges
        const margin = bubble.radius + 10;
        bubble.x = Math.random() * (width - margin * 2) + margin;
        bubble.y = Math.random() * (height - margin * 2) + margin;
        bubble.vx = (Math.random() - 0.5) * 0.3; // Slower initial velocity
        bubble.vy = (Math.random() - 0.5) * 0.3;
      });
    };

    // 声明显示尺寸变量
    let canvasDisplayWidth = 0;
    let canvasDisplayHeight = 0;

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas(); // Initial call

    let animationFrameId: number;
    
    const animate = () => {
      if (!ctx || !canvas) return;

      // 只在必要时重新获取显示尺寸
      if (canvasDisplayWidth === 0 || canvasDisplayHeight === 0) {
        const parent = canvas.parentElement;
        canvasDisplayWidth = parent ? parent.clientWidth : 420;
        canvasDisplayHeight = parent ? parent.clientHeight : 400;
      }

      // 先用白色清除整个画布（使用显示尺寸）
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasDisplayWidth, canvasDisplayHeight);

      // 再清除矩形区域（这步可能可选，但为了确保完全清除）
      ctx.clearRect(0, 0, canvasDisplayWidth, canvasDisplayHeight);

      const centerX = canvasDisplayWidth / 2;
      const centerY = canvasDisplayHeight / 2;

      currentBubbles.forEach((bubble) => {
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);

        ctx.fillStyle = hexToRgba(bubble.color || '#FFFFFF', 0.3);
        ctx.fill();
        // 设置边框颜色为白色
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        const isMobile = canvasDisplayWidth < 500;
        const baseTextSize = bubble.radius / (isMobile ? 3.5 : 4.5); // Unified base size for text elements

        const emojiRenderSize = Math.max(isMobile ? 12 : 15, baseTextSize * 1.1); // Emoji slightly larger
        const fontSizeName = Math.max(isMobile ? 8 : 10, baseTextSize);
        const fontSizeEntries = Math.max(isMobile ? 7 : 9, baseTextSize * 0.8);

        ctx.textAlign = "center";
        ctx.fillStyle = "#333";

        // 1. Render Emoji (Top)
        const emojiY = bubble.y - fontSizeName * 0.3 - 5; // Position emoji above the name with top margin
        ctx.font = `${emojiRenderSize}px sans-serif`;
        ctx.fillText(bubble.emoji, bubble.x, emojiY);

        // 2. Render Name (Middle, below emoji)
        const language = localStorage.getItem('preferredLanguage');
        const displayName = language === 'zh' ? bubble.name_zh : bubble.name_en;
        const nameY = emojiY + fontSizeName * 1.2 + 5; // Position name below emoji with some spacing and bottom margin
        ctx.font = `bold ${fontSizeName}px sans-serif`;
        ctx.fillText(displayName, bubble.x, nameY);

        // 3. Render Entries count (Bottom, below name)
        const entriesY = nameY + fontSizeEntries * 1.3 + 5; // Position entries below name with bottom margin
        ctx.font = `${fontSizeEntries}px sans-serif`;
        ctx.fillStyle = "#666";
        ctx.fillText(`${bubble.entries} ${t('common.entries_count_suffix')}`, bubble.x, entriesY);

        // Physics calculations (gravity, friction, boundaries)
        const dxToCenter = centerX - bubble.x;
        const dyToCenter = centerY - bubble.y;
        const distToCenter = Math.sqrt(dxToCenter * dxToCenter + dyToCenter * dyToCenter);
        if (distToCenter > bubble.radius * 0.5) {
          bubble.vx += (dxToCenter / distToCenter) * 0.005;
          bubble.vy += (dyToCenter / distToCenter) * 0.005;
        }

        bubble.vx *= 0.98;
        bubble.vy *= 0.98;
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;

        if (bubble.x - bubble.radius < 0) { bubble.x = bubble.radius; bubble.vx *= -0.5; }
        if (bubble.x + bubble.radius > canvasDisplayWidth) { bubble.x = canvasDisplayWidth - bubble.radius; bubble.vx *= -0.5; }
        if (bubble.y - bubble.radius < 0) { bubble.y = bubble.radius; bubble.vy *= -0.5; }
        if (bubble.y + bubble.radius > canvasDisplayHeight) { bubble.y = canvasDisplayHeight - bubble.radius; bubble.vy *= -0.5; }
      });

      for (let i = 0; i < currentBubbles.length; i++) {
        for (let j = i + 1; j < currentBubbles.length; j++) {
          const b1 = currentBubbles[i];
          const b2 = currentBubbles[j];
          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = b1.radius + b2.radius;
          if (distance < minDistance) {
            const angle = Math.atan2(dy, dx);
            const overlap = minDistance - distance;
            // Resolve collision by moving bubbles apart along the collision angle
            // Move each bubble by half the overlap
            const moveX = (overlap / 2) * Math.cos(angle);
            const moveY = (overlap / 2) * Math.sin(angle);

            b1.x -= moveX;
            b1.y -= moveY;
            b2.x += moveX;
            b2.y += moveY;

            // Elastic collision: exchange velocities (simplified)
            const normalX = dx / distance;
            const normalY = dy / distance;
            const p = 2 * (b1.vx * normalX + b1.vy * normalY - b2.vx * normalX - b2.vy * normalY) / (1 / 1 + 1 / 1); // Assuming mass = 1

            b1.vx -= p * 1 * normalX;
            b1.vy -= p * 1 * normalY;
            b2.vx += p * 1 * normalX;
            b2.vy += p * 1 * normalY;
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    // 获取显示尺寸用于初始化气泡
    const parent = canvas.parentElement;
    const displayWidth = parent ? parent.clientWidth : 420;
    const displayHeight = parent ? parent.clientHeight : 400;
    initBubbles(displayWidth, displayHeight, currentBubbles); // Initialize with display size
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [bubbles, t]); // Rerun if bubbles data changes or language changes (for t function)

  const hexToRgba = (hex: string, alpha: number): string => {
    try {
      // 如果是rgba格式，只需替换透明度
      if (hex.startsWith('rgba')) {
        return hex.replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d\.]+\s*\)/,
          (_, r, g, b) => `rgba(${r}, ${g}, ${b}, ${alpha})`);
      }

      // 如果是RGB格式 (rgb(r, g, b))
      if (hex.startsWith('rgb')) {
        // 支持空格变体，如rgb(100, 149, 237)、rgb(100,149,237)
        const rgbMatch = hex.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1], 10);
          const g = parseInt(rgbMatch[2], 10);
          const b = parseInt(rgbMatch[3], 10);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
      }

      // 处理十六进制格式
      // Remove "#" if present
      hex = hex.replace(/^#/, '');

      // Handle shorthand (#FFF) form
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
      }

      // 确保hex是有效的6位十六进制
      if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
        return `rgba(255, 255, 255, ${alpha})`; // 返回半透明白色作为后备
      }

      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);

      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (error) {
      console.error("颜色转换错误:", error, "对应颜色:", hex);
      return `rgba(255, 255, 255, ${alpha})`; // 错误时返回半透明白色
    }
  };

  const handleTimeFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeFilter(event.target.value);
  };

  return (
    <div className="bg-white rounded-xl p-6 mb-4 shadow-[0_0_10px_rgba(0,0,0,0.03)] flex-1">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-500">
          {t('insights.emotional_state.title')}
        </h3>
        <div className="relative">
          <select
            value={timeFilter}
            onChange={handleTimeFilterChange}
            disabled={isLoading} // Disable select while loading
            className="text-xs text-gray-600 bg-gray-100 rounded-md py-1 pl-2 pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="this_week">{t('insights.emotional_state.this_week')}</option>
            <option value="last_week">{t('insights.emotional_state.last_week')}</option>
            <option value="this_month">{t('insights.emotional_state.this_month')}</option>
            <option value="last_6_months">{t('insights.emotional_state.last_6_months')}</option>
          </select>
          <ChevronDown className="absolute right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
        </div>
      </div>

      <div className="w-full h-[400px] relative ">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <LoadingDots /> 
          </div>
        )}
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <p className="text-red-500">Error: {error}</p>
          </div>
        )}
        {/* Show message if no bubbles and not loading and no error */}
        {!isLoading && !error && bubbles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400 text-center">{t('insights.emotional_state.no_data')}</p> {/* Add insights.emotional_state.no_data */}
          </div>
        )}
        <canvas ref={canvasRef} className="absolute inset-0 bg-white"></canvas>
      </div>
    </div>
  );
}

