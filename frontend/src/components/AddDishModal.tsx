import React, { useState } from 'react';
import type { Category } from '../types';
import { apiRequest } from '../api/client';
import { X } from 'lucide-react';

interface AddDishModalProps {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onDishAdded: () => void;
}

export const AddDishModal: React.FC<AddDishModalProps> = ({
  isOpen,
  categories,
  onClose,
  onDishAdded,
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please provide a valid price.');
      setLoading(false);
      return;
    }

    const res = await apiRequest('/api/menu/items', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        categoryId: categoryId || categories[0]?.id,
        price: priceNum,
        description: description.trim() || undefined,
      }),
    });

    setLoading(false);
    if (res.success) {
      setName('');
      setPrice('');
      setDescription('');
      onDishAdded();
      onClose();
    } else {
      setError(res.error || 'Failed to create menu dish.');
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex' }}>
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">🍽️ Add New Menu Dish</h3>
          <button className="drawer-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="auth-error" style={{ display: 'block' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Dish Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Butter Naan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={categoryId || categories[0]?.id}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Price (₹ INR)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              className="form-input"
              placeholder="e.g. 60"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Crisp tandoori bread brushed with butter"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Dish to Menu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
