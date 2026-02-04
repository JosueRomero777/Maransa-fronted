import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Stack,
  Divider,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { apiService } from '../services/api.service';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  role: string;
}

const roles = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'COMPRAS', label: 'Compras' },
  { value: 'LABORATORIO', label: 'Laboratorio' },
  { value: 'LOGISTICA', label: 'Logística' },
  { value: 'CUSTODIA', label: 'Custodia' },
  { value: 'FACTURACION', label: 'Facturación' },
  { value: 'GERENCIA', label: 'Gerencia' },
];

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateUserForm>({
    name: '',
    email: '',
    password: '',
    role: 'COMPRAS',
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: number;
    action: 'activate' | 'deactivate';
    userName: string;
  } | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.get<User[]>('/users');
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      setError(err instanceof Error ? err.message : 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async () => {
    try {
      if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
        setCreateError('Todos los campos son requeridos');
        return;
      }

      if (formData.password.length < 6) {
        setCreateError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      setCreateLoading(true);
      setCreateError(null);

      await apiService.post('/users', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      setFormData({ name: '', email: '', password: '', role: 'COMPRAS' });
      setOpenCreateDialog(false);
      await loadUsers();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear usuario';
      setCreateError(errorMsg);
      console.error('Error creando usuario:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAction = async (userId: number, action: 'activate' | 'deactivate') => {
    try {
      setActionLoading(userId);
      await apiService.patch(`/users/${userId}/${action}`, {});
      await loadUsers(); // Recargar la lista
      setConfirmDialog(null);
    } catch (err) {
      console.error(`Error al ${action} usuario:`, err);
      setError(err instanceof Error ? err.message : `Error al ${action} usuario`);
    } finally {
      setActionLoading(null);
    }
  };

  const openConfirmDialog = (userId: number, action: 'activate' | 'deactivate', userName: string) => {
    setConfirmDialog({ open: true, userId, action, userName });
  };

  const getRoleLabel = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'ADMIN': 'Administrador',
      'COMPRAS': 'Compras',
      'LABORATORIO': 'Laboratorio',
      'LOGISTICA': 'Logística',
      'CUSTODIA': 'Custodia',
      'EMPACADORA': 'Empacadora',
      'GERENCIA': 'Gerencia',
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Gestión de Usuarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setOpenCreateDialog(true)}
          sx={{ borderRadius: 2 }}
        >
          Nuevo Usuario
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Vista Desktop - Tabla */}
      <Paper elevation={2} sx={{ borderRadius: 2, display: { xs: 'none', md: 'block' } }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Rol</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Fecha Registro</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleLabel(user.role)}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.active ? 'Activo' : 'Inactivo'}
                      color={user.active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {user.active ? (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => openConfirmDialog(user.id, 'deactivate', user.name)}
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <CloseIcon fontSize="small" />
                          )}
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => openConfirmDialog(user.id, 'activate', user.name)}
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <CheckIcon fontSize="small" />
                          )}
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {users.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No hay usuarios registrados
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Vista Móvil - Cards */}
      <Stack spacing={2} sx={{ display: { xs: 'block', md: 'none' } }}>
        {users.length === 0 ? (
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No hay usuarios registrados
            </Typography>
          </Paper>
        ) : (
          users.map((user) => (
            <Card key={user.id} elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {user.id}
                    </Typography>
                  </Box>
                  <Chip
                    label={user.active ? 'Activo' : 'Inactivo'}
                    color={user.active ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Stack spacing={1}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body2">
                      {user.email}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Rol
                    </Typography>
                    <Typography variant="body2">
                      {getRoleLabel(user.role)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Fecha de Registro
                    </Typography>
                    <Typography variant="body2">
                      {new Date(user.createdAt).toLocaleDateString('es-ES')}
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  {user.active ? (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={actionLoading === user.id ? <CircularProgress size={16} /> : <CloseIcon />}
                      onClick={() => openConfirmDialog(user.id, 'deactivate', user.name)}
                      disabled={actionLoading === user.id}
                    >
                      Desactivar
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      color="success"
                      size="small"
                      startIcon={actionLoading === user.id ? <CircularProgress size={16} /> : <CheckIcon />}
                      onClick={() => openConfirmDialog(user.id, 'activate', user.name)}
                      disabled={actionLoading === user.id}
                    >
                      Activar
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      {/* Diálogo de confirmación */}
      <Dialog
        open={confirmDialog?.open || false}
        onClose={() => setConfirmDialog(null)}
      >
        <DialogTitle>
          {confirmDialog?.action === 'activate' ? 'Activar Usuario' : 'Desactivar Usuario'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas{' '}
            {confirmDialog?.action === 'activate' ? 'activar' : 'desactivar'} al usuario{' '}
            <strong>{confirmDialog?.userName}</strong>?
          </Typography>
          {confirmDialog?.action === 'deactivate' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Un usuario inactivo no podrá iniciar sesión en el sistema.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (confirmDialog) {
                handleAction(confirmDialog.userId, confirmDialog.action);
              }
            }}
            color={confirmDialog?.action === 'activate' ? 'success' : 'error'}
            variant="contained"
          >
            {confirmDialog?.action === 'activate' ? 'Activar' : 'Desactivar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de crear usuario */}
      <Dialog
        open={openCreateDialog}
        onClose={() => {
          if (!createLoading) {
            setOpenCreateDialog(false);
            setCreateError(null);
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Crear Nuevo Usuario
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nombre"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={createLoading}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={createLoading}
            />
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={createLoading}
              helperText="Mínimo 6 caracteres"
            />
            <FormControl fullWidth disabled={createLoading}>
              <InputLabel>Rol</InputLabel>
              <Select
                value={formData.role}
                label="Rol"
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {roles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)} disabled={createLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreateUser}
            variant="contained"
            disabled={createLoading}
          >
            {createLoading ? <CircularProgress size={20} /> : 'Crear Usuario'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UsersList;
