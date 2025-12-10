import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-surface-800 px-4 py-3 rounded-xl shadow-lg border border-surface-200 dark:border-surface-700">
        <p className="text-sm font-medium text-surface-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-surface-500 dark:text-surface-400">
              {entry.name}:
            </span>
            <span className="text-sm font-semibold text-surface-900 dark:text-white tabular-nums">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function TimelineChart({ data }) {
  const defaultData = [
    { name: 'Mon', completed: 4, created: 6 },
    { name: 'Tue', completed: 7, created: 5 },
    { name: 'Wed', completed: 5, created: 8 },
    { name: 'Thu', completed: 8, created: 4 },
    { name: 'Fri', completed: 12, created: 7 },
    { name: 'Sat', completed: 3, created: 2 },
    { name: 'Sun', completed: 2, created: 3 },
  ];

  const chartData = data || defaultData;

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="currentColor"
            className="text-surface-200 dark:text-surface-700"
          />
          <XAxis
            dataKey="name"
            stroke="currentColor"
            className="text-surface-400"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="currentColor"
            className="text-surface-400"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dx={-5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="created"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorCreated)"
            name="Created"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
          />
          <Area
            type="monotone"
            dataKey="completed"
            stroke="#10b981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorCompleted)"
            name="Completed"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-primary-500" />
          <span className="text-sm text-surface-600 dark:text-surface-400">Created</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-surface-600 dark:text-surface-400">Completed</span>
        </div>
      </div>
    </div>
  );
}
