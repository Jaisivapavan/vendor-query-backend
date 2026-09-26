import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { apiRequest } from '../api/client';
import type { Order } from '../types';

interface OrdersPageProps {
  onOpenAi: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onOpenAi }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    const res = await apiRequest<Order[]>('/api/orders?limit=30');
    if (res.success && Array.isArray(res.data)) {
      setOrders(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <>
      <TopBar title="Order History" onRefresh={loadOrders} onOpenAi={onOpenAi} />

      <main className="content-body">
        <div className="card">
          <div className="card-title">
            <span>🧾 Live Order History</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Showing recent transactions
            </span>
          </div>

          <div className="orders-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date & Time</th>
                  <th>Items Summary</th>
                  <th>Payment Method</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => {
                    const dateStr = new Date(order.createdAt).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const itemCount = order.orderItems
                      ? order.orderItems.length
                      : order._count?.orderItems || 1;

                    return (
                      <tr key={order.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>
                          #{order.id.slice(0, 8)}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{dateStr}</td>
                        <td>
                          <strong>{itemCount}</strong> items
                        </td>
                        <td>
                          <span className="badge badge-secondary">{order.paymentMethod}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                          ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              order.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                      {loading ? 'Loading orders from PostgreSQL...' : 'No orders found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
};
