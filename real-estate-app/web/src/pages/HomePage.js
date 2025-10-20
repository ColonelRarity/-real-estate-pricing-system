import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Map as MapIcon,
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  DataUsage as DataIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { propertyAPI } from '../services/api';
import useOfflineData from '../hooks/useOfflineData';

const HomePage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    offlineData,
    isOnline,
    isDataFresh,
    updateOfflineData,
    forceUpdate,
  } = useOfflineData();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Спочатку перевіряємо чи є свіжі оффлайн дані
      if (offlineData.marketStats['Харків'] && isDataFresh) {
        setStats(offlineData.marketStats['Харків']);
        console.log('📦 Використано оффлайн дані для статистики');
        return;
      }

      // Якщо немає свіжих даних або онлайн, завантажуємо з сервера
      if (isOnline) {
        const response = await propertyAPI.getMarketStats('Харків');
        setStats(response.data);
        console.log('🌐 Завантажено статистику з сервера');
      } else {
        // Якщо оффлайн і дані застарілі, показуємо повідомлення
        if (offlineData.marketStats['Харків']) {
          setStats(offlineData.marketStats['Харків']);
          setError('Дані можуть бути застарілими (оффлайн режим)');
        } else {
          setError('Немає доступних даних в оффлайн режимі');
        }
      }
    } catch (err) {
      console.error('Error loading stats:', err);

      // Fallback на оффлайн дані
      if (offlineData.marketStats['Харків']) {
        setStats(offlineData.marketStats['Харків']);
        setError('Використано застарілі дані (оффлайн режим)');
      } else {
        setError('Не вдалося завантажити статистику');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <PsychologyIcon fontSize="large" color="primary" />,
      title: 'Штучний інтелект',
      description: 'Використовуємо машинне навчання для точної оцінки вартості нерухомості',
    },
    {
      icon: <DataIcon fontSize="large" color="primary" />,
      title: '4 джерела даних',
      description: 'Аналізуємо оголошення з OLX, Dom.Ria, Realt.ua та Address.ua',
    },
    {
      icon: <MapIcon fontSize="large" color="primary" />,
      title: 'Геолокація',
      description: 'Відображаємо об\'єкти на інтерактивній карті з точними координатами',
    },
    {
      icon: <SpeedIcon fontSize="large" color="primary" />,
      title: 'Швидка оцінка',
      description: 'Отримуйте оцінку вартості за лічені секунди',
    },
  ];

  const steps = [
    {
      step: '1',
      title: 'Введіть дані',
      description: 'Вкажіть характеристики вашої нерухомості',
    },
    {
      step: '2',
      title: 'AI аналіз',
      description: 'Наша система проаналізує ринок та подібні об\'єкти',
    },
    {
      step: '3',
      title: 'Отримайте оцінку',
      description: 'Миттєва оцінка з детальним звітом',
    },
  ];

  return (
    <Container maxWidth="lg">
      {/* Hero секція */}
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h1" gutterBottom>
          Оцінка нерухомості України
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          Точна оцінка вартості нерухомості з використанням штучного інтелекту та аналізу даних з 4 джерел
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
          <Button
            variant="contained"
            size="large"
            component={Link}
            to="/evaluate"
            startIcon={<AssessmentIcon />}
            sx={{ px: 4, py: 1.5 }}
          >
            Оцінити нерухомість
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={Link}
            to="/map"
            startIcon={<MapIcon />}
            sx={{ px: 4, py: 1.5 }}
          >
            Переглянути карту
          </Button>
        </Box>

        {/* Статистика */}
        {loading ? (
          <LinearProgress sx={{ maxWidth: 400, mx: 'auto' }} />
        ) : error ? (
          <Alert
            severity={isOnline ? "error" : "warning"}
            sx={{ maxWidth: 400, mx: 'auto' }}
            action={isOnline ? (
              <Button color="inherit" size="small" onClick={forceUpdate}>
                Оновити
              </Button>
            ) : null}
          >
            {error}
          </Alert>
        ) : stats && (
          <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip
              label={`Середня ціна: ${stats.current_avg_price?.toLocaleString()} грн/м²`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`Оголошень: ${stats.total_listings || 0}`}
              color="secondary"
              variant="outlined"
            />
            <Chip
              label={`Рівень попиту: ${stats.demand_level === 'high' ? 'Високий' : stats.demand_level === 'medium' ? 'Середній' : 'Низький'}`}
              color="success"
              variant="outlined"
            />
          </Box>
        )}
      </Box>

      {/* Особливості */}
      <Box sx={{ py: 6 }}>
        <Typography variant="h2" gutterBottom textAlign="center">
          Чому обирають нас?
        </Typography>

        <Grid container spacing={4} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 3 }}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Як це працює */}
      <Box sx={{ py: 6, backgroundColor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="h2" gutterBottom textAlign="center">
          Як це працює?
        </Typography>

        <Grid container spacing={4} sx={{ mt: 2 }}>
          {steps.map((step, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <Typography variant="h3" color="primary" gutterBottom>
                  {step.step}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Статистика районів */}
      {stats && stats.top_districts && (
        <Box sx={{ py: 6 }}>
          <Typography variant="h2" gutterBottom textAlign="center">
            Ціни по районах Харкова
          </Typography>

          <Grid container spacing={2}>
            {stats.top_districts.slice(0, 6).map((district, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {district.district}
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {district.avg_price_per_sqm?.toLocaleString()} грн/м²
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* CTA секція */}
      <Box sx={{ py: 6, textAlign: 'center', backgroundColor: 'primary.main', color: 'primary.contrastText', borderRadius: 2 }}>
        <Typography variant="h3" gutterBottom>
          Готові оцінити вашу нерухомість?
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
          Отримайте точну оцінку за лічені секунди
        </Typography>
        <Button
          variant="contained"
          size="large"
          component={Link}
          to="/evaluate"
          sx={{
            bgcolor: 'secondary.main',
            color: 'secondary.contrastText',
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            '&:hover': {
              bgcolor: 'secondary.dark',
            },
          }}
        >
          Почати оцінку
        </Button>
      </Box>
    </Container>
  );
};

export default HomePage;
