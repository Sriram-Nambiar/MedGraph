import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { FlaskConical, TrendingUp, Info } from 'lucide-react';
import { LabResult } from '../../types';

interface LabTrendsChartProps {
  labResults: LabResult[];
  onOpenEvidence: (recordId: string) => void;
}

export const LabTrendsChart: React.FC<LabTrendsChartProps> = ({ labResults, onOpenEvidence }) => {
  // Available unique tests in patient records
  const availableTests = useMemo(() => {
    const map = new Map<string, { id: string; count: number; unit: string }>();
    for (const lr of labResults) {
      if (!map.has(lr.testId)) {
        map.set(lr.testId, { id: lr.testId, count: 0, unit: lr.unit });
      }
      map.get(lr.testId)!.count++;
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [labResults]);

  const [selectedTestId, setSelectedTestId] = useState<string>(() => {
    return availableTests[0]?.id || 'TEST-CREAT';
  });

  // Filtered and formatted data for chart
  const chartData = useMemo(() => {
    return labResults
      .filter((lr) => lr.testId === selectedTestId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((lr) => ({
        date: lr.date.split('T')[0],
        value: lr.value,
        unit: lr.unit,
        flag: lr.flag,
        recordId: lr.id,
        sourceRecordId: lr.sourceRecordId,
      }));
  }, [labResults, selectedTestId]);

  const currentTestInfo = availableTests.find((t) => t.id === selectedTestId);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
            Longitudinal Laboratory Trajectory
          </h2>
        </div>

        {/* Test Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {availableTests.map((test) => (
            <button
              key={test.id}
              onClick={() => setSelectedTestId(test.id)}
              className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${
                selectedTestId === test.id
                  ? 'bg-zinc-800 text-cyan-300 border border-cyan-800/80 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
              }`}
            >
              {test.id.replace('TEST-', '')} ({test.count})
            </button>
          ))}
        </div>
      </div>

      {/* Chart visualization */}
      {chartData.length > 0 ? (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'monospace' }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'monospace' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-zinc-950/95 border border-zinc-750 p-3 rounded-lg shadow-xl text-xs space-y-1 font-mono">
                        <div className="text-zinc-400">{data.date}</div>
                        <div className="text-white font-bold text-sm">
                          {data.value} {data.unit}
                        </div>
                        <div
                          className={`text-[10px] font-semibold ${
                            data.flag.includes('Critical')
                              ? 'text-rose-400'
                              : data.flag.includes('High') || data.flag.includes('Low')
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          Status: {data.flag}
                        </div>
                        <div className="pt-1 text-[10px] text-cyan-400">
                          Source: [{data.sourceRecordId}]
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#22d3ee"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#22d3ee', stroke: '#090a0f', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#67e8f9' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-xs text-zinc-500 font-mono">
          No longitudinal data points available for {selectedTestId}.
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-2 border-t border-zinc-800/80">
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          Measured in {currentTestInfo?.unit || 'standard units'}. Points correlate to clinical note documentation.
        </span>
        <span>{chartData.length} records analyzed</span>
      </div>
    </div>
  );
};
