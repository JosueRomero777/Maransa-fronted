import { Container, Typography, Box, Paper, Stack, Button } from '@mui/material';
import { Business as BusinessIcon, Home as HomeIcon } from '@mui/icons-material';
import { useAuth } from '../context';
import { Link } from 'react-router-dom';

export default function Home() {
  const { user } = useAuth();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Bienvenido a Maransa
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Hola, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Sistema de gestión integral para la industria camaronera
        </Typography>
      </Box>

      <Stack spacing={3} sx={{ maxWidth: 600, mx: 'auto' }}>
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <BusinessIcon color="primary" />
            <Typography variant="h6">Módulo de Proveedores</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Gestiona información de proveedores, capacidades, contactos y más.
          </Typography>
          <Button 
            component={Link}
            to="/providers"
            variant="contained"
            size="small"
          >
            Ir a Proveedores
          </Button>
        </Paper>

        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Tu rol:</strong> {user?.role}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Email:</strong> {user?.email}
          </Typography>
        </Paper>
      </Stack>
    </Container>
  )
}
