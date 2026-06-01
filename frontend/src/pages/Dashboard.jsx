import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNotification } from '../components/Notification';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2,
  Plus
} from 'lucide-react';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const showNotification = useNotification();

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.dashboard.getStats();
      setStats(data);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRestock = async (productId, currentName) => {
    try {
      await api.products.restock(productId, 10);
      showNotification(`Replenished +10 units for "${currentName}"!`, 'success');
      fetchStats(true);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex-center" style={{ flexGrow: 1, flexDirection: 'column', gap: '1rem' }}>
        <RefreshCw size={40} className="animate-spin" style={{ color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading intelligence metrics...</p>
      </div>
    );
  }

  const lowStockCount = stats?.low_stock_products?.length || 0;

  return (
    <>
      <div className="workspace-header">
        <div>
          <h1 className="workspace-title">Intelligence Dashboard</h1>
          <p className="workspace-subtitle">Welcome back. Here is your enterprise status overview.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => fetchStats(true)} title="Refresh data">
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="stats-grid">
        <div className="glass-card stat-card products-glow">
          <div className="stat-info">
            <span className="stat-label">Total Products</span>
            <span className="stat-value">{stats?.total_products ?? 0}</span>
          </div>
          <div className="stat-icon-wrapper primary">
            <Package size={26} />
          </div>
        </div>

        <div className="glass-card stat-card customers-glow">
          <div className="stat-info">
            <span className="stat-label">Total Customers</span>
            <span className="stat-value">{stats?.total_customers ?? 0}</span>
          </div>
          <div className="stat-icon-wrapper success">
            <Users size={26} />
          </div>
        </div>

        <div className="glass-card stat-card orders-glow">
          <div className="stat-info">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{stats?.total_orders ?? 0}</span>
          </div>
          <div className="stat-icon-wrapper warning">
            <ShoppingCart size={26} />
          </div>
        </div>

        <div className="glass-card stat-card alerts-glow" style={{ 
          borderColor: lowStockCount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-glass)' 
        }}>
          <div className="stat-info">
            <span className="stat-label">Low Stock Alerts</span>
            <span className="stat-value" style={{ 
              color: lowStockCount > 0 ? 'var(--danger)' : 'var(--text-main)' 
            }}>{lowStockCount}</span>
          </div>
          <div className={`stat-icon-wrapper ${lowStockCount > 0 ? 'danger' : 'success'}`}>
            {lowStockCount > 0 ? <AlertTriangle size={26} /> : <CheckCircle2 size={26} />}
          </div>
        </div>
      </div>

      {/* Critical Stock Alert / Low Stock Table */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="flex-between">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} style={{ color: lowStockCount > 0 ? 'var(--warning)' : 'var(--success)' }} />
              <span>Critical Inventory Warning Thresholds</span>
            </h3>
            <p className="workspace-subtitle" style={{ marginTop: '0.2rem' }}>Products with quantity levels below 10 units requiring urgent replenishment.</p>
          </div>
        </div>

        {lowStockCount === 0 ? (
          <div className="flex-center" style={{ padding: '3rem 1rem', flexDirection: 'column', gap: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.01)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-glass)' }}>
            <CheckCircle2 size={48} style={{ color: 'var(--success)' }} />
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#fff', marginBottom: '0.2rem' }}>All items sufficiently stocked</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No low stock alerts detected inside the warehouse.</p>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Unit Price</th>
                  <th>Available Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.low_stock_products.map((product) => {
                  const percent = Math.min((product.quantity_in_stock / 10) * 100, 100);
                  const isZero = product.quantity_in_stock === 0;
                  return (
                    <tr key={product.id}>
                      <td style={{ fontWeight: 600 }}>{product.name}</td>
                      <td><code>{product.sku}</code></td>
                      <td>${parseFloat(product.price).toFixed(2)}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: isZero ? 'var(--danger)' : 'var(--warning)' }}>
                          {product.quantity_in_stock} units
                        </span>
                        <div className="stock-bar-container">
                          <div 
                            className="stock-bar" 
                            style={{ 
                              width: `${percent}%`, 
                              backgroundColor: isZero ? 'var(--danger)' : 'var(--warning)' 
                            }} 
                          />
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${isZero ? 'badge-danger' : 'badge-warning'}`}>
                          {isZero ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleQuickRestock(product.id, product.name)}
                          className="btn btn-secondary"
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.8rem',
                            gap: '0.35rem',
                            border: '1px solid var(--border-glass)'
                          }}
                          title="Replenish +10 units instantly"
                        >
                          <Plus size={12} style={{ color: 'var(--success)' }} />
                          <span>Restock +10</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};
