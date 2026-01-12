import { useEffect, useState } from 'react'
import './Dashboard.css'

interface DashboardSnapshot {
  totalInvoices: number
  totalInvoiced: number
  paidAmount: number
  unpaidAmount: number
  overdueCount: number
}

export function Dashboard() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await window.api.dashboardSnapshot()
        setSnapshot(data)
      } catch (err) {
        console.error('Failed to load dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>
  }

  if (!snapshot) {
    return <div className="dashboard-error">Failed to load dashboard data</div>
  }

  const paidPercent = snapshot.totalInvoiced > 0 ? (snapshot.paidAmount / snapshot.totalInvoiced) * 100 : 0

  return (
    <div className="dashboard">
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <p className="kpi-label">Total Invoices</p>
            <p className="kpi-value">{snapshot.totalInvoices}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <p className="kpi-label">Total Invoiced</p>
            <p className="kpi-value">${snapshot.totalInvoiced.toFixed(2)}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">✅</div>
          <div className="kpi-content">
            <p className="kpi-label">Paid Amount</p>
            <p className="kpi-value">${snapshot.paidAmount.toFixed(2)}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">⏳</div>
          <div className="kpi-content">
            <p className="kpi-label">Unpaid Amount</p>
            <p className="kpi-value">${snapshot.unpaidAmount.toFixed(2)}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">⚠️</div>
          <div className="kpi-content">
            <p className="kpi-label">Overdue</p>
            <p className="kpi-value">{snapshot.overdueCount}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h3 className="section-title">Payment Status</h3>
        <div className="progress-container">
          <div className="progress-bar-wrapper">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${paidPercent}%` }}
              ></div>
            </div>
          </div>
          <p className="progress-label">
            {paidPercent.toFixed(0)}% collected • ${snapshot.paidAmount.toFixed(2)} of ${snapshot.totalInvoiced.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="dashboard-section">
        <h3 className="section-title">Quick Tips</h3>
        <ul className="tips-list">
          <li>Create invoices and share them with clients via email or WhatsApp.</li>
          <li>Track payments and automatically update invoice status.</li>
          <li>Export invoices to PDF for printing or archiving.</li>
          <li>View all clients and their invoice history.</li>
        </ul>
      </div>
    </div>
  )
}
