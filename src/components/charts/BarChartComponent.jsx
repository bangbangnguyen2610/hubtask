import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export function BarChartComponent({ data, title }) {
  const defaultData = [
    { name: 'Project A', tasks: 24, completed: 18 },
    { name: 'Project B', tasks: 35, completed: 28 },
    { name: 'Project C', tasks: 18, completed: 15 },
    { name: 'Project D', tasks: 42, completed: 30 },
    { name: 'Project E', tasks: 15, completed: 12 },
  ];

  const chartData = data || defaultData;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
          <XAxis
            dataKey="name"
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => (
              <span className="text-gray-600 dark:text-gray-400">{value}</span>
            )}
          />
          <Bar
            dataKey="tasks"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            name="Total Tasks"
          />
          <Bar
            dataKey="completed"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
            name="Completed"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
