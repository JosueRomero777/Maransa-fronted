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

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
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
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ borderRadius: 2 }}>
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
    </Container>
  );
};

export default UsersList;