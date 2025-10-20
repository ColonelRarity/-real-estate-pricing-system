import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Analytics as AnalyticsIcon,
  Map as MapIcon,
  Info as InfoIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import OfflineIndicator from './OfflineIndicator';
import NotificationManager from './NotificationManager';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    { text: 'Головна', icon: <HomeIcon />, path: '/' },
    { text: 'Оцінити', icon: <AssessmentIcon />, path: '/evaluate' },
    { text: 'Карта', icon: <MapIcon />, path: '/map' },
    { text: 'Аналітика', icon: <AnalyticsIcon />, path: '/analytics' },
    { text: 'Про нас', icon: <InfoIcon />, path: '/about' },
  ];

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const isActive = (path) => location.pathname === path;

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Typography variant="h6" sx={{ p: 2, fontWeight: 'bold', color: 'primary.main' }}>
        Оцінка нерухомості
      </Typography>
      <Box sx={{ px: 2, mb: 2 }}>
        <OfflineIndicator />
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ px: 2 }}>
        <NotificationManager />
      </Box>
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isActive(item.path)}
              onClick={() => setDrawerOpen(false)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                  '& .MuiListItemText-primary': {
                    color: 'primary.contrastText',
                    fontWeight: 'bold',
                  },
                },
              }}
            >
              <Box sx={{ mr: 2, color: isActive(item.path) ? 'primary.contrastText' : 'primary.main' }}>
                {item.icon}
              </Box>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" elevation={2}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            🏠 Оцінка нерухомості України
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <OfflineIndicator />
              <NotificationManager />
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  variant={isActive(item.path) ? 'contained' : 'text'}
                  color={isActive(item.path) ? 'secondary' : 'inherit'}
                  startIcon={item.icon}
                  sx={{
                    borderRadius: 2,
                    fontWeight: isActive(item.path) ? 'bold' : 'normal',
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Мобільне меню */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Header;
