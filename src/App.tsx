import React from 'react'
import './App.css'
import './index.css'
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline, Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Paper, IconButton, Divider, Button, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import { 
  Home as HomeIcon, 
  Business as BusinessIcon, 
  People as PeopleIcon,
  ShoppingCart as OrdersIcon,
  LocalShipping as ReceptionIcon,
  Science as LaboratoryIcon,
  LocalShipping as LogisticsIcon,
  Security as CustodyIcon,
  Agriculture as HarvestIcon,
  History as LogsIcon,
  Receipt as InvoiceIcon,
  TrendingUp as EstimationsIcon,
  Assessment as StatisticsIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  ExitToApp,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import ProvidersList from './pages/ProvidersList'
import ProviderForm from './pages/ProviderForm'
import PackagersList from './pages/PackagersList'
import PackagerForm from './pages/PackagerForm'
import OrdersList from './pages/OrdersList'
import OrderForm from './pages/OrderForm'
import OrderDetail from './pages/OrderDetail'
import ReceptionsList from './pages/reception/ReceptionsList'
import LaboratoryPage from './pages/LaboratoryPage'
import LogisticsPage from './pages/LogisticsPage'
import CustodyPage from './pages/CustodyPage'
import LogsPage from './pages/LogsPage'
import HarvestDefinitionPage from './pages/HarvestDefinitionPage'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import UsersList from './pages/UsersList'
import InvoicesList from './pages/InvoicesList'
import InvoiceForm from './pages/InvoiceForm'
import InvoiceConfigPage from './pages/InvoiceConfigPage'
import PriceEstimations from './pages/PriceEstimations'
import AIPredictionsPage from './pages/AIPredictionsPage'
import StatisticsPage from './pages/StatisticsPage'
import LogoShrimp from './assets/camaron.png'
import { SelectedProviderProvider, useSelectedProvider } from './contexts/SelectedProviderContext'
import { SelectedPackagerProvider, useSelectedPackager } from './contexts/SelectedPackagerContext'
import { AuthProvider, useAuth } from './context'
import { DrawerProvider, useDrawer } from './context/DrawerContext'
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

// Componente para el contenido del drawer
interface DrawerItem {
  text: string;
  path: string;
  icon: JSX.Element;
}

interface DrawerContentProps {
  menuItems: DrawerItem[];
  location: any;
  user?: any;
  onLogout?: () => void;
  onCloseMobileDrawer?: () => void;
  isMobileDrawer?: boolean;
}

const DrawerContent: React.FC<DrawerContentProps> = ({ 
  menuItems, 
  location, 
  user, 
  onLogout, 
  onCloseMobileDrawer,
  isMobileDrawer
}) => {
  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'ADMIN': 'Administrador',
      'COMPRAS': 'Compras',
      'LABORATORIO': 'Laboratorio',
      'LOGISTICA': 'Logística',
      'CUSTODIA': 'Custodia',
      'FACTURACION': 'Facturación',
      'GERENCIA': 'Gerencia',
    };
    return roleMap[role] || role;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
      <Box sx={{ px: 2, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          overflowY: 'auto', 
          flex: 1, 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { 
            display: 'none'
          }
        }}>
          <List sx={{ p: 0 }}>
            {/* Inicio */}
            {menuItems.slice(0, 1).map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  component="a"
                  href={item.path}
                  onClick={onCloseMobileDrawer}
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

            {/* Usuarios (si es admin) */}
            {user?.role === 'ADMIN' && menuItems.find(item => item.path === '/users') && (
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  component="a"
                  href="/users"
                  onClick={onCloseMobileDrawer}
                  sx={{
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                    ...(location.pathname === '/users' && {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    }),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <PeopleIcon />
                  </ListItemIcon>
                  <ListItemText primary="Usuarios" />
                </ListItemButton>
              </ListItem>
            )}
          </List>

          {/* Acordeón fijo: solo Gestión Comercial (desktop y mobile) */}
          {menuItems.filter(item => item.text === 'Gestión Comercial' && item.subitems && item.subitems.length > 0).map((item) => (
            <Accordion 
              key={item.text}
              elevation={0}
              disableGutters
              sx={{
                backgroundColor: 'transparent',
                '&:before': { display: 'none' },
                mb: 1,
                '& .MuiButtonBase-root': {
                  outline: 'none !important',
                  '&:focus': {
                    outline: 'none !important',
                    boxShadow: 'none !important'
                  }
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  minHeight: 48,
                  px: 2,
                  borderRadius: 2,
                  outline: 'none !important',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  '&:focus': {
                    outline: 'none !important',
                    boxShadow: 'none !important'
                  },
                  '&.Mui-focusVisible': {
                    outline: 'none !important',
                    boxShadow: 'none !important'
                  },
                  '& .MuiAccordionSummary-content': {
                    my: 0,
                    alignItems: 'center',
                    gap: 2
                  }
                }}
              >
                {item.icon && <Box sx={{ color: 'action.active' }}>{item.icon}</Box>}
                <Typography>{item.text}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0, pl: 2 }}>
                <List sx={{ p: 0 }}>
                  {item.subitems?.map((subitem) => (
                    <ListItem key={subitem.path} disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        component="a"
                        href={subitem.path}
                        onClick={(e) => {
                          e.stopPropagation();
                          onCloseMobileDrawer?.();
                        }}
                        sx={{
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor: 'primary.main',
                            color: 'white',
                            '& .MuiListItemIcon-root': {
                              color: 'white',
                            },
                          },
                          ...(location.pathname.startsWith(subitem.path) && {
                            backgroundColor: 'primary.main',
                            color: 'white',
                            '& .MuiListItemIcon-root': {
                              color: 'white',
                            },
                          }),
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {subitem.icon || <BusinessIcon />}
                        </ListItemIcon>
                        <ListItemText primary={subitem.text} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}

          {/* Render all remaining items (tanto en mobile como en desktop) */}
          {menuItems.slice(1).filter(item => item.path !== '/users' && item.path !== '/logs').map((item) => {
            // No renderizar aquí items con subitems (Gestión Comercial se renderiza arriba)
            if (item.subitems && item.subitems.length > 0) {
              return null;
            }

            // En mobile, skip items que ya están en acordeones
            if (isMobileDrawer && ['/laboratory', '/harvest', '/logistics', '/custody', '/receptions', '/ai-predictions', '/statistics'].includes(item.path)) {
              return null;
            }
            
            // Render items with subitems as acordeones SOLO EN MOBILE
            if (isMobileDrawer && item.subitems && item.subitems.length > 0) {
              return (
                <Accordion 
                  key={item.text}
                  elevation={0}
                  disableGutters
                  sx={{
                    backgroundColor: 'transparent',
                    '&:before': { display: 'none' },
                    mb: 1,
                    '& .MuiButtonBase-root': {
                      outline: 'none !important',
                      '&:focus': {
                        outline: 'none !important',
                        boxShadow: 'none !important'
                      }
                    }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      minHeight: 48,
                      px: 2,
                      borderRadius: 2,
                      outline: 'none !important',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      '&:focus': {
                        outline: 'none !important',
                        boxShadow: 'none !important'
                      },
                      '&.Mui-focusVisible': {
                        outline: 'none !important',
                        boxShadow: 'none !important'
                      },
                      '& .MuiAccordionSummary-content': {
                        my: 0,
                        alignItems: 'center',
                        gap: 2
                      }
                    }}
                  >
                    {item.icon && <Box sx={{ color: 'action.active' }}>{item.icon}</Box>}
                    <Typography>{item.text}</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0, pl: 2 }}>
                    <List sx={{ p: 0 }}>
                      {item.subitems.map((subitem) => (
                        <ListItem key={subitem.path} disablePadding sx={{ mb: 1 }}>
                          <ListItemButton
                            component="a"
                            href={subitem.path}
                            onClick={(e) => {
                              e.stopPropagation();
                              onCloseMobileDrawer?.();
                            }}
                            sx={{
                              borderRadius: 2,
                              '&:hover': {
                                backgroundColor: 'primary.main',
                                color: 'white',
                                '& .MuiListItemIcon-root': {
                                  color: 'white',
                                },
                              },
                              ...(location.pathname.startsWith(subitem.path) && {
                                backgroundColor: 'primary.main',
                                color: 'white',
                                '& .MuiListItemIcon-root': {
                                  color: 'white',
                                },
                              }),
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              {subitem.icon}
                            </ListItemIcon>
                            <ListItemText primary={subitem.text} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              );
            }
            
            // Render regular items (non-accordion)
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  component="a"
                  href={item.path}
                  onClick={onCloseMobileDrawer}
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
            );
          })}

          {/* Logs del Sistema (si es admin) - al final */}
            {/* Acordeones adicionales SOLO EN MOBILE */}
            {isMobileDrawer && (
              <>
                {/* Acordeón Análisis y Producción (mobile only) */}
                {menuItems.find(item => item.path === '/laboratory') && menuItems.find(item => item.path === '/harvest') && (
                  <Accordion 
                    elevation={0}
                    disableGutters
                    sx={{
                      backgroundColor: 'transparent',
                      '&:before': { display: 'none' },
                      mb: 1,
                      '& .MuiButtonBase-root': {
                        outline: 'none !important',
                        '&:focus': {
                          outline: 'none !important',
                          boxShadow: 'none !important'
                        }
                      }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        minHeight: 48,
                        px: 2,
                        borderRadius: 2,
                        outline: 'none !important',
                        '&:hover': { backgroundColor: 'action.hover' },
                        '&:focus': { outline: 'none !important', boxShadow: 'none !important' },
                        '&.Mui-focusVisible': { outline: 'none !important', boxShadow: 'none !important' },
                        '& .MuiAccordionSummary-content': { my: 0, alignItems: 'center', gap: 2 }
                      }}
                    >
                      <LaboratoryIcon sx={{ color: 'action.active' }} />
                      <Typography>Análisis y Producción</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0, pl: 2 }}>
                      <List sx={{ p: 0 }}>
                        {menuItems.filter(i => ['/laboratory', '/harvest'].includes(i.path)).map((item) => (
                          <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                              component="a"
                              href={item.path}
                              onClick={(e) => { e.stopPropagation(); onCloseMobileDrawer?.(); }}
                              sx={{
                                borderRadius: 2,
                                '&:hover': { backgroundColor: 'primary.main', color: 'white', '& .MuiListItemIcon-root': { color: 'white' } },
                                ...(location.pathname === item.path && { backgroundColor: 'primary.main', color: 'white', '& .MuiListItemIcon-root': { color: 'white' } }),
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                              <ListItemText primary={item.text} />
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Acordeón Logística y Almacenamiento (mobile only) */}
                {menuItems.find(item => item.path === '/logistics') && (
                  <Accordion 
                    elevation={0}
                    disableGutters
                    sx={{
                      backgroundColor: 'transparent',
                      '&:before': { display: 'none' },
                      mb: 1,
                      '& .MuiButtonBase-root': {
                        outline: 'none !important',
                        '&:focus': { outline: 'none !important', boxShadow: 'none !important' }
                      }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        minHeight: 48,
                        px: 2,
                        borderRadius: 2,
                        outline: 'none !important',
                        '&:hover': { backgroundColor: 'action.hover' },
                        '&:focus': { outline: 'none !important', boxShadow: 'none !important' },
                        '&.Mui-focusVisible': { outline: 'none !important', boxShadow: 'none !important' },
                        '& .MuiAccordionSummary-content': { my: 0, alignItems: 'center', gap: 2 }
                      }}
                    >
                      <LogisticsIcon sx={{ color: 'action.active' }} />
                      <Typography>Logística y Almacenamiento</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0, pl: 2 }}>
                      <List sx={{ p: 0 }}>
                        {menuItems.filter(i => ['/logistics', '/custody', '/receptions'].includes(i.path)).map((item) => (
                          <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                              component="a"
                              href={item.path}
                              onClick={(e) => { e.stopPropagation(); onCloseMobileDrawer?.(); }}
                              sx={{
                                borderRadius: 2,
                                '&:hover': { backgroundColor: 'primary.main', color: 'white', '& .MuiListItemIcon-root': { color: 'white' } },
                                ...(location.pathname === item.path && { backgroundColor: 'primary.main', color: 'white', '& .MuiListItemIcon-root': { color: 'white' } }),
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                              <ListItemText primary={item.text} />
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Acordeón Análisis e IA (mobile only) */}
                {menuItems.find(item => item.path === '/ai-predictions') && (
                  <Accordion 
                    elevation={0}
                    disableGutters
                    sx={{
                      backgroundColor: 'transparent',
                      '&:before': { display: 'none' },
                      mb: 1,
                      '& .MuiButtonBase-root': {
                        outline: 'none !important',
                        '&:focus': { outline: 'none !important', boxShadow: 'none !important' }
                      }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        minHeight: 48,
                        px: 2,
                        borderRadius: 2,
                        outline: 'none !important',
                        '&:hover': { backgroundColor: 'action.hover' },
                        '&:focus': { outline: 'none !important', boxShadow: 'none !important' },
                        '&.Mui-focusVisible': { outline: 'none !important', boxShadow: 'none !important' },
                        '& .MuiAccordionSummary-content': { my: 0, alignItems: 'center', gap: 2 }
                      }}
                    >
                      <EstimationsIcon sx={{ color: 'action.active' }} />
                      <Typography>Análisis e IA</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0, pl: 2 }}>
                      <List sx={{ p: 0 }}>
                        {menuItems.filter(i => i.path === '/ai-predictions' || i.path === '/statistics').map((item) => (
                          <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                              component="a"
                              href={item.path}
                              onClick={(e) => { e.stopPropagation(); onCloseMobileDrawer?.(); }}
                              sx={{
                                borderRadius: 2,
                                '&:hover': { backgroundColor: 'primary.main', color: 'white', '& .MuiListItemIcon-root': { color: 'white' } },
                                ...(location.pathname === item.path && { backgroundColor: 'primary.main', color: 'white', '& .MuiListItemIcon-root': { color: 'white' } }),
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                              <ListItemText primary={item.text} />
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}
              </>
            )}

            {/* Logs del Sistema (si es admin) - al final */}
            <List sx={{ p: 0 }}>
            {user?.role === 'ADMIN' && menuItems.find(item => item.path === '/logs') && (
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  component="a"
                  href="/logs"
                  onClick={onCloseMobileDrawer}
                  sx={{
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                    ...(location.pathname === '/logs' && {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    }),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <LogsIcon />
                  </ListItemIcon>
                  <ListItemText primary="Logs del Sistema" />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </Box>

      {/* User Info Footer - Only on Mobile Drawer */}
      {user && isMobileDrawer && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              {user.email}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
              {user.name}
            </Typography>
            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, mb: 2, display: 'block' }}>
              {getRoleDisplayName(user.role)}
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<ExitToApp />}
              size="small"
              onClick={() => {
                onLogout?.();
                onCloseMobileDrawer?.();
              }}
            >
              Cerrar Sesión
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

const DrawerContentWrapper: React.FC<DrawerContentProps> = (props) => <DrawerContent {...props} />;

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <DrawerProvider>
            <SelectedProviderProvider>
              <SelectedPackagerProvider>
                <AppRoutes />
              </SelectedPackagerProvider>
            </SelectedProviderProvider>
          </DrawerProvider>
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
  const showSummary = location.pathname.startsWith('/providers') || location.pathname.startsWith('/packagers')
  const { user, logout } = useAuth();
  const { mobileOpen, setMobileOpen } = useDrawer();
  const navigate = useNavigate();

  const menuItems = React.useMemo(() => {
    const allItems = [
      { text: 'Inicio', path: '/home', icon: <HomeIcon />, roles: ['ADMIN', 'GERENCIA'] },
    ];

    // Usuarios (solo ADMIN)
    if (user?.role === 'ADMIN') {
      allItems.push({ text: 'Usuarios', path: '/users', icon: <PeopleIcon />, roles: ['ADMIN'] });
    }

    // Gestión Comercial (Proveedores y Empacadoras)
    if (['ADMIN', 'COMPRAS', 'LABORATORIO', 'GERENCIA'].includes(user?.role || '')) {
      allItems.push({
        text: 'Gestión Comercial',
        path: '/providers',
        icon: <BusinessIcon />,
        roles: ['ADMIN', 'COMPRAS', 'LABORATORIO', 'GERENCIA'],
        subitems: [
          { text: 'Proveedores', path: '/providers', roles: ['ADMIN', 'COMPRAS', 'LABORATORIO', 'GERENCIA'] },
          { text: 'Empacadoras', path: '/packagers', roles: ['ADMIN', 'COMPRAS', 'GERENCIA'] }
        ]
      });
    }

    // Pedidos (ADMIN, COMPRAS, GERENCIA)
    if (['ADMIN', 'COMPRAS', 'GERENCIA'].includes(user?.role || '')) {
      allItems.push({ text: 'Pedidos', path: '/orders', icon: <OrdersIcon />, roles: ['ADMIN', 'COMPRAS', 'GERENCIA'] });
    }

    // Laboratorio (ADMIN, LABORATORIO, GERENCIA)
    if (['ADMIN', 'LABORATORIO', 'GERENCIA'].includes(user?.role || '')) {
      allItems.push({ text: 'Laboratorio', path: '/laboratory', icon: <LaboratoryIcon />, roles: ['ADMIN', 'LABORATORIO', 'GERENCIA'] });
    }

    // Cosechas (ADMIN, COMPRAS, LABORATORIO, GERENCIA)
    if (['ADMIN', 'COMPRAS', 'LABORATORIO', 'GERENCIA'].includes(user?.role || '')) {
      allItems.push({ text: 'Cosechas', path: '/harvest', icon: <HarvestIcon />, roles: ['ADMIN', 'COMPRAS', 'LABORATORIO', 'GERENCIA'] });
    }

      // Logística (ADMIN, LOGISTICA, GERENCIA)
      if (['ADMIN', 'LOGISTICA', 'GERENCIA'].includes(user?.role || '')) {
        allItems.push({ text: 'Logística', path: '/logistics', icon: <LogisticsIcon />, roles: ['ADMIN', 'LOGISTICA', 'GERENCIA'] });
      }

      // Custodia (ADMIN, CUSTODIA, LOGISTICA, GERENCIA)
      if (['ADMIN', 'CUSTODIA', 'LOGISTICA', 'GERENCIA'].includes(user?.role || '')) {
        allItems.push({ text: 'Custodia', path: '/custody', icon: <CustodyIcon />, roles: ['ADMIN', 'CUSTODIA', 'LOGISTICA', 'GERENCIA'] });
      }

      // Recepciones (ADMIN, LOGISTICA, GERENCIA - SIN CUSTODIA)
      if (['ADMIN', 'LOGISTICA', 'GERENCIA'].includes(user?.role || '')) {
        allItems.push({ text: 'Recepciones', path: '/receptions', icon: <ReceptionIcon />, roles: ['ADMIN', 'LOGISTICA', 'GERENCIA'] });
      }

    // Facturación (ADMIN, FACTURACION, GERENCIA)
    if (['ADMIN', 'FACTURACION', 'GERENCIA'].includes(user?.role || '')) {
      allItems.push({ text: 'Facturación', path: '/invoices', icon: <InvoiceIcon />, roles: ['ADMIN', 'FACTURACION', 'GERENCIA'] });
    }

    // Análisis e IA (Predicciones y Estadísticas) - ADMIN, COMPRAS, GERENCIA
    if (['ADMIN', 'COMPRAS', 'GERENCIA'].includes(user?.role || '')) {
      allItems.push(
        { text: 'Predicciones IA', path: '/ai-predictions', icon: <EstimationsIcon />, roles: ['ADMIN', 'COMPRAS', 'GERENCIA'] },
        { text: 'Estadísticas', path: '/statistics', icon: <StatisticsIcon />, roles: ['ADMIN', 'GERENCIA'] }
      );
    }

    // Logs (solo ADMIN)
    if (user?.role === 'ADMIN') {
      allItems.push({ text: 'Logs del Sistema', path: '/logs', icon: <LogsIcon />, roles: ['ADMIN'] });
    }

    return allItems;
  }, [user?.role]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navbar */}
      <Navbar />
      
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar - Desktop Permanent Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundColor: '#f8fafc',
              borderRight: '1px solid #e2e8f0',
              position: 'relative',
              height: 'calc(100vh - 64px)',
              top: 0,
              overflow: 'auto',
            },
          }}
        >
          <DrawerContent 
            menuItems={menuItems} 
            location={location}
            user={user}
            onLogout={() => {
              logout();
              navigate('/login');
            }}
            isMobileDrawer={false}
          />
        </Drawer>

        {/* Sidebar - Mobile Temporary Drawer */}
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundColor: '#f8fafc',
              borderRight: '1px solid #e2e8f0',
            },
          }}
        >
          <DrawerContent 
            menuItems={menuItems} 
            location={location}
            user={user}
            onLogout={() => {
              logout();
              navigate('/login');
              setMobileOpen(false);
            }}
            onCloseMobileDrawer={() => setMobileOpen(false)}
            isMobileDrawer={true}
          />
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
          <Route path="/packagers" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'COMPRAS', 'GERENCIA']}>
              <PackagersList />
            </ProtectedRoute>
          } />
          <Route path="/packagers/new" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'COMPRAS']}>
              <PackagerForm />
            </ProtectedRoute>
          } />
          <Route path="/packagers/:id/edit" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'COMPRAS']}>
              <PackagerForm />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'COMPRAS', 'GERENCIA']}>
              <OrdersList />
            </ProtectedRoute>
          } />
          <Route path="/orders/new" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'COMPRAS']}>
              <OrderForm />
            </ProtectedRoute>
          } />
          <Route path="/orders/:id" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'COMPRAS', 'GERENCIA']}>
              <OrderDetail />
            </ProtectedRoute>
          } />
          <Route path="/orders/:id/edit" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'COMPRAS']}>
              <OrderForm />
            </ProtectedRoute>
          } />
          <Route path="/receptions" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'LOGISTICA', 'GERENCIA']}>
              <ReceptionsList />
            </ProtectedRoute>
          } />
          <Route path="/laboratory" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'LABORATORIO', 'GERENCIA']}>
              <LaboratoryPage />
            </ProtectedRoute>
          } />
          <Route path="/logistics" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'LOGISTICA', 'GERENCIA']}>
              <LogisticsPage />
            </ProtectedRoute>
          } />
          <Route path="/custody" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'CUSTODIA', 'LOGISTICA', 'GERENCIA']}>
              <CustodyPage />
            </ProtectedRoute>
          } />
          <Route path="/harvest" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'LABORATORIO', 'COMPRAS', 'GERENCIA']}>
              <HarvestDefinitionPage />
            </ProtectedRoute>
          } />
          <Route path="/home" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'GERENCIA']}>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute requiredRoles={['ADMIN']}>
              <UsersList />
            </ProtectedRoute>
          } />
          <Route path="/logs" element={
            <ProtectedRoute requiredRoles={['ADMIN']}>
              <LogsPage />
            </ProtectedRoute>
          } />
          <Route path="/invoices" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'GERENCIA', 'FACTURACION']}>
              <InvoicesList />
            </ProtectedRoute>
          } />
          <Route path="/invoices/new" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'GERENCIA']}>
              <InvoiceForm />
            </ProtectedRoute>
          } />
          <Route path="/invoices/:id/edit" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'GERENCIA']}>
              <InvoiceForm />
            </ProtectedRoute>
          } />
          <Route path="/invoices/config" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'GERENCIA']}>
              <InvoiceConfigPage />
            </ProtectedRoute>
          } />
          <Route path="/ai-predictions" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'GERENCIA', 'COMPRAS']}>
              <AIPredictionsPage />
            </ProtectedRoute>
          } />
          <Route path="/statistics" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'GERENCIA']}>
              <StatisticsPage />
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
            display: { xs: 'none', md: 'block' },
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
  const { selected: selectedProvider } = useSelectedProvider()
  const { selected: selectedPackager } = useSelectedPackager()
  const location = useLocation()
  
  const isProviders = location.pathname.startsWith('/providers')
  const isPackagers = location.pathname.startsWith('/packagers')
  
  if (!isProviders && !isPackagers) return null

  // Provider summary
  if (isProviders) {
    if (!selectedProvider) {
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
            {selectedProvider.name}
          </Typography>
          
          {(selectedProvider.type || selectedProvider.location) && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {getTipoProveedorLabel(selectedProvider.type)}{selectedProvider.type && selectedProvider.location ? ' • ' : ''}{selectedProvider.location}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Capacidad:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedProvider.capacity ? `${selectedProvider.capacity.toLocaleString()} lbs` : '-'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Email:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                {selectedProvider.contact_email || '-'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Teléfono:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedProvider.contact_phone || '-'}
              </Typography>
            </Box>
            
            {selectedProvider.contact_whatsapp && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  WhatsApp:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedProvider.contact_whatsapp}
                </Typography>
              </Box>
            )}
          </Box>
          
          {selectedProvider.notes && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                Notas:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                {selectedProvider.notes}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    )
  }

  // Packager summary
  if (isPackagers) {
    if (!selectedPackager) {
      return (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Resumen
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selecciona una empacadora para ver sus detalles o crear una nueva.
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
            {selectedPackager.name}
          </Typography>
          
          {selectedPackager.location && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              📍 {selectedPackager.location}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {selectedPackager.ruc && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  RUC:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedPackager.ruc}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Email:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                {selectedPackager.contact_email || '-'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Teléfono:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedPackager.contact_phone || '-'}
              </Typography>
            </Box>
            
            {selectedPackager.contact_whatsapp && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  WhatsApp:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedPackager.contact_whatsapp}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Estado:
              </Typography>
              <Typography variant="body2" color={selectedPackager.active ? 'success.main' : 'text.secondary'}>
                {selectedPackager.active ? 'Activo' : 'Inactivo'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    )
  }

  return null
});

SelectedSummary.displayName = 'SelectedSummary';
