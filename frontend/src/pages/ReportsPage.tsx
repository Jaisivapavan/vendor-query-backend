import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { apiRequest } from '../api/client';
import type { RevenueSummary } from '../types';

interface ReportsPageProps {
  onOpenAi: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onOpenAi }) => {
  const [days, setDays] = useState<number>(30);
  const [report, setReport] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async (selectedDays: number) => {
    setLoading(true);
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - selectedDays * 24 * 60 * 60 * 1000).toISOString();

    const res = await apiRequest<RevenueSummary>(
      `/api/reports/revenue?startDate=${startDate}&endDate=${endDate}`
    );
    if (res.success && res.data) {
      setReport(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReport(days);
  }, [days]);

  return (
    <>
      <TopBar title="Sales Analytics & Reports" onRefresh={() => loadReport(days)} onOpenAi={onOpenAi} />

      <main className="content-body">
        <div className="card">
          <div className="reports-filter-bar">
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Timeframe:</span>
            <button
              className={`btn btn-secondary btn-sm ${days === 7 ? 'active' : ''}`}
              style={{ background: days === 7 ? 'var(--primary)' : undefined, color: days === 7 ? '#fff' : undefined }}
              onClick={() => setDays(7)}
            >
              Last 7 Days
            </button>
            <button
              className={`btn btn-secondary btn-sm ${days === 30 ? 'active' : ''}`}
              style={{ background: days === 30 ? 'var(--primary)' : undefined, color: days === 30 ? '#fff' : undefined }}
              onClick={() => setDays(30)}
            >
              Last 30 Days
            </button>
            <button
              className={`btn btn-secondary btn-sm ${days === 60 ? 'active' : ''}`}
              style={{ background: days === 60 ? 'var(--primary)' : undefined, color: days === 60 ? '#fff' : undefined }}
              onClick={() => setDays(60)}
            >
              Last 60 Days
            </button>
          </div>

          <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-heading)', marginBottom: '1rem' }}>
              Summary for Past {days} Days of Operations
            </h3>

            {report ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>GROSS REVENUE</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)' }}>
                    ₹{report.totalRevenue.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>NET REVENUE</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                    ₹{report.netRevenue.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL ORDERS</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                    {report.totalOrders}
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TAX (5% GST)</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--warning)' }}>
                    ₹{report.totalTax.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ) : (
              <div>{loading ? 'Calculating...' : 'No data available'}</div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};
