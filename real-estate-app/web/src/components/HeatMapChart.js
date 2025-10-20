import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
} from '@mui/material';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Tooltip,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Дані районів Харкова з координатами та цінами
const KHARKIV_DISTRICTS = {
  'Центр': {
    coordinates: [
      [49.9935, 36.2304], // Центр Харкова
      [50.0050, 36.2250], // Шевченківський
      [49.9845, 36.2428], // Основ'янський
    ],
    avgPrice: 1400,
    color: '#ff4444',
  },
  'Олексіївка': {
    coordinates: [
      [50.0450, 36.2850],
      [50.0350, 36.2950],
      [50.0250, 36.2750],
    ],
    avgPrice: 1300,
    color: '#ff8844',
  },
  'Шевченківський': {
    coordinates: [
      [50.0050, 36.2250],
      [49.9950, 36.2150],
      [49.9850, 36.2350],
    ],
    avgPrice: 1250,
    color: '#ffaa44',
  },
  'Немишлянський': {
    coordinates: [
      [49.9650, 36.2950],
      [49.9550, 36.2850],
      [49.9450, 36.3050],
    ],
    avgPrice: 1050,
    color: '#ffcc44',
  },
  'Салтівка': {
    coordinates: [
      [50.0350, 36.3000],
      [50.0250, 36.3100],
      [50.0150, 36.2900],
    ],
    avgPrice: 850,
    color: '#44ff44',
  },
  'Індустріальний': {
    coordinates: [
      [49.9500, 36.3100],
      [49.9400, 36.3000],
      [49.9300, 36.3200],
    ],
    avgPrice: 950,
    color: '#44ffaa',
  },
};

const HeatMapChart = ({ selectedCity = 'Харків' }) => {
  const [opacity, setOpacity] = useState(0.6);

  // Функція для визначення кольору на основі ціни
  const getColorByPrice = (price) => {
    if (price >= 1300) return '#ff4444'; // Червоний - дорого
    if (price >= 1100) return '#ff8844'; // Помаранчевий
    if (price >= 1000) return '#ffaa44'; // Жовто-помаранчевий
    if (price >= 900) return '#ffcc44';  // Жовтий
    if (price >= 800) return '#44ff44';  // Зелений
    return '#44ffaa'; // Бірюзовий - дешево
  };

  // Функція для визначення інтенсивності кольору
  const getOpacityByPrice = (price) => {
    const maxPrice = Math.max(...Object.values(KHARKIV_DISTRICTS).map(d => d.avgPrice));
    const minPrice = Math.min(...Object.values(KHARKIV_DISTRICTS).map(d => d.avgPrice));
    return 0.3 + ((price - minPrice) / (maxPrice - minPrice)) * 0.7;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          🗺️ Теплова карта цін районів
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Інтерактивна карта районів Харкова з візуалізацією цін на нерухомість
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="body2">Прозорість:</Typography>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              style={{ width: '100px' }}
            />
            <Typography variant="body2">{Math.round(opacity * 100)}%</Typography>
          </Box>
        </Box>

        <Box sx={{ height: 500, width: '100%' }}>
          <MapContainer
            center={[49.9935, 36.2304]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {Object.entries(KHARKIV_DISTRICTS).map(([districtName, districtData]) => (
              <Polygon
                key={districtName}
                positions={districtData.coordinates}
                pathOptions={{
                  fillColor: getColorByPrice(districtData.avgPrice),
                  fillOpacity: opacity,
                  color: getColorByPrice(districtData.avgPrice),
                  weight: 2,
                  opacity: 0.8,
                }}
              >
                <Tooltip>
                  <div>
                    <Typography variant="h6">{districtName}</Typography>
                    <Typography>Середня ціна: {districtData.avgPrice.toLocaleString()} грн/м²</Typography>
                  </div>
                </Tooltip>
              </Polygon>
            ))}
          </MapContainer>
        </Box>

        {/* Легенда */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Легенда цін:
          </Typography>

          <Grid container spacing={1}>
            {[
              { range: '1300+', color: '#ff4444', label: 'Дуже дорого' },
              { range: '1100-1300', color: '#ff8844', label: 'Дорого' },
              { range: '1000-1100', color: '#ffaa44', label: 'Вище середнього' },
              { range: '900-1000', color: '#ffcc44', label: 'Середнє' },
              { range: '800-900', color: '#44ff44', label: 'Нижче середнього' },
              { range: '<800', color: '#44ffaa', label: 'Дешево' },
            ].map((item, index) => (
              <Grid item xs={6} sm={4} key={index}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: item.color,
                      borderRadius: '50%',
                      mx: 'auto',
                      mb: 1,
                    }}
                  />
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {item.range} грн/м²
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default HeatMapChart;
