import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { AccountCircle, ExitToApp, Menu as MenuIcon } from '@mui/icons-material';
import { useAuth } from '../context';
import { useDrawer } from '../context/DrawerContext';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = React.memo(() => {
  const { user, logout, isAuthenticated } = useAuth();
  const { setMobileOpen } = useDrawer();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const getRoleDisplayName = (role: string) => {
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

  return (
    <AppBar position="static" sx={{ borderRadius: 0 }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 1,}}>
        {/* Botón de menú para móvil */}
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="abrir menú"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { xs: 'flex', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography 
          variant={isMobile ? "body1" : "h6"} 
          component="div" 
          sx={{ flexGrow: 1, cursor: 'pointer', fontWeight: 600 }}
          onClick={() => navigate('/home')}
        >
          {isMobile ? 'Maransa' : 'Maransa - Sistema de Gestión'}
        </Typography>

        {isAuthenticated && user ? (
          !isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                {user.name} ({getRoleDisplayName(user.role)})
              </Typography>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  <AccountCircle />
                </Avatar>
              </IconButton>
            </Box>
          )
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              color="inherit" 
              onClick={() => navigate('/login')}
              size="small"
            >
              Iniciar Sesión
            </Button>
            <Button 
              color="inherit" 
              onClick={() => navigate('/register')}
              size="small"
            >
              Registrarse
            </Button>
          </Box>
        )}
        
        {/* Desktop Menu */}
        {isAuthenticated && user && !isMobile && (
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="subtitle2">{user.name}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {user.email}
                </Typography>
              </Box>
            </MenuItem>
            
            <Divider />
            
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        )}
      </Toolbar>
    </AppBar>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
