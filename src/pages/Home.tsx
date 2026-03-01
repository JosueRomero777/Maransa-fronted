import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Card,
  CardContent,
  CircularProgress,
  Button,
  TextField,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
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
  People as PeopleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
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
  const { user, updateProfile, changePassword } = useAuth();
  const theme = useTheme();
  const role = user?.role || '';
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false,
  });
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

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
    });
  }, [user?.name, user?.email]);

  const handleSaveProfile = async () => {
    try {
      setProfileSaving(true);
      setProfileError(null);
      setProfileSuccess(null);

      if (!profileForm.name.trim() || !profileForm.email.trim()) {
        setProfileError('El nombre y el correo son obligatorios');
        return;
      }

      await updateProfile({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
      });

      setProfileSuccess('Perfil actualizado correctamente');
      setIsEditingProfile(false);
    } catch (error: any) {
      setProfileError(error?.message || 'No se pudo actualizar el perfil');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePassword = async () => {
    try {
      setPasswordSaving(true);
      setPasswordError(null);
      setPasswordSuccess(null);

      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        setPasswordError('Todos los campos de contraseña son obligatorios');
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        setPasswordError('La nueva contraseña debe tener al menos 6 caracteres');
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError('La confirmación de contraseña no coincide');
        return;
      }

      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordSuccess('Contraseña actualizada correctamente');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPassword({
        current: false,
        next: false,
        confirm: false,
      });
    } catch (error: any) {
      setPasswordError(error?.message || 'No se pudo cambiar la contraseña');
    } finally {
      setPasswordSaving(false);
    }
  };

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

  const roleCardPermissions: Record<string, string[]> = {
    ADMIN: ['providers', 'packagers', 'orders', 'users'],
    GERENCIA: ['providers', 'packagers', 'orders'],
    COMPRAS: ['providers', 'packagers', 'orders'],
    LABORATORIO: ['providers', 'packagers'],
    LOGISTICA: [],
    CUSTODIA: [],
    FACTURACION: [],
  };

  const cardKeys = ['providers', 'packagers', 'orders', 'users'];
  const visibleCardKeys = roleCardPermissions[role] || [];
  const visibleStatCards = statCards.filter((_, index) => visibleCardKeys.includes(cardKeys[index]));

  const quickLinks = [
    {
      title: 'Gestión Comercial',
      icon: BusinessIcon,
      link: '/providers',
      description: 'Proveedores y Empacadoras',
      roles: ['ADMIN', 'COMPRAS', 'LABORATORIO', 'GERENCIA'],
    },
    {
      title: 'Pedidos',
      icon: OrdersIcon,
      link: '/orders',
      description: 'Gestión de pedidos',
      roles: ['ADMIN', 'COMPRAS', 'GERENCIA'],
    },
    {
      title: 'Laboratorio',
      icon: LabIcon,
      link: '/laboratory',
      description: 'Análisis y control',
      roles: ['ADMIN', 'LABORATORIO', 'GERENCIA'],
    },
    {
      title: 'Logística',
      icon: ShippingIcon,
      link: '/logistics',
      description: 'Transporte y distribución',
      roles: ['ADMIN', 'LOGISTICA', 'GERENCIA'],
    },
    {
      title: 'Custodia',
      icon: ShippingIcon,
      link: '/custody',
      description: 'Seguimiento de custodia',
      roles: ['ADMIN', 'CUSTODIA', 'LOGISTICA', 'GERENCIA'],
    },
    {
      title: 'Recepciones',
      icon: ShippingIcon,
      link: '/receptions',
      description: 'Control de recepción',
      roles: ['ADMIN', 'LOGISTICA', 'GERENCIA'],
    },
    {
      title: 'Facturación',
      icon: AssessmentIcon,
      link: '/invoices',
      description: 'Facturas y comprobantes',
      roles: ['ADMIN', 'FACTURACION', 'GERENCIA'],
    },
    {
      title: 'Predicciones IA',
      icon: AssessmentIcon,
      link: '/ai-predictions',
      description: 'Análisis predictivo',
      roles: ['ADMIN', 'COMPRAS', 'GERENCIA'],
    },
    {
      title: 'Estadísticas',
      icon: TrendingUpIcon,
      link: '/statistics',
      description: 'Reportes y gráficos',
      roles: ['ADMIN', 'GERENCIA'],
    },
  ];

  const visibleQuickLinks = quickLinks.filter((link) => link.roles.includes(role));

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
          {visibleStatCards.length > 0 && (
          <Box sx={{ 
            mb: 4, 
            maxWidth: 1200, 
            mx: 'auto',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2
          }}>
            {visibleStatCards.map((card, index) => {
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
          )}

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
              {visibleQuickLinks.map((link, index) => {
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

          {/* User Info and Security */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              maxWidth: 1200,
              mx: 'auto'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center', mb: 2 }}>
              Información de Usuario
            </Typography>

            {profileError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setProfileError(null)}>
                {profileError}
              </Alert>
            )}
            {profileSuccess && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setProfileSuccess(null)}>
                {profileSuccess}
              </Alert>
            )}

            {isEditingProfile ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(260px, 1fr))' },
                  gap: 2,
                  maxWidth: 700,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <TextField
                  fullWidth
                  label="Nombre"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                />
                <TextField
                  fullWidth
                  label="Correo"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: { xs: 1.5, md: 2.5 },
                  flexWrap: 'wrap',
                  mb: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  <strong>Nombre:</strong> {user?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Email:</strong> {user?.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Rol:</strong> {user?.role}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Estado:</strong> Activo
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 1 }}>
              {isEditingProfile ? (
                <>
                  <Button
                    variant="contained"
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                  >
                    {profileSaving ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileError(null);
                      setProfileSuccess(null);
                      setPasswordError(null);
                      setPasswordSuccess(null);
                      setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                      setShowPassword({
                        current: false,
                        next: false,
                        confirm: false,
                      });
                      setProfileForm({
                        name: user?.name || '',
                        email: user?.email || '',
                      });
                    }}
                    disabled={profileSaving}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setIsEditingProfile(true);
                    setPasswordError(null);
                    setPasswordSuccess(null);
                  }}
                >
                  Editar perfil
                </Button>
              )}
            </Box>

            {isEditingProfile && (
              <>
                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center', mb: 2 }}>
                  Cambiar contraseña
                </Typography>

                {passwordError && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPasswordError(null)}>
                    {passwordError}
                  </Alert>
                )}
                {passwordSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPasswordSuccess(null)}>
                    {passwordSuccess}
                  </Alert>
                )}

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(200px, 1fr))' },
                    gap: 2,
                    maxWidth: 900,
                    mx: 'auto',
                  }}
                >
                  <TextField
                    fullWidth
                    type={showPassword.current ? 'text' : 'password'}
                    label="Contraseña actual"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))}
                            edge="end"
                            aria-label="Mostrar u ocultar contraseña actual"
                          >
                            {showPassword.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    type={showPassword.next ? 'text' : 'password'}
                    label="Nueva contraseña"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((prev) => ({ ...prev, next: !prev.next }))}
                            edge="end"
                            aria-label="Mostrar u ocultar nueva contraseña"
                          >
                            {showPassword.next ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    type={showPassword.confirm ? 'text' : 'password'}
                    label="Confirmar nueva contraseña"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                            edge="end"
                            aria-label="Mostrar u ocultar confirmación de contraseña"
                          >
                            {showPassword.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSavePassword}
                    disabled={passwordSaving}
                  >
                    {passwordSaving ? 'Actualizando...' : 'Actualizar contraseña'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setPasswordError(null);
                      setPasswordSuccess(null);
                      setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                      setShowPassword({
                        current: false,
                        next: false,
                        confirm: false,
                      });
                    }}
                    disabled={passwordSaving}
                  >
                    Limpiar
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </>
      )}
    </Container>
  );
}
