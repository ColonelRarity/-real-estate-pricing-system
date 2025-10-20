import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyAPI } from '../services/api';

const ResultsPage = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [valuation, setValuation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadValuation();
  }, [propertyId]);

  const loadValuation = async () => {
    try {
      setLoading(true);
      const response = await propertyAPI.getValuation(propertyId);
      setValuation(response.data);
    } catch (err) {
      setError('Не вдалося завантажити оцінку');
      console.error('Error loading valuation:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography>Аналізуємо ринок...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !valuation) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Помилка завантаження оцінки'}
          </Alert>
          <Button variant="outlined" onClick={() => navigate('/evaluate')}>
            Спробувати знову
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom textAlign="center">
          Результат оцінки
        </Typography>

        {/* Основна оцінка */}
        <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)', color: 'white' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h4" gutterBottom>
              Оцінка вартості
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
              {valuation.estimated_value?.toLocaleString()} грн
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Діапазон: {valuation.price_range?.min?.toLocaleString()} - {valuation.price_range?.max?.toLocaleString()} грн
            </Typography>
          </CardContent>
        </Card>

        <Grid container spacing={4}>
          {/* Деталі оцінки */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Деталі оцінки
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Впевненість моделі:</strong> {Math.round(valuation.confidence * 100)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={valuation.confidence * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: valuation.confidence > 0.7 ? 'success.main' : valuation.confidence > 0.5 ? 'warning.main' : 'error.main'
                      }
                    }}
                  />
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Фактори, що впливають на ціну:
                </Typography>

                {Object.entries(valuation.factors || {}).map(([factor, value]) => (
                  <Box key={factor} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {factor === 'location' ? 'Локація' :
                         factor === 'area' ? 'Площа' :
                         factor === 'condition' ? 'Стан' :
                         factor === 'building' ? 'Будинок' :
                         factor === 'floor' ? 'Поверх' : factor}
                      </Typography>
                      <Typography variant="body2">{Math.round(value * 100)}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={value * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Бокова панель */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Тренди ринку
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Середня ціна за м²
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {valuation.market_trends?.average_price_per_sqm?.toLocaleString()} грн
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Зміна за місяць
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {valuation.market_trends?.price_change_last_month >= 0 ? (
                      <TrendingUpIcon color="success" />
                    ) : (
                      <TrendingDownIcon color="error" />
                    )}
                    <Typography variant="h6" color={valuation.market_trends?.price_change_last_month >= 0 ? 'success.main' : 'error.main'}>
                      {valuation.market_trends?.price_change_last_month >= 0 ? '+' : ''}
                      {valuation.market_trends?.price_change_last_month}%
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Рівень попиту
                  </Typography>
                  <Chip
                    label={
                      valuation.market_trends?.demand_level === 'high' ? 'Високий' :
                      valuation.market_trends?.demand_level === 'medium' ? 'Середній' : 'Низький'
                    }
                    color={
                      valuation.market_trends?.demand_level === 'high' ? 'success' :
                      valuation.market_trends?.demand_level === 'medium' ? 'warning' : 'error'
                    }
                    sx={{ mt: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Дії */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Дії
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<AssessmentIcon />}
                    onClick={() => navigate('/evaluate')}
                    fullWidth
                  >
                    Нова оцінка
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<ShareIcon />}
                    onClick={() => {
                      navigator.share({
                        title: 'Оцінка нерухомості',
                        text: `Оцінка моєї нерухомості: ${valuation.estimated_value?.toLocaleString()} грн`,
                        url: window.location.href,
                      }).catch(() => {
                        // Fallback для браузерів без Web Share API
                        navigator.clipboard.writeText(window.location.href);
                      });
                    }}
                    fullWidth
                  >
                    Поділитися
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<AssessmentIcon />}
                    onClick={() => navigate(`/map?propertyId=${propertyId}&showSimilar=true`)}
                    fullWidth
                  >
                    Переглянути на карті
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Рекомендації */}
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Рекомендації
            </Typography>

            <Box component="ul" sx={{ pl: 3 }}>
              <li>
                <Typography variant="body1">
                  Для продажу рекомендуємо встановити ціну в межах діапазону оцінки
                </Typography>
              </li>
              <li>
                <Typography variant="body1">
                  Зверніть увагу на сезонність - весна та осінь традиційно кращі для продажу
                </Typography>
              </li>
              <li>
                <Typography variant="body1">
                  Розгляньте можливість косметичного ремонту для збільшення вартості
                </Typography>
              </li>
              <li>
                <Typography variant="body1">
                  Порівняйте з подібними об'єктами в вашому районі для кращого розуміння ринку
                </Typography>
              </li>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default ResultsPage;
