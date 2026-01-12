import React, { useCallback, useEffect, useState } from 'react'
import type { Invoice, Client } from '@prisma/client'
import './InvoiceList.css'

interface InvoiceWithClient extends Invoice {
  client: Client
}

interface InvoiceListProps {
  onViewInvoice: (id: number) => void
}

export function InvoiceList({ onViewInvoice }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await window.api.listInvoices({
        status: statusFilter ? (statusFilter as 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE') : undefined,
        q: searchQuery || undefined,
      })
      setInvoices(data)
    } catch (err) {
      console.error('Failed to load invoices:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery])

  useEffect(() => {
    load()
  }, [load])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    load()
  }

  const statusColors: Record<string, string> = {
    DRAFT: '#aebcda',
    SENT: '#61c1ff',
    PARTIALLY_PAID: '#ffc93d',
    PAID: '#52c77a',
    OVERDUE: '#ff6b6b',
  }

  return (
    <div className="invoice-list">
      <div className="list-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by invoice # or client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-search">
            🔍
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      {loading ? (
        <div className="list-loading">Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div className="list-empty">No invoices found. Create one to get started!</div>
      ) : (
      <div className="table-wrapper">
          <table className="invoices-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="col-number">
                    <span className="number-badge">{inv.number}</span>
                  </td>
                  <td>{inv.client.name}</td>
                  <td>{new Date(inv.issueDate).toLocaleDateString()}</td>
                  <td>${Number(inv.total).toFixed(2)}</td>
                  <td>${Number(inv.paidTotal).toFixed(2)}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: statusColors[inv.status] + '20',
                        color: statusColors[inv.status],
                        borderColor: statusColors[inv.status] + '40',
                      }}
                    >
                      {inv.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={() => onViewInvoice(inv.id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
