import React from 'react';
import { LineChart, Line } from 'recharts';
import { Language } from '../types';
import { StorageService } from '../lib/storage';

interface SparklineHeaderTrendProps {
  userId: string;
  lang: Language;
}

export default function SparklineHeaderTrend({ userId, lang }: SparklineHeaderTrendProps) {
  const [data, setData] = React.useState<{ score: number }[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    
    const fetchAndFormatTrend = () => {
      const history = StorageService.getHistory(userId) || [];
      const scoredSessions = history
        .filter((h: any) => typeof h.score === 'number')
        .map((h: any) => ({ score: h.score }));

      // Reverse so it's in chronological order (history is saved newest-first)
      const chronological = [...scoredSessions].reverse();

      if (chronological.length === 0) {
        setData([
          { score: 0 },
          { score: 0 }
        ]);
      } else if (chronological.length === 1) {
        const current = chronological[0].score;
        const start = Math.max(50, current - 12);
        setData([
          { score: start },
          { score: Math.round((start + current) / 2) },
          { score: current }
        ]);
      } else {
        setData(chronological);
      }
    };

    fetchAndFormatTrend();

    // Listen for progress updates or session completion events
    window.addEventListener('shana_progress_update', fetchAndFormatTrend);
    return () => {
      window.removeEventListener('shana_progress_update', fetchAndFormatTrend);
    };
  }, [userId]);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1.5 bg-stone-950/45 px-2 py-0.5 rounded border border-stone-800/60 h-5.5 select-none shrink-0 animate-pulse">
        <span className="text-[8px] font-mono font-extrabold text-stone-600 uppercase tracking-wider">
          {lang === 'FR' ? "TENDANCE" : "TREND"}
        </span>
        <div className="w-12 h-2.5 bg-stone-800 rounded" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-stone-950/45 px-2 py-0.5 rounded-lg border border-stone-850 h-5.5 select-none shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
      <span className="text-[8px] font-mono font-black text-stone-500 uppercase tracking-widest leading-none">
        {lang === 'FR' ? "TENDANCE" : "TREND"}
      </span>
      <div className="flex items-center h-full">
        <LineChart width={44} height={11} data={data}>
          <Line
            type="monotone"
            dataKey="score"
            stroke="#10B981" // Vivid Emerald Green
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </div>
    </div>
  );
}
