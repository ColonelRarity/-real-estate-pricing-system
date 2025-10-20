import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Grid,
  IconButton,
  Divider,
} from '@mui/material';
import {
  GitHub as GitHubIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        mt: 'auto',
        backgroundColor: 'grey.100',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Про додаток */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Оцінка нерухомості України
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Точна оцінка вартості нерухомості з використанням штучного інтелекту.
              Дані з 4 джерел, геолокація та порівняння з аналогічними об'єктами.
            </Typography>
          </Grid>

          {/* Посилання */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Посилання
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/" color="text.secondary" underline="hover">
                Головна
              </Link>
              <Link href="/evaluate" color="text.secondary" underline="hover">
                Оцінити нерухомість
              </Link>
              <Link href="/map" color="text.secondary" underline="hover">
                Карта об'єктів
              </Link>
              <Link href="/analytics" color="text.secondary" underline="hover">
                Аналітика
              </Link>
              <Link href="/about" color="text.secondary" underline="hover">
                Про нас
              </Link>
            </Box>
          </Grid>

          {/* Контакти */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Контакти
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon fontSize="small" color="primary" />
                <Typography variant="body2">
                  support@real-estate-app.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon fontSize="small" color="primary" />
                <Typography variant="body2">
                  +38 (050) 123-45-67
                </Typography>
              </Box>
            </Box>

            {/* Соцмережі */}
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <IconButton
                size="small"
                color="primary"
                component="a"
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Авторські права */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {currentYear} Оцінка нерухомості України. Всі права захищені.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Версія 1.0.0
          </Typography>
        </Box>

        {/* Технічна інформація */}
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            🚀 Працює на React + Material-UI
          </Typography>
          <Typography variant="caption" color="text.secondary">
            🤖 AI оцінка з машинним навчанням
          </Typography>
          <Typography variant="caption" color="text.secondary">
            📊 Дані з OLX, Dom.Ria, Realt.ua, Address.ua
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
