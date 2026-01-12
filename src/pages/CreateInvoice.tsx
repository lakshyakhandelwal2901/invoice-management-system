import React, { useEffect, useState } from 'react'
import type { Client } from '@prisma/client'
import './CreateInvoice.css'

interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
  taxRate: number | null
  discount: number | null
}

interface CreateInvoiceProps {
  onSuccess: () => void
}

export function CreateInvoice({ onSuccess }: CreateInvoiceProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]
  )
  const [currency, setCurrency] = useState('USD')
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('')
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, taxRate: null, discount: null },
  ])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadClients() {
      try {
        const data = await window.api.listClients()
        setClients(data)
      } catch (err) {
        console.error('Failed to load clients:', err)
      } finally {
        setLoading(false)
      }
    }
    loadClients()
  }, [])

  const computeTotals = () => {
    let subtotal = 0
    let taxTotal = 0
    let discountTotal = 0

    items.forEach((item) => {
      const lineSubtotal = item.quantity * item.rate
      const lineTax = item.taxRate ? lineSubtotal * (item.taxRate / 100) : 0
      const lineDiscount = item.discount ? item.discount : 0
      subtotal += lineSubtotal
      taxTotal += lineTax
      discountTotal += lineDiscount
    })

    const total = subtotal + taxTotal - discountTotal
    return { subtotal, taxTotal, discountTotal, total }
  }

  const totals = computeTotals()

  function addItem() {
    const newId = String(Math.max(...items.map((i) => parseInt(i.id) || 0)) + 1)
    setItems([...items, { id: newId, description: '', quantity: 1, rate: 0, taxRate: null, discount: null }])
  }

  function removeItem(id: string) {
    if (items.length > 1) {
      setItems(items.filter((i) => i.id !== id))
    }
  }

  function updateItem(id: string, field: keyof LineItem, value: string | number | null) {
    setItems(
      items.map((i) =>
        i.id === id ? { ...i, [field]: value } : i
      )
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClientId) {
      alert('Please select a client')
      return
    }

    setSubmitting(true)
    try {
      await window.api.createInvoice({
        clientId: selectedClientId,
        issueDate,
        dueDate,
        currency,
        notes,
        terms,
        items: items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          rate: i.rate,
          taxRate: i.taxRate,
          discount: i.discount,
        })),
      })
      onSuccess()
    } catch (err) {
      console.error('Failed to create invoice:', err)
      alert('Failed to create invoice')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="create-loading">Loading...</div>
  }

  return (
    <div className="create-invoice">
      <form onSubmit={handleSubmit} className="create-form">
        <div className="form-section">
          <h3 className="section-title">Invoice Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Client *</label>
              <select
                value={selectedClientId || ''}
                onChange={(e) => setSelectedClientId(parseInt(e.target.value))}
                required
              >
                <option value="">Select a client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Line Items</h3>
          <div className="items-table">
            <div className="items-header">
              <div className="col-desc">Description</div>
              <div className="col-qty">Qty</div>
              <div className="col-rate">Rate</div>
              <div className="col-tax">Tax %</div>
              <div className="col-discount">Discount</div>
              <div className="col-total">Total</div>
              <div className="col-action"></div>
            </div>
            {items.map((item) => {
              const lineSubtotal = item.quantity * item.rate
              const lineTax = item.taxRate ? lineSubtotal * (item.taxRate / 100) : 0
              const lineDiscount = item.discount || 0
              const lineTotal = lineSubtotal + lineTax - lineDiscount
              return (
                <div key={item.id} className="items-row">
                  <input
                    type="text"
                    placeholder="Service or product"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="col-desc"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="col-qty"
                  />
                  <input
                    type="number"
                    value={item.rate}
                    onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    className="col-rate"
                  />
                  <input
                    type="number"
                    placeholder="0"
                    value={item.taxRate || ''}
                    onChange={(e) => updateItem(item.id, 'taxRate', e.target.value ? parseFloat(e.target.value) : null)}
                    className="col-tax"
                  />
                  <input
                    type="number"
                    placeholder="0"
                    value={item.discount || ''}
                    onChange={(e) => updateItem(item.id, 'discount', e.target.value ? parseFloat(e.target.value) : null)}
                    className="col-discount"
                  />
                  <div className="col-total">${lineTotal.toFixed(2)}</div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="btn-remove"
                  >
                    🗑
                  </button>
                </div>
              )
            })}
          </div>
          <button type="button" onClick={addItem} className="btn-add-item">
            + Add Item
          </button>
        </div>

        <div className="form-section">
          <div className="totals-display">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Tax:</span>
              <span>${totals.taxTotal.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Discount:</span>
              <span>-${totals.discountTotal.toFixed(2)}</span>
            </div>
            <div className="total-row total">
              <span>Total:</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Notes & Terms</h3>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thank you for your business..."
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Terms</label>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Net 30, Payment due on..."
              rows={3}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  )
}
