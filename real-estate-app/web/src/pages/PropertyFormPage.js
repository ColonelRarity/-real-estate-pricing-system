import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  LinearProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { propertyAPI } from '../services/api';
import PhotoUpload from '../components/PhotoUpload';

const PropertyFormPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [formData, setFormData] = useState({
    city: '',
    district: '',
    address: '',
    area: '',
    rooms: '',
    floor: '',
    totalFloors: '',
    buildingType: 'panel',
    condition: 'good',
    hasBalcony: false,
    hasElevator: false,
    heating: 'central',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const response = await propertyAPI.getCities();
      setCities(response.data.cities || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const handleCityChange = async (city) => {
    setFormData(prev => ({ ...prev, city, district: '' }));
    setDistricts([]);

    if (city) {
      try {
        const response = await propertyAPI.getDistricts(city);
        setDistricts(response.data.districts || []);
      } catch (error) {
        console.error('Error loading districts:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Валідація
    const newErrors = {};
    if (!formData.city) newErrors.city = 'Оберіть місто';
    if (!formData.district) newErrors.district = 'Оберіть район';
    if (!formData.address) newErrors.address = 'Введіть адресу';
    if (!formData.area || formData.area <= 0) newErrors.area = 'Введіть площу';
    if (!formData.rooms || formData.rooms < 1) newErrors.rooms = 'Введіть кількість кімнат';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      setLoading(true);
      const response = await propertyAPI.saveProperty(formData);

      // Переходимо до результатів
      navigate(`/results/${response.data.property_id}`);
    } catch (error) {
      console.error('Error saving property:', error);
      setErrors({ submit: 'Помилка при збереженні даних' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));

    // Очищаємо помилку для цього поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom textAlign="center">
          Оцінити нерухомість
        </Typography>

        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Місто */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.city}>
                    <InputLabel>Місто</InputLabel>
                    <Select
                      value={formData.city}
                      label="Місто"
                      onChange={(e) => handleCityChange(e.target.value)}
                    >
                      {cities.map(city => (
                        <MenuItem key={city} value={city}>{city}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Район */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.district} disabled={!formData.city}>
                    <InputLabel>Район</InputLabel>
                    <Select
                      value={formData.district}
                      label="Район"
                      onChange={handleChange('district')}
                    >
                      {districts.map(district => (
                        <MenuItem key={district} value={district}>{district}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Адреса */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Адреса"
                    value={formData.address}
                    onChange={handleChange('address')}
                    error={!!errors.address}
                    helperText={errors.address}
                  />
                </Grid>

                {/* Площа та кімнати */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Площа (м²)"
                    type="number"
                    value={formData.area}
                    onChange={handleChange('area')}
                    error={!!errors.area}
                    helperText={errors.area}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Кількість кімнат"
                    type="number"
                    value={formData.rooms}
                    onChange={handleChange('rooms')}
                    error={!!errors.rooms}
                    helperText={errors.rooms}
                  />
                </Grid>

                {/* Поверхи */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Поверх"
                    type="number"
                    value={formData.floor}
                    onChange={handleChange('floor')}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Загалом поверхів"
                    type="number"
                    value={formData.totalFloors}
                    onChange={handleChange('totalFloors')}
                  />
                </Grid>

                {/* Тип будинку */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Тип будинку</InputLabel>
                    <Select
                      value={formData.buildingType}
                      label="Тип будинку"
                      onChange={handleChange('buildingType')}
                    >
                      <MenuItem value="brick">Цегла</MenuItem>
                      <MenuItem value="panel">Панель</MenuItem>
                      <MenuItem value="monolithic">Моноліт</MenuItem>
                      <MenuItem value="wood">Дерево</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Стан */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Стан квартири</InputLabel>
                    <Select
                      value={formData.condition}
                      label="Стан квартири"
                      onChange={handleChange('condition')}
                    >
                      <MenuItem value="excellent">Відмінний</MenuItem>
                      <MenuItem value="good">Добрий</MenuItem>
                      <MenuItem value="fair">Задовільний</MenuItem>
                      <MenuItem value="poor">Поганий</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Додаткові опції */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.hasBalcony}
                          onChange={(e) => setFormData(prev => ({ ...prev, hasBalcony: e.target.checked }))}
                        />
                      }
                      label="Балкон"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.hasElevator}
                          onChange={(e) => setFormData(prev => ({ ...prev, hasElevator: e.target.checked }))}
                        />
                      }
                      label="Ліфт"
                    />
                  </Box>
                </Grid>

                {/* Помилки */}
                {errors.submit && (
                  <Grid item xs={12}>
                    <Alert severity="error">{errors.submit}</Alert>
                  </Grid>
                )}

                {/* Кнопки */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{ px: 4 }}
                    >
                      {loading ? <LinearProgress sx={{ width: 100 }} /> : 'Оцінити вартість'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/')}
                      sx={{ px: 4 }}
                    >
                      Скасувати
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default PropertyFormPage;
