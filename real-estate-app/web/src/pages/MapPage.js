import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Map as MapIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  // Центр Харкова за замовчуванням
  const defaultCenter = [49.9935, 36.2304];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      // Тут буде запит до API для пошуку об'єктів
      // const response = await propertyAPI.searchProperties(searchQuery);
      // setProperties(response.data.properties || []);

      // Тимчасові тестові дані
      setProperties([
        {
          id: '1',
          address: 'вул. Сумська 25',
          price: 2500000,
          area: 60,
          latitude: 49.9935,
          longitude: 36.2304,
        },
        {
          id: '2',
          address: 'вул. Пушкінська 10',
          price: 1800000,
          area: 45,
          latitude: 49.9950,
          longitude: 36.2350,
        },
      ]);
    } catch (error) {
      console.error('Error searching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom textAlign="center">
          Карта нерухомості
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 4, justifyContent: 'center' }}>
          <TextField
            placeholder="Шукати за адресою..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 300 }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Шукати'}
          </Button>
        </Box>

        <Card sx={{ height: 600 }}>
          <CardContent sx={{ p: 0, height: '100%' }}>
            <MapContainer
              center={defaultCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {properties.map((property) => (
                <Marker
                  key={property.id}
                  position={[property.latitude, property.longitude]}
                >
                  <Popup>
                    <Typography variant="h6">{property.address}</Typography>
                    <Typography>Ціна: {property.price.toLocaleString()} грн</Typography>
                    <Typography>Площа: {property.area} м²</Typography>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </CardContent>
        </Card>

        {properties.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Знайдені об'єкти ({properties.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {properties.map((property) => (
                <Card key={property.id} sx={{ minWidth: 250 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {property.address}
                    </Typography>
                    <Typography color="primary" variant="h5">
                      {property.price.toLocaleString()} грн
                    </Typography>
                    <Typography variant="body2">
                      Площа: {property.area} м²
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default MapPage;
