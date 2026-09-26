import React, { useState, useEffect } from 'react';
import { KpiCard } from '../components/KpiCard';
import { TopDishesChart } from '../components/TopDishesChart';
import { PaymentSplitChart } from '../components/PaymentSplitChart';
import { TopBar } from '../components/TopBar';
import { apiRequest } from '../api/client';
import type { RevenueSummary, TopSellingItem, PaymentSplitItem } from '../types';

interface DashboardPageProps {
  onOpenAi: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenAi }) => {
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [topDishes, setTopDishes] = useState<TopSellingItem[]>([]);
  const [paymentSplit, setPaymentSplit] = useState<PaymentSplitItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [revRes, topRes, payRes] = await Promise.all([
      apiRequest<RevenueSummary>('/api/reports/revenue'),
      apiRequest<TopSellingItem[]>('/api/reports/top-items?limit=5'),
      apiRequest<PaymentSplitItem[]>('/api/reports/payment-split'),
    ]);

    if (revRes.success && revRes.data) setRevenue(revRes.data);
    if (topRes.success && Array.isArray(topRes.data)) setTopDishes(topRes.data);
    if (payRes.success && Array.isArray(payRes.data)) setPaymentSplit(payRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <TopBar title="Restaurant Overview" onRefresh={loadData} onOpenAi={onOpenAi} />

      <main className="content-body">
        {/* KPI Grid */}
        <section className="kpi-grid">
          <KpiCard
            label="Gross Revenue"
            value={revenue ? `₹${revenue.totalRevenue.toLocaleString('en-IN')}` : '₹0'}
            subtext="📅 Past 60 days of operations"
            icon="💰"
            variant="emerald"
          />
          <KpiCard
            label="Completed Orders"
            value={revenue ? revenue.totalOrders : 0}
            subtext="⚡ Indexed on [vendorId, createdAt]"
            icon="🧾"
            variant="indigo"
          />
          <KpiCard
            label="Tax Collected (5% GST)"
            value={revenue ? `₹${revenue.totalTax.toLocaleString('en-IN')}` : '₹0'}
            subtext="📊 Transactional tax calculation"
            icon="🏛️"
            variant="amber"
          />
          <KpiCard
            label="Avg Order Value (AOV)"
            value={revenue ? `₹${revenue.averageOrderValue.toFixed(2)}` : '₹0.00'}
            subtext="🎯 Per completed transaction"
            icon="📈"
            variant="blue"
          />
        </section>

        {/* Charts Grid */}
        <section className="charts-grid">
          <div className="card">
            <div className="card-title">
              <span>🏆 Top 5 Best-Selling Dishes</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                By Units Sold
              </span>
            </div>
            {topDishes.length > 0 ? (
              <TopDishesChart items={topDishes} />
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
                {loading ? 'Loading charts...' : 'No sales data available'}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">
              <span>💳 Payment Method Share</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                UPI vs Card vs Cash
              </span>
            </div>
            {paymentSplit.length > 0 ? (
              <PaymentSplitChart items={paymentSplit} />
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
                {loading ? 'Loading charts...' : 'No payment data available'}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
};
