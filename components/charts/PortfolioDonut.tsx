'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  allocation: {
    equity: number
    debt: number
    gold: number
    cash: number
  }
}

const SEGMENTS = [
  { key: 'equity', label: 'Equity', color: '#7c3aed' },
  { key: 'debt', label: 'Debt', color: '#22c55e' },
  { key: 'gold', label: 'Gold', color: '#f59e0b' },
  { key: 'cash', label: 'Cash', color: '#9ca3af' },
]

export default function PortfolioDonut({ allocation }: Props) {
  const data = SEGMENTS.map((s) => ({
    name: s.label,
    value: allocation[s.key as keyof typeof allocation],
    color: s.color,
  })).filter((d) => d.value > 0)

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={100}
          dataKey="value"
          label={({ cx, cy }) => (
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="text-sm font-bold fill-gray-700">
              100%
            </text>
          )}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${value}%`, '']}
          contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
