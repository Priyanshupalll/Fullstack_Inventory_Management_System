import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNotification } from '../components/Notification';
import { Modal } from '../components/Modal';
import { 
  Plus, 
  Trash2, 
  Eye, 
  RefreshCw, 
  ShoppingCart, 
  Inbox, 
  PlusCircle, 
  Minus,
  Calendar,
  DollarSign,
  User
} from 'lucide-react';

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const showNotification = useNotification();

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // New Order Draft State
  const [orderCustomerId, setOrderCustomerId] = useState('');
  const [draftItems, setDraftItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [ordersList, productsList, customersList] = await Promise.all([
        api.orders.getAll(),
        api.products.getAll(),
        api.customers.getAll()
      ]);
      setOrders(ordersList);
      setProducts(productsList);
      setCustomers(customersList);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    if (customers.length === 0) {
      showNotification('Please add at least one customer first.', 'error');
      return;
    }
    if (products.length === 0) {
      showNotification('Please add at least one product first.', 'error');
      return;
    }
    setOrderCustomerId(customers[0]?.id.toString() || '');
    setDraftItems([]);
    setSelectedProductId(products[0]?.id.toString() || '');
    setSelectedQuantity(1);
    setIsCreateOpen(true);
  };

  const handleAddProductToDraft = () => {
    if (!selectedProductId) return;

    const product = products.find(p => p.id.toString() === selectedProductId);
    if (!product) return;

    const qty = parseInt(selectedQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      showNotification('Quantity must be greater than zero.', 'error');
      return;
    }

    const existingIndex = draftItems.findIndex(item => item.product_id === product.id);
    const currentDraftQty = existingIndex >= 0 ? draftItems[existingIndex].quantity : 0;
    const totalRequestedQty = currentDraftQty + qty;

    if (totalRequestedQty > product.quantity_in_stock) {
      showNotification(
        `Insufficient stock! Product "${product.name}" has only ${product.quantity_in_stock} units.`,
        'error'
      );
      return;
    }

    if (existingIndex >= 0) {
      const updated = [...draftItems];
      updated[existingIndex].quantity = totalRequestedQty;
      setDraftItems(updated);
    } else {
      setDraftItems(prev => [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          price: parseFloat(product.price),
          quantity: qty,
          max_stock: product.quantity_in_stock
        }
      ]);
    }

    setSelectedQuantity(1);
    showNotification(`Added ${product.name} to order draft.`, 'success');
  };

  const handleRemoveDraftItem = (index) => {
    setDraftItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const calculateDraftTotal = () => {
    return draftItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!orderCustomerId) {
      showNotification('Please select a customer.', 'error');
      return;
    }

    if (draftItems.length === 0) {
      showNotification('Order must contain at least one item.', 'error');
      return;
    }

    const payload = {
      customer_id: parseInt(orderCustomerId, 10),
      items: draftItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
    };

    try {
      await api.orders.create(payload);
      showNotification('Order successfully compiled & transaction completed!', 'success');
      setIsCreateOpen(false);
      loadData(true);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('Are you sure you want to cancel this order? This will completely rollback the transaction and restore products stock!')) {
      try {
        await api.orders.delete(id);
        showNotification('Order transaction successfully reversed and stock levels restored.', 'success');
        loadData(true);
      } catch (err) {
        showNotification(err.message, 'error');
      }
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="workspace-header">
        <div>
          <h1 className="workspace-title">Transaction Ledger</h1>
          <p className="workspace-subtitle">Monitor order placement pipelines, dispatch, and inventory reconciliations.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => loadData(true)}>
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={18} />
            <span>Compile Order</span>
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {loading && orders.length === 0 ? (
          <div className="flex-center" style={{ padding: '4rem 1rem' }}>
            <RefreshCw size={30} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex-center" style={{ padding: '5rem 1rem', flexDirection: 'column', gap: '1rem', border: '1px dashed var(--border-glass)', borderRadius: 'var(--radius-md)' }}>
            <Inbox size={48} style={{ color: 'var(--text-dim)' }} />
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#fff' }}>No order transactions logged</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>Compile your first order transaction to deduct inventory levels.</p>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Customer Profile</th>
                  <th>Total Amount</th>
                  <th>Compiled At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600 }}>
                      <code>ORD-TX{order.id.toString().padStart(5, '0')}</code>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <User size={14} style={{ color: 'var(--text-dim)' }} />
                        {order.customer_name}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={14} style={{ color: 'var(--text-dim)' }} />
                        {formatDate(order.created_at)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary btn-icon" 
                          onClick={() => handleOpenDetails(order)}
                          title="View Order Manifest"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="btn btn-danger btn-icon" 
                          onClick={() => handleDeleteOrder(order.id)}
                          title="Cancel Order Transaction"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* COMPLIATION (CREATE) MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Compile New Order Transaction"
      >
        <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="form-group">
            <label className="form-label">Client Account</label>
            <select
              className="form-control"
              value={orderCustomerId}
              onChange={(e) => setOrderCustomerId(e.target.value)}
              required
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }} />

          <h4 style={{ fontSize: '0.95rem', color: '#fff' }}>Add Items to Draft Manifest</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Product SKU / Name</label>
              <select
                className="form-control"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (SKU: {p.sku}) [In Stock: {p.quantity_in_stock}]
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ maxWidth: '140px' }}>
              <label className="form-label">Quantity</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAddProductToDraft}
            style={{ alignSelf: 'flex-start' }}
          >
            <PlusCircle size={16} style={{ color: 'var(--primary)' }} />
            <span>Add Item to Manifest</span>
          </button>

          {draftItems.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h5 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Draft Manifest</h5>
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)'
              }}>
                <table className="data-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.5rem 1rem' }}>Item</th>
                      <th style={{ padding: '0.5rem 1rem' }}>Qty</th>
                      <th style={{ padding: '0.5rem 1rem' }}>Subtotal</th>
                      <th style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftItems.map((item, index) => (
                      <tr key={index}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontWeight: 600 }}>{item.name}</span>
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{item.sku}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>{item.quantity}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-danger btn-icon"
                            onClick={() => handleRemoveDraftItem(index)}
                            style={{ padding: '0.25rem' }}
                          >
                            <Minus size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex-between" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Estimated Manifest Cost:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                  ${calculateDraftTotal().toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={draftItems.length === 0}>
              <ShoppingCart size={16} />
              <span>Compile & Dispatch</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* DETAILS VIEW MODAL */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Enterprise Order Manifest Details"
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <User size={20} style={{ color: 'var(--primary)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Client</div>
                  <div style={{ fontWeight: 600 }}>{selectedOrder.customer_name}</div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={20} style={{ color: 'var(--warning)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Date</div>
                  <div style={{ fontWeight: 600 }}>{formatDate(selectedOrder.created_at)}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.75rem' }}>Itemized Manifest Breakdown</h4>
              <div style={{
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden'
              }}>
                <table className="data-table" style={{ fontSize: '0.9rem' }}>
                  <thead>
                    <tr>
                      <th>Product Description</th>
                      <th>Unit Cost</th>
                      <th style={{ textAlign: 'center' }}>Quantity</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{item.product_sku}</div>
                        </td>
                        <td>${parseFloat(item.price_at_order).toFixed(2)}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          ${(parseFloat(item.price_at_order) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.25rem',
              backgroundColor: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              borderRadius: 'var(--radius-md)'
            }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Manifest Total Amount:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                <DollarSign size={20} />
                {parseFloat(selectedOrder.total_amount).toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsDetailsOpen(false)}>
                Close Manifest
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
