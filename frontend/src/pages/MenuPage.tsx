import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { AddDishModal } from '../components/AddDishModal';
import { apiRequest } from '../api/client';
import type { MenuItem, Category } from '../types';
import { Plus, Search } from 'lucide-react';

interface MenuPageProps {
  onOpenAi: () => void;
}

export const MenuPage: React.FC<MenuPageProps> = ({ onOpenAi }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadMenuData = async () => {
    setLoading(true);
    const [itemsRes, catsRes] = await Promise.all([
      apiRequest<MenuItem[]>('/api/menu/items'),
      apiRequest<Category[]>('/api/menu/categories'),
    ]);

    if (itemsRes.success && Array.isArray(itemsRes.data)) setItems(itemsRes.data);
    if (catsRes.success && Array.isArray(catsRes.data)) setCategories(catsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadMenuData();
  }, []);

  const toggleAvailability = async (id: string, current: boolean) => {
    const nextState = !current;
    // Optimistic UI update
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isAvailable: nextState } : item)));

    const res = await apiRequest(`/api/menu/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable: nextState }),
    });

    if (!res.success) {
      // Revert if failed
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isAvailable: current } : item)));
    }
  };

  const filteredItems = items.filter((dish) => {
    const matchCategory =
      activeCategory === 'all' ||
      dish.category?.name?.toLowerCase() === activeCategory.toLowerCase();
    const matchSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <>
      <TopBar title="Menu Management" onRefresh={loadMenuData} onOpenAi={onOpenAi} />

      <main className="content-body">
        <div className="card">
          {/* Toolbar */}
          <div className="menu-toolbar">
            <div className="category-chips">
              <button
                className={`category-chip ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                All Dishes ({items.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`category-chip ${activeCategory === cat.name ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.name)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '220px', padding: '0.45rem 0.85rem 0.45rem 2rem', fontSize: '0.85rem' }}
                />
                <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>

              <button className="btn btn-sm" onClick={() => setIsModalOpen(true)}>
                <Plus size={15} />
                <span>Add New Dish</span>
              </button>
            </div>
          </div>

          {/* Dishes Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dish / Item Name</th>
                  <th>Category</th>
                  <th>Price (INR)</th>
                  <th>Availability</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {item.description || 'No description provided'}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-secondary">{item.category?.name || 'General'}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        ₹{Number(item.price).toFixed(2)}
                      </td>
                      <td>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={item.isAvailable}
                            onChange={() => toggleAvailability(item.id, item.isAvailable)}
                          />
                          <span className="slider"></span>
                        </label>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            marginLeft: '0.5rem',
                            color: item.isAvailable ? 'var(--success)' : 'var(--text-muted)',
                            fontWeight: 600,
                          }}
                        >
                          {item.isAvailable ? 'In Stock' : 'Unavailable'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                      {loading ? 'Loading menu catalog...' : 'No matching dishes found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AddDishModal
        isOpen={isModalOpen}
        categories={categories}
        onClose={() => setIsModalOpen(false)}
        onDishAdded={loadMenuData}
      />
    </>
  );
};
