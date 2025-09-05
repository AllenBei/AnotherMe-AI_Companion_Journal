import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, GSAPSplitText);

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string | ((t: number) => number);
  splitType?: "chars" | "words" | "lines" | "words, chars";
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  textAlign?: React.CSSProperties["textAlign"];
  onLetterAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = "",
  delay = 100,
  duration = 0.6,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  onLetterAnimationComplete,
}) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const animationCompletedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    
    // 安全检查：确保元素存在、文本有效、且动画未完成
    if (!el || !text || typeof text !== 'string' || text.trim() === '' || animationCompletedRef.current) {
      return;
    }

    let cleanupFunction: (() => void) | undefined;

    // 检查字体是否已加载（如果支持的话）
    const initializeSplitText = async () => {
      try {
        // 等待字体加载完成
        if ('fonts' in document) {
          await document.fonts.ready;
        } else {
          // 如果不支持 document.fonts API，添加短暂延迟
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 再次检查元素是否还存在且有效
        if (!el.isConnected || !text || typeof text !== 'string') {
          return;
        }

        const absoluteLines = splitType === "lines";
        if (absoluteLines) el.style.position = "relative";

        const splitter = new GSAPSplitText(el, {
          type: splitType,
          absolute: absoluteLines,
          linesClass: "split-line",
        });

        let targets: Element[];
        switch (splitType) {
          case "lines":
            targets = splitter.lines;
            break;
          case "words":
            targets = splitter.words;
            break;
          case "words, chars":
            targets = [...splitter.words, ...splitter.chars];
            break;
          default:
            targets = splitter.chars;
        }

        // 确保 targets 有效
        if (!targets || targets.length === 0) {
          console.warn('SplitText: No targets found for splitting');
          splitter.revert();
          return;
        }

        targets.forEach((t) => {
          (t as HTMLElement).style.willChange = "transform, opacity";
        });

        const startPct = (1 - threshold) * 100;
        const m = /^(-?\d+)px$/.exec(rootMargin);
        const raw = m ? parseInt(m[1], 10) : 0;
        const sign = raw < 0 ? `-=${Math.abs(raw)}px` : `+=${raw}px`;
        const start = `top ${startPct}%${sign}`;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: "play none none none",
            once: true,
          },
          smoothChildTiming: true,
          onComplete: () => {
            animationCompletedRef.current = true;
            gsap.set(targets, {
              ...to,
              clearProps: "willChange",
              immediateRender: true,
            });
            onLetterAnimationComplete?.();
          },
        });

        tl.set(targets, { ...from, immediateRender: false, force3D: true });
        tl.to(targets, {
          ...to,
          duration,
          ease,
          stagger: delay / 1000,
          force3D: true,
        });

        cleanupFunction = () => {
          tl.kill();
          ScrollTrigger.getAll().forEach((t) => t.kill());
          gsap.killTweensOf(targets);
          splitter.revert();
        };
      } catch (error) {
        console.warn('SplitText initialization failed:', error);
        // 如果 SplitText 初始化失败，至少确保文本可见
        if (el) {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      }
    };

    initializeSplitText();

    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, [
    text,
    delay,
    duration,
    ease,
    splitType,
    from,
    to,
    threshold,
    rootMargin,
    onLetterAnimationComplete,
  ]);

  // 如果文本无效，返回空内容
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return null;
  }

  return (
    <p
      ref={ref}
      className={`split-parent overflow-hidden inline-block whitespace-normal ${className}`}
      style={{
        textAlign,
        wordWrap: "break-word",
      }}
    >
      {text}
    </p>
  );
};

export default SplitText;
