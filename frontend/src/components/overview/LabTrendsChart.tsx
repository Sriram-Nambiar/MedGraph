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
    <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/60">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-400">
            Laboratory Trajectory Over Time
          </h2>
        </div>

        {/* Test Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {availableTests.map((test) => (
            <button
              key={test.id}
              onClick={() => setSelectedTestId(test.id)}
              className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${
                selectedTestId === test.id
                  ? 'bg-zinc-800 text-white font-medium border border-zinc-700 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {test.id.replace('TEST-', '')}
            </button>
          ))}
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="h-56 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2028" />
              <XAxis
                dataKey="date"
                stroke="#52525b"
                tick={{ fontSize: 10, fill: '#71717a', fontFamily: 'monospace' }}
              />
              <YAxis
                stroke="#52525b"
                tick={{ fontSize: 10, fill: '#71717a', fontFamily: 'monospace' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg shadow-xl text-xs space-y-1 font-mono">
                        <div className="text-zinc-500">{data.date}</div>
                        <div className="text-white font-semibold">
                          {data.value} {data.unit}
                        </div>
                        <div className="text-[10px] text-zinc-400">Status: {data.flag}</div>
                        <div className="text-[10px] text-zinc-500">[{data.sourceRecordId}]</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#f4f4f5"
                strokeWidth={2}
                dot={{ r: 3.5, fill: '#ffffff', stroke: '#09090b', strokeWidth: 1.5 }}
                activeDot={{ r: 5, fill: '#ffffff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center text-xs text-zinc-500 font-mono">
          No records found for {selectedTestId}.
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1">
        <span>Unit: {currentTestInfo?.unit || 'standard'}</span>
        <span>{chartData.length} data points recorded</span>
      </div>
    </div>
  );
};
