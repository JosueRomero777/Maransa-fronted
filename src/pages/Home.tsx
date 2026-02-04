import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Card,
  CardContent,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  Business as BusinessIcon,
  Inventory as InventoryIcon,
  LocalShipping as ShippingIcon,
  ShoppingCart as OrdersIcon,
  Science as LabIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useAuth } from '../context';
import { statsService, type DashboardStats } from '../services/stats.service';

interface DashboardStats {
  totalProviders: number;
  activeProviders: number;
  totalPackagers: number;
  activePackagers: number;
  totalOrders: number;
  pendingOrders: number;
  totalUsers: number;
}

export default function Home() {
  const { user } = useAuth();
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    totalProviders: 0,
    activeProviders: 0,
    totalPackagers: 0,
    activePackagers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar estadísticas reales desde la base de datos
    const loadStats = async () => {
      try {
        setLoading(true);
        const realStats = await statsService.getDashboardStats();
        setStats(realStats);
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Proveedores',
      value: stats.totalProviders,
      subtitle: `${stats.activeProviders} activos`,
      icon: BusinessIcon,
      color: theme.palette.primary.main,
      bgColor: alpha(theme.palette.primary.main, 0.1)
    },
    {
      title: 'Empacadoras',
      value: stats.totalPackagers,
      subtitle: `${stats.activePackagers} activas`,
      icon: InventoryIcon,
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1)
    },
    {
      title: 'Pedidos',
      value: stats.totalOrders,
      subtitle: `${stats.pendingOrders} pendientes`,
      icon: OrdersIcon,
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.1)
    },
    {
      title: 'Usuarios',
      value: stats.totalUsers,
      subtitle: 'Usuarios activos',
      icon: PeopleIcon,
      color: theme.palette.info.main,
      bgColor: alpha(theme.palette.info.main, 0.1)
    }
  ];

  const quickLinks = [
    { title: 'Gestión Comercial', icon: BusinessIcon, link: '/providers', description: 'Proveedores y Empacadoras' },
    { title: 'Pedidos', icon: OrdersIcon, link: '/orders', description: 'Gestión de pedidos' },
    { title: 'Laboratorio', icon: LabIcon, link: '/laboratory', description: 'Análisis y control' },
    { title: 'Logística', icon: ShippingIcon, link: '/logistics', description: 'Transporte y distribución' },
    { title: 'Predicciones IA', icon: AssessmentIcon, link: '/ai-predictions', description: 'Análisis predictivo' },
    { title: 'Estadísticas', icon: TrendingUpIcon, link: '#', description: 'Reportes y gráficos' }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 600, 
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Bienvenido, {user?.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Sistema de Gestión Integral para la Industria Camaronera
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Stats Cards */}
          <Box sx={{ 
            mb: 4, 
            maxWidth: 1200, 
            mx: 'auto',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2
          }}>
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card 
                  key={index}
                  elevation={0}
                  sx={{ 
                    height: '100%',
                    background: `linear-gradient(135deg, ${alpha(card.color, 0.05)} 0%, ${alpha(card.color, 0.15)} 100%)`,
                    border: `1px solid ${alpha(card.color, 0.2)}`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8]
                    }
                  }}
                >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {card.title}
                          </Typography>
                          <Typography variant="h3" sx={{ fontWeight: 700, color: card.color }}>
                            {card.value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {card.subtitle}
                          </Typography>
                        </Box>
                        <Box 
                          sx={{ 
                            p: 1.5, 
                            borderRadius: 2, 
                            backgroundColor: card.bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Icon sx={{ fontSize: 32, color: card.color }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
              );
            })}
          </Box>

          {/* Quick Access */}
          <Box sx={{ mb: 3, maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Acceso Rápido
            </Typography>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2
            }}>
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Paper
                    key={index}
                    component="a"
                    href={link.link}
                    sx={{
                      p: 2.5,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                          borderColor: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.02)
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1.5,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            display: 'flex'
                          }}
                        >
                          <Icon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {link.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {link.description}
                      </Typography>
                    </Paper>
                );
              })}
            </Box>
          </Box>

          {/* User Info Card */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              maxWidth: 1200,
              mx: 'auto'
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Información de Usuario
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Nombre:</strong> {user?.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Email:</strong> {user?.email}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Rol:</strong> {user?.role}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Estado:</strong> Activo
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}
    </Container>
  );
}
