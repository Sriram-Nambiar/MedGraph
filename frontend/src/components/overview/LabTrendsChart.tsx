import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Activity } from 'lucide-react';
import { LabResult } from '../../types';

interface LabTrendsChartProps {
  labResults: LabResult[];
  onOpenEvidence: (recordId: string) => void;
}

export const LabTrendsChart: React.FC<LabTrendsChartProps> = ({ labResults }) => {
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
    <div className="bg-white dark:bg-zinc-900/30 border-2 border-[#bfdbfe] dark:border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#2563eb]" />
          <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#0f172a] dark:text-zinc-400">
            Laboratory Trajectory Over Time
          </h2>
        </div>

        {/* Test Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {availableTests.map((test) => (
            <button
              key={test.id}
              onClick={() => setSelectedTestId(test.id)}
              className={`px-3 py-1 text-xs rounded-lg font-mono font-bold transition-all ${
                selectedTestId === test.id
                  ? 'bg-[#1e3a8a] text-white shadow-sm ring-1 ring-[#1e3a8a]'
                  : 'bg-slate-100 hover:bg-[#eff6ff] text-slate-700 hover:text-[#1e3a8a]'
              }`}
            >
              {test.id.replace('TEST-', '')}
            </button>
          ))}
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#334155', fontFamily: 'monospace', fontWeight: 600 }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#334155', fontFamily: 'monospace', fontWeight: 600 }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border-2 border-[#bfdbfe] p-3 rounded-xl shadow-xl text-xs space-y-1 font-mono">
                        <div className="text-slate-500 font-semibold">{data.date}</div>
                        <div className="text-[#0f172a] font-extrabold text-sm">
                          {data.value} {data.unit}
                        </div>
                        <div className="text-[10px] text-rose-600 font-bold">Status: {data.flag}</div>
                        <div className="text-[10px] text-blue-700 font-bold">Source: [{data.sourceRecordId}]</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4.5, fill: '#1e3a8a', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 6.5, fill: '#2563eb' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center text-xs text-slate-500 font-mono">
          No records found for {selectedTestId}.
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono font-medium pt-2 border-t border-slate-100">
        <span>Unit of Measure: <strong>{currentTestInfo?.unit || 'standard'}</strong></span>
        <span>{chartData.length} laboratory data points recorded</span>
      </div>
    </div>
  );
};
