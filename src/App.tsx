import './App.css'
import './index.css'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import ProvidersList from './pages/ProvidersList'
import ProviderForm from './pages/ProviderForm'
import Home from './pages/Home'
import LogoShrimp from './assets/camaron.png'
import { SelectedProviderProvider, useSelectedProvider } from './contexts/SelectedProviderContext'

function App() {
  return (
    <BrowserRouter>
      <SelectedProviderProvider>
        <AppLayout />
      </SelectedProviderProvider>
    </BrowserRouter>
  )
}

function AppLayout() {
  const location = useLocation()
  const showSummary = location.pathname.startsWith('/providers')

  return (
    <div id="root" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
 

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left sidebar with logo */}
        <nav className="sidebar" style={{ width: 260, borderRight: '1px solid #eee', padding: 12, display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: '#f3f3ea' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 , marginTop: 10}}>
            <img src={LogoShrimp} alt="Maransa" style={{ width: 40, height: 40, objectFit: 'contain' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.5rem' }}>Maransa</div>
              
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to="/">Inicio</Link>
            <Link to="/providers">Proveedores</Link>
          </div>
        </nav>

        {/* Main content area */}
        <main style={{ flex: 1, padding: 16 }}>
          <Routes>
            <Route path="/providers" element={<ProvidersList />} />
            <Route path="/providers/new" element={<ProviderForm />} />
            <Route path="/providers/:id/edit" element={<ProviderForm />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </main>

        {/* Right column: summary (visible only in providers module) */}
        {showSummary && (
          <aside className="card summary-card" style={{ width: 300, padding: 16, backgroundColor: '#f3f3ea' }}>
            <SelectedSummary />
          </aside>
        )}
      </div>
    </div>
  )
}

export default App

function SelectedSummary() {
  const { selected } = useSelectedProvider()
  // show summary only on providers routes
  const location = useLocation()
  if (!location.pathname.startsWith('/providers')) return null

  if (!selected) {
    return (
      <div >
        <strong>Resumen</strong>
        <div className="muted">Selecciona un proveedor para ver detalles o crear uno nuevo.</div>
      </div>
    )
  }

  return (
    <div>
      <strong>Resumen</strong>
      <div style={{ marginTop: 8  }}>
        <div style={{ fontWeight: 700 }}>{selected.name}</div>
        <div className="muted">{selected.type} • {selected.location}</div>
        <div style={{ marginTop: 8 }}>
          <div><strong>Capacidad:</strong> {selected.capacity ?? '-'} lbs</div>
          <div><strong>Email:</strong> {selected.contact_email ?? '-'}</div>
          <div><strong>Teléfono:</strong> {selected.contact_phone ?? '-'}</div>
        </div>
        {selected.notes && <div style={{ marginTop: 8 }}><strong>Notas:</strong> <div className="muted">{selected.notes}</div></div>}
      </div>
    </div>
  )
}
