/*
 * @Author: Allen Bei
 * @Date: 2025-01-20 00:00:00
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-06-27 16:01:51
 * @FilePath: /AnotherMe_AI_Web/app/utils/writing-prompts.ts
 * @Description: 写作引导问题库 - 帮助用户开始写日记
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */

// 写作引导问题库
export const WRITING_PROMPTS = {
    zh: [
      // 极简启动 (0思考)
      "现在手边离你最近的物品是什么？为什么在那里？",
      "手机电量还剩多少%？为什么捏～",
      "现在听到最清晰的声音是什么？",
      "窗外现在能看到什么特别的景物？上次你看到这个景物的时候是在干什么？",
      "用一个emoji形容此刻状态",
      "今天穿的衣服是什么颜色？",
      "今天第一口食物是什么？",
      "今天用手机多少次？主要干了什么？",
      "此刻最想做的动作？(伸懒腰/躺平...)",
      
      // 感官小雷达
      "今天闻到最特别的味道？",
      "指尖碰到最舒服的材质？",
      "眼前最抓眼的颜色是什么？",
      "今天最美味的一口食物？",
      "耳边残留的旋律是哪首歌？",
      "今天看到最可爱的移动物体？",
      "有没有试过闻到某个味道就想起某个场景？",
      // 碎片记忆罐
      "今天哪个瞬间让你嘴角上扬？",
      "手机相册最新照片是什么？",
      "聊天框里最有趣的对话截图？",
      "今天最意外的发现？",
      "发呆时在想什么奇怪的事？",
      "今天成功拖延了什么事？",
      "哪个小物件拯救了你的今天？",
      "突然想吃却吃不到的东西？",
      
      // 神奇比喻集
      "如果今天是一种天气？",
      "此刻的心情像什么动物？",
      "今天的能量值像哪种水果？",
      "此刻像什么质感的布料？",
      "今天像哪种口味的冰淇淋？",
      "现在的生活节奏像什么歌？",
      "今日像哪种交通工具？",
      
      // 微小关系树
      "今天谁让你觉得温暖？",
      "和陌生人最妙的默契时刻？",
      "收到最意外的消息来自谁？",
      "最想分享给____的小事？",
      "今天模仿了谁的说话方式？",
      "看到最可爱的生物是？",
      
      // 未来小纸船
      "明天早餐想吃什么？",
      "睡前最想听的歌？",
      "周末想去哪里玩啊！？",
      "希望明天发生的小奇迹？",
      "此刻最想穿越到哪？",
      "明天想尝试的新路线？",
      "想给明天自己留的便签"
    ],
    en: [
      // Instant Starters
      "What's the nearest item to you right now?",
      "What's your phone battery percentage?",
      "What's the weather outside your window?",
      "What's the most special view you can see outside your window?",
      "What's the last time you saw this view?",
      "What's the clearest sound you hear now?",
      "Describe your current mood with one emoji",
      "What color are your socks today?",
      "What was your first bite of food today?",
      "How's the lighting in your room? (bright/dim/warm)",
      "How many times did you unlock your phone? (approx)",
      "What's your body craving to do right now?",
      
      // Sensory Snaps
      "What's the most interesting smell today?",
      "What texture felt best under your fingers?",
      "Which color caught your eye today?",
      "What was your most delicious bite today?",
      "What song snippet is stuck in your ears?",
      "How does the air feel on your skin?",
      "What's the cutest moving thing you saw?",
      "What's the coolest texture you touched?",
      
      // Memory Fragments
      "What tiny moment made you smile?",
      "What's the latest photo in your gallery?",
      "What's the funniest text you received?",
      "What unexpected thing did you discover?",
      "What weird thought popped up while zoning out?",
      "What did you successfully procrastinate?",
      "What small object saved your day?",
      "What food are you randomly craving?",
      
      // Whimsical Metaphors
      "If today were weather, what would it be?",
      "What animal matches your current mood?",
      "What fruit represents your energy level?",
      "What fabric texture describes now?",
      "What ice cream flavor is today?",
      "What song tempo fits your rhythm?",
      "If today were transportation, what type?",
      
      // Tiny Connections
      "Who gave you warm fuzzies today?",
      "Best unspoken moment with a stranger?",
      "Most surprising message from whom?",
      "What small win would you tell ____?",
      "Whose speech pattern did you copy today?",
      "Cutest creature spotted today?",
      
      // Future Pebbles
      "What do you want for breakfast tomorrow?",
      "What song should play before sleep?",
      "What tiny miracle do you wish for tomorrow?",
      "Where would you teleport to right now?",
      "What new route will you try tomorrow?",
      "What sticky note for tomorrow's you?"
    ]
  }

// 随机获取一个写作提示
export const getRandomWritingPrompt = (language: 'zh' | 'en' = 'zh'): string => {
  const prompts = WRITING_PROMPTS[language]
  const randomIndex = Math.floor(Math.random() * prompts.length)
  return prompts[randomIndex]
}

// 获取多个随机写作提示（不重复）
export const getRandomWritingPrompts = (count: number, language: 'zh' | 'en' = 'zh'): string[] => {
  const prompts = WRITING_PROMPTS[language]
  const shuffled = [...prompts].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, prompts.length))
} 