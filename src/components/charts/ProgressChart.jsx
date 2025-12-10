import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

const COLORS = ['#22c55e', '#eab308', '#3b82f6', '#ef4444'];

export function ProgressChart({ data }) {
  const defaultData = [
    { name: 'Completed', value: 45, color: '#22c55e' },
    { name: 'In Progress', value: 25, color: '#eab308' },
    { name: 'Pending', value: 20, color: '#3b82f6' },
    { name: 'Overdue', value: 10, color: '#ef4444' },
  ];

  const chartData = data || defaultData;
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value) => [`${value} tasks`, '']}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-gray-600 dark:text-gray-400">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center -mt-20">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{total}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
      </div>
    </div>
  );
}
