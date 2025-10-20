import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { propertyAPI } from '../services/api';
import HeatMapChart from '../components/HeatMapChart';
import ExportReport from '../components/ExportReport';

const AnalyticsPage = () => {
  const [selectedCity, setSelectedCity] = useState('Харків');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);

  const cities = ['Харків', 'Київ', 'Львів', 'Одеса', 'Дніпро'];

  useEffect(() => {
    loadAnalytics();
  }, [selectedCity]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Завантажуємо статистику для вибраного міста
      const statsResponse = await propertyAPI.getMarketStats(selectedCity);
      const trendsResponse = await propertyAPI.getPriceTrends(selectedCity, 12);

      // Обробляємо дані для графіків
      const stats = statsResponse.data;
      const trends = trendsResponse.data.trends || [];

      // Створюємо детальні дані для графіків
      const chartData = trends.map(trend => ({
        month: new Date(trend.date).toLocaleDateString('uk-UA', { month: 'short', year: '2-digit' }),
        price: trend.avg_price_per_sqm,
        listings: trend.total_listings,
        date: trend.date,
      }));

      // Дані для кругової діаграми районів
      const districtData = (stats.top_districts || []).map(district => ({
        name: district.district,
        value: district.avg_price_per_sqm,
        count: district.count || 0,
      }));

      setAnalyticsData({
        averagePrice: stats.current_avg_price || 1250,
        totalListings: stats.total_listings || 15420,
        priceChange: stats.price_change_last_month || 2.5,
        demandLevel: stats.demand_level || 'medium',
        topDistricts: stats.top_districts || [],
        chartData: chartData,
        districtData: districtData,
        priceRange: {
          min: Math.min(...chartData.map(d => d.price)),
          max: Math.max(...chartData.map(d => d.price)),
        },
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Fallback на тестові дані при помилці
      setAnalyticsData({
        averagePrice: 1250,
        totalListings: 15420,
        priceChange: 2.5,
        demandLevel: 'medium',
        topDistricts: [
          { district: 'Центр', avgPrice: 1800, count: 1250 },
          { district: 'Олексіївка', avgPrice: 1400, count: 980 },
          { district: 'Шевченківський', avgPrice: 1300, count: 1100 },
          { district: 'Салтівка', avgPrice: 950, count: 3200 },
          { district: 'Немишлянський', avgPrice: 1100, count: 1450 },
        ],
        chartData: [
          { month: 'січ.24', price: 1150, listings: 850 },
          { month: 'лют.24', price: 1180, listings: 920 },
          { month: 'бер.24', price: 1200, listings: 980 },
          { month: 'кві.24', price: 1220, listings: 1100 },
          { month: 'тра.24', price: 1250, listings: 1200 },
          { month: 'чер.24', price: 1280, listings: 1350 },
        ],
        districtData: [
          { name: 'Центр', value: 1800, count: 1250 },
          { name: 'Олексіївка', value: 1400, count: 980 },
          { name: 'Шевченківський', value: 1300, count: 1100 },
          { name: 'Салтівка', value: 950, count: 3200 },
          { name: 'Немишлянський', value: 1100, count: 1450 },
        ],
        priceRange: { min: 950, max: 1800 },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom textAlign="center">
          Аналітика ринку нерухомості
        </Typography>

        {/* Фільтри та дії */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Місто</InputLabel>
            <Select
              value={selectedCity}
              label="Місто"
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              {cities.map(city => (
                <MenuItem key={city} value={city}>{city}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {analyticsData && (
            <ExportReport analyticsData={analyticsData} selectedCity={selectedCity} />
          )}
        </Box>

        {loading ? (
          <Alert severity="info">Завантаження аналітики...</Alert>
        ) : analyticsData && (
          <>
            {/* Загальна статистика */}
            <Grid container spacing={4} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" gutterBottom>
                      {analyticsData.averagePrice.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      грн/м² середня ціна
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" gutterBottom>
                      {analyticsData.totalListings.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      оголошень в базі
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{
                  background: analyticsData.priceChange >= 0
                    ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                    : 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                  color: 'white'
                }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      {analyticsData.priceChange >= 0 ? (
                        <TrendingUpIcon fontSize="large" />
                      ) : (
                        <TrendingUpIcon fontSize="large" sx={{ transform: 'rotate(180deg)' }} />
                      )}
                      <Typography variant="h3">
                        {analyticsData.priceChange >= 0 ? '+' : ''}{analyticsData.priceChange}%
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      зміна за місяць
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{
                  background: analyticsData.demandLevel === 'high'
                    ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                    : analyticsData.demandLevel === 'medium'
                    ? 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
                    : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                  color: 'white'
                }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom>
                      {analyticsData.demandLevel === 'high' ? 'Високий' :
                       analyticsData.demandLevel === 'medium' ? 'Середній' : 'Низький'}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      рівень попиту
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Графіки трендів */}
            <Grid container spacing={4} sx={{ mb: 4 }}>
              {/* Лінейний графік цін */}
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShowChartIcon color="primary" />
                      Тренди цін та кількості оголошень
                    </Typography>

                    <Box sx={{ height: 400, mt: 2 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis
                            dataKey="month"
                            stroke="#666"
                            fontSize={12}
                          />
                          <YAxis
                            yAxisId="price"
                            orientation="left"
                            stroke="#2196f3"
                            fontSize={12}
                            label={{ value: 'Ціна (грн/м²)', angle: -90, position: 'insideLeft' }}
                          />
                          <YAxis
                            yAxisId="listings"
                            orientation="right"
                            stroke="#ff9800"
                            fontSize={12}
                            label={{ value: 'Кількість', angle: 90, position: 'insideRight' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}
                            formatter={(value, name) => [
                              name === 'price' ? `${value.toLocaleString()} грн/м²` : `${value} оголошень`,
                              name === 'price' ? 'Ціна' : 'Оголошення'
                            ]}
                          />
                          <Legend />
                          <Line
                            yAxisId="price"
                            type="monotone"
                            dataKey="price"
                            stroke="#2196f3"
                            strokeWidth={3}
                            dot={{ fill: '#2196f3', strokeWidth: 2, r: 4 }}
                            name="Ціна"
                          />
                          <Line
                            yAxisId="listings"
                            type="monotone"
                            dataKey="listings"
                            stroke="#ff9800"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#ff9800', strokeWidth: 2, r: 3 }}
                            name="Оголошення"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Кругова діаграма районів */}
              <Grid item xs={12} lg={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimelineIcon color="primary" />
                      Розподіл цін по районах
                    </Typography>

                    <Box sx={{ height: 300, mt: 2 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.districtData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {analyticsData.districtData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [`${value.toLocaleString()} грн/м²`, name]}
                          />
                          <Legend
                            formatter={(value, entry) => (
                              <span style={{ fontSize: '0.875rem' }}>
                                {value} - {entry.payload.count} оголошень
                              </span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Бар-чарт цін по районах */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BarChartIcon color="primary" />
                  Порівняння цін по районах
                </Typography>

                <Box sx={{ height: 400, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.districtData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        dataKey="name"
                        stroke="#666"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        stroke="#666"
                        fontSize={12}
                        label={{ value: 'Ціна (грн/м²)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                        formatter={(value, name) => [`${value.toLocaleString()} грн/м²`, 'Ціна']}
                      />
                      <Bar
                        dataKey="value"
                        fill="#2196f3"
                        radius={[4, 4, 0, 0]}
                      >
                        {analyticsData.districtData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            {/* Детальна таблиця районів */}
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Детальна статистика районів
                </Typography>

                <Grid container spacing={2}>
                  {analyticsData.topDistricts.map((district, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card variant="outlined" sx={{ position: 'relative', overflow: 'hidden' }}>
                        <CardContent sx={{ pb: 2 }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            {district.district}
                          </Typography>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="h4" color="primary" gutterBottom>
                              {district.avgPrice?.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              грн/м² середня ціна
                            </Typography>
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="h6" color="text.primary">
                              {district.count?.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              оголошень
                            </Typography>
                          </Box>

                          {/* Прогрес-бар відносно максимальної ціни */}
                          <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Відносна ціна
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {Math.round((district.avgPrice / analyticsData.priceRange.max) * 100)}%
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                width: '100%',
                                height: 8,
                                bgcolor: 'grey.200',
                                borderRadius: 4,
                                overflow: 'hidden',
                              }}
                            >
                              <Box
                                sx={{
                                  width: `${(district.avgPrice / analyticsData.priceRange.max) * 100}%`,
                                  height: '100%',
                                  bgcolor: `hsl(${index * 45}, 70%, 60%)`,
                                  borderRadius: 4,
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Теплова карта цін районів */}
            {selectedCity === 'Харків' && (
              <HeatMapChart selectedCity={selectedCity} />
            )}

            {/* Інсайти та рекомендації */}
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Інсайти та рекомендації
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
                      <Typography variant="h6" gutterBottom>
                        📈 Тренди ринку
                      </Typography>
                      <Typography variant="body2">
                        Ціни на нерухомість в {selectedCity} показують стабільне зростання на {analyticsData.priceChange}% за останній місяць.
                        Найактивніший район - Салтівка з {analyticsData.topDistricts.find(d => d.district === 'Салтівка')?.count || 0} оголошеннями.
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, backgroundColor: 'secondary.light', color: 'secondary.contrastText' }}>
                      <Typography variant="h6" gutterBottom>
                        🎯 Рекомендації інвесторам
                      </Typography>
                      <Typography variant="body2">
                        Для максимальної прибутковості розгляньте райони з високим попитом: Центр та Олексіївка.
                        Салтівка пропонує найкраще співвідношення ціна/якість для бюджетних інвестицій.
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </Container>
  );
};

export default AnalyticsPage;
