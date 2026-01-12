import React, { useCallback, useEffect, useState } from 'react'
import type { Invoice, InvoiceItem, Payment, Client } from '../types'
import './InvoiceDetail.css'

interface InvoiceDetailProps {
  invoiceId: number
  onBack: () => void
}

export function InvoiceDetail({ invoiceId, onBack }: InvoiceDetailProps) {
  const [invoice, setInvoice] = useState<(Invoice & { client: Client; items: InvoiceItem[]; payments: Payment[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMode, setPaymentMode] = useState('')
  const [addingPayment, setAddingPayment] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await window.api.getInvoice(invoiceId)
      setInvoice(data)
    } catch (err) {
      console.error('Failed to load invoice:', err)
    } finally {
      setLoading(false)
    }
  }, [invoiceId])

  useEffect(() => {
    load()
  }, [load])

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!paymentAmount || !invoice) return

    setAddingPayment(true)
    try {
      await window.api.addPayment({
        invoiceId,
        amount: parseFloat(paymentAmount),
        date: paymentDate,
        mode: paymentMode,
      })
      setPaymentAmount('')
      setPaymentMode('')
      load()
    } catch (err) {
      console.error('Failed to add payment:', err)
      alert('Failed to add payment')
    } finally {
      setAddingPayment(false)
    }
  }

  async function handleSend() {
    try {
      await window.api.sendInvoice(invoiceId)
      load()
    } catch (err) {
      console.error('Failed to send invoice:', err)
      alert('Failed to send invoice')
    }
  }

  if (loading) {
    return <div className="detail-loading">Loading invoice...</div>
  }

  if (!invoice) {
    return <div className="detail-error">Invoice not found</div>
  }

  const statusColors: Record<string, string> = {
    DRAFT: '#aebcda',
    SENT: '#61c1ff',
    PARTIALLY_PAID: '#ffc93d',
    PAID: '#52c77a',
    OVERDUE: '#ff6b6b',
  }

  return (
    <div className="invoice-detail">
      <button className="btn-back" onClick={onBack}>
        ← Back to Invoices
      </button>

      <div className="detail-header">
        <div>
          <h1 className="detail-title">{invoice.number}</h1>
          <span
            className="status-badge-large"
            style={{
              backgroundColor: statusColors[invoice.status] + '20',
              color: statusColors[invoice.status],
              borderColor: statusColors[invoice.status] + '40',
            }}
          >
            {invoice.status.replace('_', ' ')}
          </span>
        </div>
        {invoice.status === 'DRAFT' && (
          <button onClick={handleSend} className="btn-send">
            📤 Send Invoice
          </button>
        )}
      </div>

      <div className="detail-content">
        <div className="invoice-card">
          <div className="invoice-section">
            <h3 className="section-title">Invoice Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Invoice Date</span>
                <span className="info-value">{new Date(invoice.issueDate).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Due Date</span>
                <span className="info-value">{new Date(invoice.dueDate).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Currency</span>
                <span className="info-value">{invoice.currency}</span>
              </div>
            </div>
          </div>

          <div className="invoice-section">
            <h3 className="section-title">Client</h3>
            <div className="client-info">
              <p className="client-name">{invoice.client.name}</p>
              {invoice.client.email && <p>{invoice.client.email}</p>}
              {invoice.client.phone && <p>{invoice.client.phone}</p>}
              {invoice.client.billingAddress && <p>{invoice.client.billingAddress}</p>}
            </div>
          </div>

          <div className="invoice-section">
            <h3 className="section-title">Line Items</h3>
            <div className="items-table">
              <div className="items-header">
                <div className="col-desc">Description</div>
                <div className="col-qty">Qty</div>
                <div className="col-rate">Rate</div>
                <div className="col-tax">Tax</div>
                <div className="col-total">Total</div>
              </div>
              {invoice.items.map((item, idx) => (
                <div key={idx} className="items-row">
                  <div className="col-desc">{item.description}</div>
                  <div className="col-qty">{Number(item.quantity)}</div>
                  <div className="col-rate">${Number(item.rate).toFixed(2)}</div>
                  <div className="col-tax">${Number(item.lineTax).toFixed(2)}</div>
                  <div className="col-total">${Number(item.lineTotal).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="invoice-section">
            <div className="totals-box">
              <div className="total-line">
                <span>Subtotal:</span>
                <span>${Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="total-line">
                <span>Tax:</span>
                <span>${Number(invoice.taxTotal).toFixed(2)}</span>
              </div>
              <div className="total-line">
                <span>Discount:</span>
                <span>-${Number(invoice.discountTotal).toFixed(2)}</span>
              </div>
              <div className="total-line total">
                <span>Total:</span>
                <span>${Number(invoice.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="invoice-section">
              <h3 className="section-title">Notes</h3>
              <p className="section-text">{invoice.notes}</p>
            </div>
          )}

          {invoice.terms && (
            <div className="invoice-section">
              <h3 className="section-title">Terms</h3>
              <p className="section-text">{invoice.terms}</p>
            </div>
          )}
        </div>

        <div className="payments-panel">
          <div className="payments-card">
            <h3 className="section-title">Payment Status</h3>
            <div className="payment-status">
              <div className="status-item">
                <span className="status-label">Total Amount</span>
                <span className="status-value">${Number(invoice.total).toFixed(2)}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Paid</span>
                <span className="status-value paid">${Number(invoice.paidTotal).toFixed(2)}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Balance</span>
                <span className="status-value balance">${Number(invoice.balance).toFixed(2)}</span>
              </div>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Number(invoice.total) > 0 ? (Number(invoice.paidTotal) / Number(invoice.total)) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="payments-card">
            <h3 className="section-title">Payments</h3>
            {invoice.payments.length === 0 ? (
              <p className="no-payments">No payments recorded yet</p>
            ) : (
              <div className="payments-list">
                {invoice.payments.map((payment, idx) => (
                  <div key={idx} className="payment-item">
                    <div>
                      <p className="payment-amount">${Number(payment.amount).toFixed(2)}</p>
                      <p className="payment-date">{new Date(payment.date).toLocaleDateString()}</p>
                      {payment.mode && <p className="payment-mode">{payment.mode}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {invoice.status !== 'PAID' && (
            <div className="payments-card add-payment">
              <h3 className="section-title">Record Payment</h3>
              <form onSubmit={handleAddPayment}>
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Mode</label>
                  <input
                    type="text"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    placeholder="e.g., Bank Transfer, UPI"
                  />
                </div>
                <button type="submit" className="btn-record" disabled={addingPayment}>
                  {addingPayment ? 'Recording...' : 'Record Payment'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
