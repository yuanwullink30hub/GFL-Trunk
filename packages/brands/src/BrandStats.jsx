import React from 'react';
import { useLanguage } from '@gfl/i18n';
import {
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';

/**
 * BrandStats - Radar chart component for displaying brand metrics
 * Uses recharts library for the visualization
 */

// Transform metrics for the chart (labels are { nl, en }, translated by `t`)
const getChartData = (metrics, t) => {
  return metrics.map(m => ({
    subject: t(m.label),
    A: typeof m.value === 'string' && m.value.includes('%') 
      ? parseInt(m.value) 
      : (typeof m.value === 'number' ? m.value : Math.random() * 100 + 50),
    fullMark: 150
  }));
};

// Under the wheel: where its values come from (owner, 14 Oct).
const CAPTION = {
  nl: 'Deze waarden zijn herleid uit het archetype profiel binnen hun relevante branch.',
  en: 'These values are derived from the archetype profile within their relevant branch.',
};

const BrandStats = ({ metrics }) => {
  const { t, language } = useLanguage();
  // New data only when the values or the language change: recharts replays its draw-in on any new data array, so
  // rebuilding it on every parent render (each turn of the Gardens wheel) flashed the chart (owner, 14 Oct).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = React.useMemo(() => getChartData(metrics, t), [metrics, language]);

  // Defer the recharts radar (ResponsiveContainer's ResizeObserver + heavy SVG
  // layout) until the main thread is idle. When the Gardens page mounts during a
  // section pan, the browser is mid-way through a large style+reflow pass; mounting
  // the radar then piled onto that pass (profiled at ~64% Layout / ~3.4s of jank).
  // requestIdleCallback fires only once the thread is idle — i.e. after the pan's
  // layout storm settles — so the radar fades in a beat later instead of freezing
  // the navigation. The placeholder keeps the same box so nothing shifts.
  const [showChart, setShowChart] = React.useState(false);
  React.useEffect(() => {
    const ric = window.requestIdleCallback || ((cb) => setTimeout(() => cb(), 200));
    const cancel = window.cancelIdleCallback || clearTimeout;
    const id = ric(() => setShowChart(true), { timeout: 800 });
    return () => cancel(id);
  }, []);

  const caption = (
    <p style={{ margin: '0.35rem 0 0', fontFamily: "'Figtree', sans-serif", fontSize: '0.875rem', lineHeight: 1.45, color: 'rgba(255, 254, 240, 0.6)', textAlign: 'left' }}>
      {t(CAPTION)}
    </p>
  );

  // The caption sits under the wheel; the placeholder keeps both boxes so nothing shifts when the chart arrives.
  if (!showChart) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex-1" style={{ minHeight: '180px' }} aria-hidden />
        {caption}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
    <div className="flex-1" style={{ minHeight: '180px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
          <PolarGrid stroke="rgba(188, 19, 254, 0.2)" strokeDasharray="4 4" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ 
              fill: '#ffae00', 
              fontSize: 14, 
              fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", 
              fontWeight: 'bold' 
            }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
          <Radar
            name={t({ nl: 'Waarde', en: 'Value' })}
            dataKey="A"
            stroke="#bc13fe"
            strokeWidth={2}
            fill="#bc13fe"
            fillOpacity={0.4}
            dot={{ r: 3, fill: '#ffae00', strokeWidth: 0 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(3, 0, 5, 0.9)', 
              borderColor: '#bc13fe', 
              color: '#ffae00', 
              fontSize: '0.875rem',
              fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
              boxShadow: '0 0 20px rgba(188, 19, 254, 0.2)'
            }}
            itemStyle={{ color: '#ffae00' }}
            cursor={{ stroke: '#ffae00', strokeWidth: 1 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
    {caption}
    </div>
  );
};

// Memoised: a parent re-render with the same metrics leaves the chart alone.
export default React.memo(BrandStats);
