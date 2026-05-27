import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function LiveCharts({ data }) {
  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="t" hide />
          <YAxis stroke="#475569" fontSize={10} tickFormatter={(val) => val > 100 ? (val/1000).toFixed(1)+'k' : val.toFixed(0)} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', fontSize: '12px' }}
            itemStyle={{ color: '#cbd5e1' }}
            labelStyle={{ display: 'none' }}
          />
          
          <Line 
            type="monotone" 
            dataKey="Attention" 
            name="Attention Level"
            stroke="#06b6d4" 
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line 
            type="monotone" 
            dataKey="Meditation" 
            name="Meditation Level"
            stroke="#8b5cf6" 
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line 
            type="monotone" 
            dataKey="AlphaLow" 
            name="Alpha Band"
            stroke="#10b981" 
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line 
            type="monotone" 
            dataKey="BetaLow" 
            name="Beta Band"
            stroke="#f59e0b" 
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
