import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const COLORS = {
  completed: '#10b981',
  in_progress: '#f59e0b',
  pending: '#3b82f6',
  overdue: '#ef4444',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-surface-800 px-4 py-3 rounded-xl shadow-lg border border-surface-200 dark:border-surface-700">
        <p className="text-sm font-medium text-surface-900 dark:text-white">{data.name}</p>
        <p className="text-2xl font-bold mt-1" style={{ color: data.color }}>
          {data.value}
        </p>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">tasks</p>
      </div>
    );
  }
  return null;
};

export function ProgressChart({ data }) {
  const defaultData = [
    { name: 'Completed', value: 45, color: COLORS.completed },
    { name: 'In Progress', value: 25, color: COLORS.in_progress },
    { name: 'Pending', value: 20, color: COLORS.pending },
    { name: 'Overdue', value: 10, color: COLORS.overdue },
  ];

  const chartData = data || defaultData;
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-72 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={70}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                className="transition-all duration-300 hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center Label */}
      <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-4xl font-bold text-surface-900 dark:text-white tabular-nums">{total}</p>
        <p className="text-sm text-surface-500 dark:text-surface-400">Total</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-surface-600 dark:text-surface-400">
              {item.name}
            </span>
            <span className="text-sm font-semibold text-surface-900 dark:text-white tabular-nums">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
