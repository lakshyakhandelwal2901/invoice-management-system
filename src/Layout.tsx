import { useState } from 'react'
import { Dashboard } from './pages/Dashboard'
import { InvoiceList } from './pages/InvoiceList'
import { CreateInvoice } from './pages/CreateInvoice'
import { ClientList } from './pages/ClientList'
import { InvoiceDetail } from './pages/InvoiceDetail'
import './Layout.css'

type Page = 'dashboard' | 'invoices' | 'clients' | 'create-invoice' | 'invoice-detail'

export function Layout() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null)

  const handleViewInvoice = (id: number) => {
    setSelectedInvoiceId(id)
    setCurrentPage('invoice-detail')
  }

  const handleCreateInvoice = () => {
    setCurrentPage('create-invoice')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="app-logo">📄</div>
          <h1 className="app-title">Invoices</h1>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Dashboard</span>
          </button>
          <button
            className={`nav-item ${currentPage === 'invoices' ? 'active' : ''}`}
            onClick={() => setCurrentPage('invoices')}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">Invoices</span>
          </button>
          <button
            className={`nav-item ${currentPage === 'clients' ? 'active' : ''}`}
            onClick={() => setCurrentPage('clients')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">Clients</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <p className="sidebar-version">v0.0.0</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="app-header">
          <div className="header-breadcrumb">
            {currentPage === 'dashboard' && <h2>Dashboard</h2>}
            {currentPage === 'invoices' && <h2>Invoices</h2>}
            {currentPage === 'clients' && <h2>Clients</h2>}
            {currentPage === 'create-invoice' && <h2>Create Invoice</h2>}
            {currentPage === 'invoice-detail' && <h2>Invoice Details</h2>}
          </div>
          {currentPage !== 'create-invoice' && currentPage !== 'invoice-detail' && (
            <button className="btn-primary" onClick={handleCreateInvoice}>
              + New Invoice
            </button>
          )}
        </header>

        <div className="page-content">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'invoices' && <InvoiceList onViewInvoice={handleViewInvoice} />}
          {currentPage === 'clients' && <ClientList />}
          {currentPage === 'create-invoice' && (
            <CreateInvoice onSuccess={() => setCurrentPage('invoices')} />
          )}
          {currentPage === 'invoice-detail' && selectedInvoiceId && (
            <InvoiceDetail
              invoiceId={selectedInvoiceId}
              onBack={() => setCurrentPage('invoices')}
            />
          )}
        </div>
      </main>
    </div>
  )
}
