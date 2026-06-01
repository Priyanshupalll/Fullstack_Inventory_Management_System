import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNotification } from '../components/Notification';
import { Modal } from '../components/Modal';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  Inbox
} from 'lucide-react';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const showNotification = useNotification();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    quantity_in_stock: ''
  });

  const fetchProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.products.getAll();
      setProducts(data);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenAddModal = () => {
    setModalType('add');
    setSelectedProduct(null);
    setFormData({
      name: '',
      sku: '',
      price: '',
      quantity_in_stock: '0'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setModalType('edit');
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      price: parseFloat(product.price).toString(),
      quantity_in_stock: product.quantity_in_stock.toString()
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.name.trim() || !formData.sku.trim()) {
      showNotification('Name and SKU are required.', 'error');
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      showNotification('Price cannot be negative.', 'error');
      return;
    }

    const quantityNum = parseInt(formData.quantity_in_stock, 10);
    if (isNaN(quantityNum) || quantityNum < 0) {
      showNotification('Quantity cannot be negative.', 'error');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      price: priceNum,
      quantity_in_stock: quantityNum
    };

    try {
      if (modalType === 'add') {
        await api.products.create(payload);
        showNotification('Product created successfully!', 'success');
      } else {
        await api.products.update(selectedProduct.id, payload);
        showNotification('Product updated successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchProducts(true);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you absolutely sure you want to delete product "${name}"? All associated order transactions will be deleted!`)) {
      try {
        await api.products.delete(id);
        showNotification(`Product "${name}" deleted.`, 'success');
        fetchProducts(true);
      } catch (err) {
        showNotification(err.message, 'error');
      }
    }
  };

  const filteredProducts = products.filter((product) => {
    const query = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <div className="workspace-header">
        <div>
          <h1 className="workspace-title">Products Catalogue</h1>
          <p className="workspace-subtitle">Manage items, warehouse stock levels, SKUs and pricing.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => fetchProducts(true)}>
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="search-bar">
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <Search 
              size={18} 
              style={{ 
                position: 'absolute', 
                left: '1rem', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)' 
              }} 
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search products by Name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.75rem', width: '100%' }}
            />
          </div>
        </div>

        {loading && products.length === 0 ? (
          <div className="flex-center" style={{ padding: '4rem 1rem' }}>
            <RefreshCw size={30} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex-center" style={{ padding: '5rem 1rem', flexDirection: 'column', gap: '1rem', border: '1px dashed var(--border-glass)', borderRadius: 'var(--radius-md)' }}>
            <Inbox size={48} style={{ color: 'var(--text-dim)' }} />
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#fff' }}>No products found</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                {products.length === 0 ? 'Start cataloguing items in your inventory by clicking Add Product.' : 'Refine your search parameters.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU</th>
                  <th>Unit Price</th>
                  <th>Current Stock</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isLow = product.quantity_in_stock < 10;
                  const isOut = product.quantity_in_stock === 0;
                  return (
                    <tr key={product.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{product.name}</div>
                      </td>
                      <td><code>{product.sku}</code></td>
                      <td>${parseFloat(product.price).toFixed(2)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ 
                            fontWeight: 700, 
                            color: isOut ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--success)' 
                          }}>
                            {product.quantity_in_stock} units
                          </span>
                          <span className={`badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`} style={{ transform: 'scale(0.85)' }}>
                            {isOut ? 'Out of stock' : isLow ? 'Low stock' : 'In stock'}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-secondary btn-icon" 
                            onClick={() => handleOpenEditModal(product)}
                            title="Edit Product"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn btn-danger btn-icon" 
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'add' ? 'Catalog New Product' : 'Modify Product Credentials'}
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="e.g. Enterprise Server Tower"
              required
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">SKU Code (Stock Keeping Unit)</label>
            <input
              type="text"
              name="sku"
              className="form-control"
              placeholder="e.g. HW-SRV-TW09"
              required
              style={{ textTransform: 'uppercase' }}
              value={formData.sku}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Unit Price ($)</label>
              <input
                type="number"
                name="price"
                step="0.01"
                min="0"
                className="form-control"
                placeholder="0.00"
                required
                value={formData.price}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Quantity in Stock</label>
              <input
                type="number"
                name="quantity_in_stock"
                min="0"
                className="form-control"
                placeholder="0"
                required
                value={formData.quantity_in_stock}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {modalType === 'add' ? 'Add Product' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
