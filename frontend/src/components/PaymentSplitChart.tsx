import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { PaymentSplitItem } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PaymentSplitChartProps {
  items: PaymentSplitItem[];
}

export const PaymentSplitChart: React.FC<PaymentSplitChartProps> = ({ items }) => {
  const labels = items.map((i) => `${i.paymentMethod} (${i.orderSharePercentage}%)`);
  const data = items.map((i) => i.totalAmount);

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: ['#0d9488', '#4f46e5', '#f59e0b'],
        borderColor: '#ffffff',
        borderWidth: 3,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#334155',
          font: { size: 12, weight: '600', family: "'Inter', sans-serif" },
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) =>
            ` Sales: ₹${Number(ctx.raw || 0).toLocaleString('en-IN')}`,
        },
      },
    },
    cutout: '72%',
  };

  return (
    <div className="chart-wrapper">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};
