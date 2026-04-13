import { useMemo } from 'react';
import type { TikTokVideo } from './useTikTokData';

export type HookArchetype =
  | 'question'
  | 'number'
  | 'pov'
  | 'story'
  | 'challenge'
  | 'other';

export interface HookStat {
  archetype: HookArchetype;
  labelKey: string;       // i18n key for display name
  count: number;
  avgViews: number;
  avgLikes: number;
  avgEngagement: number;  // (likes + comments) / views * 100
}

export interface HookDatabaseResult {
  hookStats: HookStat[];
  topVideos: (TikTokVideo & { archetype: HookArchetype })[];
  bestArchetype: HookArchetype | null;
}

// Classify a video title into a hook archetype using regex patterns
const classifyHook = (title: string): HookArchetype => {
  const t = title.toLowerCase().trim();
  if (/^(vad|hur|varför|kan du|would you|what if|did you|do you|have you|why|how|when)/i.test(t)) return 'question';
  if (/^\d|^[1-9]\s*(saker|tips|reasons|mistakes|sätt|steg|ways)/i.test(t)) return 'number';
  if (/^pov[:|\s]/i.test(t)) return 'pov';
  if (/(berättelse|story|the day|the time|when i|när jag|en gång|minns du)/i.test(t)) return 'story';
  if (/(prova|try|challenge|vi testade|tested|experiment|put to the test)/i.test(t)) return 'challenge';
  return 'other';
};

const ARCHETYPE_LABEL_KEYS: Record<HookArchetype, string> = {
  question: 'hooks.type_question',
  number:   'hooks.type_number',
  pov:      'hooks.type_pov',
  story:    'hooks.type_story',
  challenge:'hooks.type_challenge',
  other:    'hooks.type_other',
};

export const useHookDatabase = (videos: TikTokVideo[]): HookDatabaseResult => {
  return useMemo(() => {
    if (!videos || videos.length === 0) {
      return { hookStats: [], topVideos: [], bestArchetype: null };
    }

    // Annotate each video with its archetype
    const annotated = videos.map(v => ({
      ...v,
      archetype: classifyHook(v.title || ''),
    }));

    // Group by archetype
    const groups: Record<HookArchetype, typeof annotated> = {
      question: [], number: [], pov: [], story: [], challenge: [], other: [],
    };
    annotated.forEach(v => groups[v.archetype].push(v));

    // Build stats per archetype
    const hookStats: HookStat[] = (Object.keys(groups) as HookArchetype[])
      .map(archetype => {
        const vids = groups[archetype];
        if (vids.length === 0) return null;
        const totalViews = vids.reduce((s, v) => s + (v.views || 0), 0);
        const totalLikes = vids.reduce((s, v) => s + (v.likes || 0), 0);
        const totalComments = vids.reduce((s, v) => s + (v.comments || 0), 0);
        const avgViews = Math.round(totalViews / vids.length);
        const avgLikes = Math.round(totalLikes / vids.length);
        const avgEngagement = totalViews > 0
          ? parseFloat(((totalLikes + totalComments) / totalViews * 100).toFixed(1))
          : 0;
        return {
          archetype,
          labelKey: ARCHETYPE_LABEL_KEYS[archetype],
          count: vids.length,
          avgViews,
          avgLikes,
          avgEngagement,
        };
      })
      .filter(Boolean) as HookStat[];

    // Sort by average views descending
    hookStats.sort((a, b) => b.avgViews - a.avgViews);

    // Top 5 videos by views (excluding "other" archetype if possible)
    const topVideos = [...annotated]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);

    const bestArchetype = hookStats.length > 0 ? hookStats[0].archetype : null;

    return { hookStats, topVideos, bestArchetype };
  }, [videos]);
};
