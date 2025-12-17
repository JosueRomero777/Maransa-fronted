import React from 'react'
import './App.css'
import './index.css'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline, Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Paper } from '@mui/material'
import { Home as HomeIcon, Business as BusinessIcon, People as PeopleIcon } from '@mui/icons-material';
import ProvidersList from './pages/ProvidersList'
import ProviderForm from './pages/ProviderForm'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import UsersList from './pages/UsersList'
import LogoShrimp from './assets/camaron.png'
import { SelectedProviderProvider, useSelectedProvider } from './contexts/SelectedProviderContext'
import { AuthProvider, useAuth } from './context'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'

// Helper function to get friendly names for provider types
const getTipoProveedorLabel = (tipo?: string): string => {
  switch (tipo) {
    case 'PEQUENA_CAMARONERA':
      return 'Pequeña Camaronera';
    case 'MEDIANA_CAMARONERA':
      return 'Mediana Camaronera';
    case 'GRAN_CAMARONERA':
      return 'Gran Camaronera';
    default:
      return tipo || '';
  }
};

// Create MUI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
      light: '#3b82f6',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#059669',
      light: '#10b981',
      dark: '#047857',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

const drawerWidth = 260;

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <SelectedProviderProvider>
            <AppRoutes />
          </SelectedProviderProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Rutas privadas */}
      <Route path="/*" element={<AppLayout />} />
    </Routes>
  );
}

const AppLayout = React.memo(() => {
  const location = useLocation()
  const showSummary = location.pathname.startsWith('/providers')
  const { user } = useAuth();

  const menuItems = React.useMemo(() => [
    { text: 'Inicio', path: '/home', icon: <HomeIcon /> },
    { text: 'Proveedores', path: '/providers', icon: <BusinessIcon /> },
    ...(user?.role === 'ADMIN' ? [{ text: 'Usuarios', path: '/users', icon: <PeopleIcon /> }] : []),
  ], [user?.role]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navbar */}
      <Navbar />
      
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#f8fafc',
            borderRight: '1px solid #e2e8f0',
            position: 'relative',
            height: '100%',
          },
        }}
      >
        {/* Logo */}
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <img 
            src={LogoShrimp} 
            alt="Maransa" 
            style={{ width: 40, height: 40, objectFit: 'contain' }} 
          />
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Maransa
          </Typography>
        </Box>

        {/* Navigation */}
        <List sx={{ px: 2 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component="a"
                href={item.path}
                sx={{
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  ...(location.pathname === item.path && {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  }),
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: 'background.default',
          overflow: 'auto',
        }}
      >
        <Routes>
          <Route path="/providers" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'COMPRAS', 'LABORATORIO', 'LOGISTICA', 'GERENCIA']}>
              <ProvidersList />
            </ProtectedRoute>
          } />
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/providers/new" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'COMPRAS']}>
              <ProviderForm />
            </ProtectedRoute>
          } />
          <Route path="/providers/:id/edit" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'COMPRAS']}>
              <ProviderForm />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute requiredRoles={['ADMIN']}>
              <UsersList />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </Box>

      {/* Summary sidebar (only on providers pages) */}
      {showSummary && (
        <Drawer
          variant="permanent"
          anchor="right"
          sx={{
            width: 300,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 300,
              boxSizing: 'border-box',
              backgroundColor: '#f8fafc',
              borderLeft: '1px solid #e2e8f0',
              position: 'relative',
              height: '100%',
            },
          }}
        >
          <Box sx={{ p: 3 }}>
            <SelectedSummary />
          </Box>
        </Drawer>
      )}
      </Box>
    </Box>
  )
});

AppLayout.displayName = 'AppLayout';

export default App

const SelectedSummary = React.memo(() => {
  const { selected } = useSelectedProvider()
  const location = useLocation()
  
  if (!location.pathname.startsWith('/providers')) return null

  if (!selected) {
    return (
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Resumen
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Selecciona un proveedor para ver sus detalles o crear uno nuevo.
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Resumen
      </Typography>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          {selected.name}
        </Typography>
        
        {(selected.type || selected.location) && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {getTipoProveedorLabel(selected.type)}{selected.type && selected.location ? ' • ' : ''}{selected.location}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Capacidad:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selected.capacity ? `${selected.capacity.toLocaleString()} lbs` : '-'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Email:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
              {selected.contact_email || '-'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Teléfono:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selected.contact_phone || '-'}
            </Typography>
          </Box>
          
          {selected.contact_whatsapp && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                WhatsApp:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selected.contact_whatsapp}
              </Typography>
            </Box>
          )}
        </Box>
        
        {selected.notes && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              Notas:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              {selected.notes}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  )
});

SelectedSummary.displayName = 'SelectedSummary';
