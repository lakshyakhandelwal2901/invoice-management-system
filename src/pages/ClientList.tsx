import { useEffect, useState } from 'react'
import type { Client } from '../types'
import './ClientList.css'

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', billingAddress: '', taxId: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      const data = await window.api.listClients()
      setClients(data)
    } catch (err) {
      console.error('Failed to load clients:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Client name is required')
      return
    }

    setSubmitting(true)
    try {
      await window.api.createClient(formData)
      setFormData({ name: '', email: '', phone: '', billingAddress: '', taxId: '' })
      setShowForm(false)
      load()
    } catch (err) {
      console.error('Failed to create client:', err)
      alert('Failed to create client')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="clients-loading">Loading clients...</div>
  }

  return (
    <div className="client-list">
      {!showForm ? (
        <>
          <div className="clients-header">
            <p className="clients-count">Total: {clients.length} clients</p>
            <button onClick={() => setShowForm(true)} className="btn-new-client">
              + New Client
            </button>
          </div>

          {clients.length === 0 ? (
            <div className="clients-empty">No clients yet. Create one to get started!</div>
          ) : (
            <div className="clients-grid">
              {clients.map((client) => (
                <div key={client.id} className="client-card">
                  <div className="client-name">{client.name}</div>
                  <div className="client-details">
                    {client.email && (
                      <div className="detail">
                        <span className="detail-label">Email:</span>
                        <span>{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="detail">
                        <span className="detail-label">Phone:</span>
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.billingAddress && (
                      <div className="detail">
                        <span className="detail-label">Address:</span>
                        <span>{client.billingAddress}</span>
                      </div>
                    )}
                    {client.taxId && (
                      <div className="detail">
                        <span className="detail-label">Tax ID:</span>
                        <span>{client.taxId}</span>
                      </div>
                    )}
                  </div>
                  <div className="client-date">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="client-form-card">
          <h3>New Client</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Billing Address</label>
              <input
                type="text"
                value={formData.billingAddress}
                onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Tax ID</label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="submit" disabled={submitting} className="btn-submit">
                {submitting ? 'Creating...' : 'Create Client'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
