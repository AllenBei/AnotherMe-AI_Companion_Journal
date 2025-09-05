/*
 * @Author: Allen Bei
 * @Date: 2025-04-22 01:42:50
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-05-22 12:03:30
 * @FilePath: /AnotherMe_AI_Web/types/journal.ts
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */

// 定义日记类型
interface EntryItem extends Partial<EntryAISummaryItem> {
    euuid: string;
    type: string;
    content: string;
    text?: string;
    words_written?: number;
    created_at?: string;
    status: 'draft' | 'analysed';
}

interface EntryAISummaryItem {
    language: string;
    content_type: string;
    title: string;
    summary: string;
    summary_en: string;
    tags: string[];
    is_reflective: boolean;
    reflection_types?: string[];
    reflection_explanation?: string;
    // tracked_questions?: {
    //     question: string;
    //     context?: string;
    // }[];
    key_quotes?: {
        quote: string;
        type: string;
    }[];
    icon?: string;
    insight_path?: string;
    analogy?: string;
}