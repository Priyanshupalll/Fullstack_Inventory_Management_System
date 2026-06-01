import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNotification } from '../components/Notification';
import { Modal } from '../components/Modal';
import { 
  Plus, 
  Search, 
  Trash2, 
  RefreshCw, 
  Inbox, 
  Mail, 
  Phone,
  Eye,
  User,
  Calendar,
  DollarSign,
  Activity 
} from 'lucide-react';

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const showNotification = useNotification();

  // Details Modal State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: ''
  });

  const fetchCustomers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [custData, ordData] = await Promise.all([
        api.customers.getAll(),
        api.orders.getAll()
      ]);
      setCustomers(custData);
      setOrders(ordData);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenModal = () => {
    setFormData({
      full_name: '',
      email: '',
      phone_number: ''
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
    if (!formData.full_name.trim() || !formData.email.trim()) {
      showNotification('Full name and email are required.', 'error');
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      showNotification('Please enter a valid email address.', 'error');
      return;
    }

    const payload = {
      full_name: formData.full_name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone_number: formData.phone_number.trim() || null
    };

    try {
      await api.customers.create(payload);
      showNotification('Customer registered successfully!', 'success');
      setIsModalOpen(false);
      fetchCustomers(true);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}"? All orders placed by this customer will be deleted!`)) {
      try {
        await api.customers.delete(id);
        showNotification(`Customer "${name}" deleted successfully.`, 'success');
        fetchCustomers(true);
      } catch (err) {
        showNotification(err.message, 'error');
      }
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const query = searchTerm.toLowerCase();
    return (
      customer.full_name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <div className="workspace-header">
        <div>
          <h1 className="workspace-title">Customers CRM</h1>
          <p className="workspace-subtitle">Monitor customer registration profiles, contact files, and transactional logs.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => fetchCustomers(true)}>
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <Plus size={18} />
            <span>Add Customer</span>
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
              placeholder="Search customers by Name or Email address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.75rem', width: '100%' }}
            />
          </div>
        </div>

        {loading && customers.length === 0 ? (
          <div className="flex-center" style={{ padding: '4rem 1rem' }}>
            <RefreshCw size={30} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex-center" style={{ padding: '5rem 1rem', flexDirection: 'column', gap: '1rem', border: '1px dashed var(--border-glass)', borderRadius: 'var(--radius-md)' }}>
            <Inbox size={48} style={{ color: 'var(--text-dim)' }} />
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#fff' }}>No customer records found</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                {customers.length === 0 ? 'Create database records by adding a customer.' : 'Verify search filters.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client Profile</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          backgroundColor: 'var(--primary-glow)',
                          color: 'var(--primary)',
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '0.95rem'
                        }}>
                          {customer.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ fontWeight: 600 }}>{customer.full_name}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                        <Mail size={14} style={{ color: 'var(--text-dim)' }} />
                        {customer.email}
                      </span>
                    </td>
                    <td>
                      {customer.phone_number ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Phone size={14} style={{ color: 'var(--text-dim)' }} />
                          {customer.phone_number}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Not specified</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary btn-icon" 
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setIsDetailsOpen(true);
                          }}
                          title="View CRM Customer Profile"
                        >
                          <Eye size={16} style={{ color: 'var(--primary)' }} />
                        </button>
                        <button 
                          className="btn btn-danger btn-icon" 
                          onClick={() => handleDeleteCustomer(customer.id, customer.full_name)}
                          title="Remove Customer Record"
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

      {/* Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Client Profile"
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="full_name"
              className="form-control"
              placeholder="e.g. Alexander Vance"
              required
              value={formData.full_name}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="alexander.vance@enterprise.com"
              required
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number (Optional)</label>
            <input
              type="text"
              name="phone_number"
              className="form-control"
              placeholder="+1 (555) 019-2834"
              value={formData.phone_number}
              onChange={handleInputChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW PROFILE CRM DETAILS MODAL */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="CRM Customer Account Metrics"
      >
        {selectedCustomer && (() => {
          const customerOrders = orders.filter(o => o.customer_id === selectedCustomer.id);
          const totalSpent = customerOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
          
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Profile Card Info */}
              <div className="glass-card" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.25rem',
                padding: '1.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                borderColor: 'var(--border-glass)'
              }}>
                <div style={{
                  backgroundColor: 'var(--primary-glow)',
                  color: 'var(--primary)',
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.6rem',
                  border: '2px solid rgba(99, 102, 241, 0.25)',
                  flexShrink: 0
                }}>
                  {selectedCustomer.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>{selectedCustomer.full_name}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Mail size={14} style={{ color: 'var(--text-dim)' }} />
                      {selectedCustomer.email}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Phone size={14} style={{ color: 'var(--text-dim)' }} />
                      {selectedCustomer.phone_number || <span style={{ fontStyle: 'italic', color: 'var(--text-dim)' }}>No phone specified</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    color: 'var(--primary)',
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Activity size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Total Orders</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>{customerOrders.length}</div>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    color: 'var(--success)',
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Total Spent</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--success)' }}>
                      ${totalSpent.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Logs */}
              <div>
                <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Recent Transaction Ledgers</h4>
                {customerOrders.length === 0 ? (
                  <div className="flex-center" style={{ padding: '2rem 1rem', border: '1px dashed var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    No purchase ledger files detected for this customer.
                  </div>
                ) : (
                  <div style={{
                    maxHeight: '180px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <table className="data-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '0.5rem 1rem' }}>Order Ref</th>
                          <th style={{ padding: '0.5rem 1rem' }}>Date</th>
                          <th style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerOrders.map(o => (
                          <tr key={o.id}>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <code>ORD-TX{o.id.toString().padStart(5, '0')}</code>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                              {new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>
                              ${parseFloat(o.total_amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsDetailsOpen(false)}>
                  Close Profile
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </>
  );
};
