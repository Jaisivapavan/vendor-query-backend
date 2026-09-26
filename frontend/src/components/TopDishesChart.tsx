import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { TopSellingItem } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TopDishesChartProps {
  items: TopSellingItem[];
}

export const TopDishesChart: React.FC<TopDishesChartProps> = ({ items }) => {
  const labels = items.map((i) => i.name);
  const data = items.map((i) => i.totalQuantitySold);
  const revenues = items.map((i) => i.totalRevenue);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Units Sold',
        data,
        backgroundColor: 'rgba(79, 70, 229, 0.85)',
        hoverBackgroundColor: '#4338ca',
        borderColor: '#4f46e5',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options: any = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          afterLabel: (ctx: any) =>
            `Revenue: ₹${(revenues[ctx.dataIndex] || 0).toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b', font: { family: "'Inter', sans-serif" } },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#0f172a',
          font: { weight: '600', family: "'Inter', sans-serif" },
        },
      },
    },
  };

  return (
    <div className="chart-wrapper">
      <Bar data={chartData} options={options} />
    </div>
  );
};
