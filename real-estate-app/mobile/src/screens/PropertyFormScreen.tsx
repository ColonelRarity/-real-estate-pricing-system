import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  RadioButton,
  Switch,
  Chip,
  HelperText,
  ActivityIndicator,
  Snackbar,
  Portal,
  Modal,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { PropertyService, PropertyData } from '../services/PropertyService';
import GeocodingService from '../services/GeocodingService';
import {
  KHARKIV_CITY,
  getAllDistricts,
  getDistrictsForKharkiv,
  getKharkivCoordinates,
  getDistrictCoordinates,
  City,
  District
} from '../types/location';
import MapView, { Marker, PROVIDER_OPENSTREETMAP } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, request } from 'react-native-permissions';

type PropertyFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PropertyForm'>;
type PropertyFormScreenRouteProp = RouteProp<RootStackParamList, 'PropertyForm'>;

interface Props {
  navigation: PropertyFormScreenNavigationProp;
  route: PropertyFormScreenRouteProp;
}

// Використовуємо типізовані дані з LUN класифікацією
const CITIES = ['Харків']; // Фокус на одному місті для MVP

const BUILDING_TYPES = [
  { label: 'Цегла', value: 'brick' },
  { label: 'Панель', value: 'panel' },
  { label: 'Моноліт', value: 'monolithic' },
  { label: 'Дерево', value: 'wood' },
];

const CONDITIONS = [
  { label: 'Відмінний', value: 'excellent' },
  { label: 'Добрий', value: 'good' },
  { label: 'Задовільний', value: 'fair' },
  { label: 'Поганий', value: 'poor' },
];

const PropertyFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const { editMode, propertyId } = route.params || {};

  const [loading, setLoading] = useState(editMode || false);
  const [saving, setSaving] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Стан для карти
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapLoading, setMapLoading] = useState(false);

  const [formData, setFormData] = useState<PropertyData>({
    city: '',
    district: '',
    address: '',
    fullAddress: '',
    area: 0,
    rooms: 1,
    floor: 1,
    totalFloors: 5,
    buildingType: 'brick',
    condition: 'good',
    hasBalcony: false,
    hasElevator: false,
    heating: 'central',
    description: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (editMode && propertyId) {
      loadProperty();
    }
  }, [editMode, propertyId]);

  const loadProperty = async () => {
    if (!propertyId) return;

    try {
      setLoading(true);
      const property = await PropertyService.getProperty(propertyId);
      if (property) {
        setFormData(property);
      }
    } catch (error) {
      console.error('Error loading property:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити дані про нерухомість');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.city) newErrors.city = 'Оберіть місто';
    if (!formData.district) newErrors.district = 'Оберіть район';
    if (!formData.address.trim()) newErrors.address = 'Введіть адресу';
    if (formData.area <= 0) newErrors.area = 'Введіть площу';
    if (formData.rooms < 1) newErrors.rooms = 'Введіть кількість кімнат';
    if (formData.floor < 1) newErrors.floor = 'Введіть поверх';
    if (formData.totalFloors < formData.floor) newErrors.totalFloors = 'Загальна кількість поверхів не може бути меншою за поверх';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setSnackbarMessage('Будь ласка, заповніть усі обов\'язкові поля');
      setSnackbarVisible(true);
      return;
    }

    try {
      setSaving(true);
      const id = await PropertyService.saveProperty(formData);

      setSnackbarMessage('Дані збережено успішно!');
      setSnackbarVisible(true);

      // Переходимо до результатів оцінки
      setTimeout(() => {
        navigation.navigate('Results', { propertyId: id });
      }, 1000);

    } catch (error) {
      console.error('Error saving property:', error);
      setSnackbarMessage('Помилка при збереженні даних');
      setSnackbarVisible(true);
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field: keyof PropertyData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Очищаємо помилку для цього поля при редагуванні
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getAvailableDistricts = () => {
    return getDistrictsForKharkiv();
  };

  // Функції для геолокації
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Доступ до геолокації',
            message: 'Додаток потребує доступ до вашої геолокації для кращої оцінки нерухомості',
            buttonNeutral: 'Запитати пізніше',
            buttonNegative: 'Скасувати',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const result = await request('ios.permission.LOCATION_WHEN_IN_USE');
        return result === 'granted';
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      setMapLoading(true);
      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        setSnackbarMessage('Доступ до геолокації заборонений');
        setSnackbarVisible(true);
        return;
      }

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          setSelectedLocation({ latitude, longitude });
          setShowMap(true);
          setMapLoading(false);
        },
        (error) => {
          console.error('Error getting current location:', error);
          setSnackbarMessage('Не вдалося отримати поточну локацію');
          setSnackbarVisible(true);
          setMapLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    } catch (error) {
      console.error('Error in getCurrentLocation:', error);
      setMapLoading(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });

    // Можна додати зворотне геокодування для отримання адреси
    // Але для простоти поки що просто встановлюємо координати
  };

  const confirmLocation = async () => {
    if (selectedLocation) {
      try {
        setMapLoading(true);

        // Отримуємо адресу з координат
        const address = await GeocodingService.reverseGeocode(
          selectedLocation.latitude,
          selectedLocation.longitude
        );

        // Автоматично визначаємо місто та район на основі координат
        const nearestCity = findNearestCity(selectedLocation.latitude, selectedLocation.longitude);

        if (nearestCity) {
          setFormData(prev => ({
            ...prev,
            city: nearestCity.name,
            district: '', // Можна додати логіку для визначення району
            address: address || '',
            fullAddress: address || '',
            coordinates: {
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            },
          }));

          setSnackbarMessage(`Обрано локацію: ${address || 'невідома адреса'}`);
          setSnackbarVisible(true);
        }
      } catch (error) {
        console.error('Error confirming location:', error);
        setSnackbarMessage('Помилка при визначенні адреси');
        setSnackbarVisible(true);
      } finally {
        setMapLoading(false);
        setShowMap(false);
      }
    }
  };

  const findNearestCity = (latitude: number, longitude: number) => {
    // Для MVP фокусуємося тільки на Харкові
    const distance = getDistanceFromLatLonInKm(
      latitude,
      longitude,
      KHARKIV_CITY.coordinates.latitude,
      KHARKIV_CITY.coordinates.longitude
    );

    // Повертаємо Харків, якщо користувач в межах 100 км від центру
    return distance < 100 ? KHARKIV_CITY : null;
  };

  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Радіус Землі в км
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Основна інформація</Title>

            {/* Місто */}
            <View style={styles.section}>
              <Paragraph style={styles.label}>Місто *</Paragraph>
              <View style={styles.chipsContainer}>
                {CITIES.map((city) => (
                  <Chip
                    key={city}
                    selected={formData.city === city}
                    onPress={() => {
                      updateFormData('city', city);
                      updateFormData('district', ''); // Скидаємо район при зміні міста
                    }}
                    style={styles.cityChip}
                  >
                    {city}
                  </Chip>
                ))}
              </View>
              <HelperText type="error" visible={!!errors.city}>
                {errors.city}
              </HelperText>
            </View>

            {/* Район */}
            {formData.city && (
              <View style={styles.section}>
                <Paragraph style={styles.label}>Район *</Paragraph>
                <View style={styles.chipsContainer}>
                  {getAvailableDistricts().map((district) => (
                    <Chip
                      key={district}
                      selected={formData.district === district}
                      onPress={() => updateFormData('district', district)}
                      style={styles.districtChip}
                    >
                      {district}
                    </Chip>
                  ))}
                </View>
                <HelperText type="error" visible={!!errors.district}>
                  {errors.district}
                </HelperText>
              </View>
            )}

            {/* Повна адреса */}
            <View style={styles.section}>
              <TextInput
                label="Повна адреса (вул. Сумська 25, кв. 10)"
                value={formData.fullAddress}
                onChangeText={(text) => updateFormData('fullAddress', text)}
                mode="outlined"
                placeholder="Введіть повну адресу для точного геопозиціонування"
              />
            </View>

            {/* Адреса та карта */}
            <View style={styles.section}>
              <View style={styles.addressContainer}>
                <TextInput
                  label="Адреса *"
                  value={formData.address}
                  onChangeText={(text) => updateFormData('address', text)}
                  mode="outlined"
                  error={!!errors.address}
                  style={styles.addressInput}
                />
                <Button
                  mode="outlined"
                  onPress={getCurrentLocation}
                  loading={mapLoading}
                  disabled={mapLoading}
                  style={styles.mapButton}
                  icon="map"
                >
                  Карта
                </Button>
              </View>
              <HelperText type="error" visible={!!errors.address}>
                {errors.address}
              </HelperText>
            </View>

            {/* Площа та кімнати */}
            <View style={styles.row}>
              <View style={styles.halfSection}>
                <TextInput
                  label="Площа (м²) *"
                  value={formData.area.toString()}
                  onChangeText={(text) => updateFormData('area', parseFloat(text) || 0)}
                  mode="outlined"
                  keyboardType="numeric"
                  error={!!errors.area}
                />
                <HelperText type="error" visible={!!errors.area}>
                  {errors.area}
                </HelperText>
              </View>
              <View style={styles.halfSection}>
                <TextInput
                  label="Кімнат *"
                  value={formData.rooms.toString()}
                  onChangeText={(text) => updateFormData('rooms', parseInt(text) || 1)}
                  mode="outlined"
                  keyboardType="numeric"
                  error={!!errors.rooms}
                />
                <HelperText type="error" visible={!!errors.rooms}>
                  {errors.rooms}
                </HelperText>
              </View>
            </View>

            {/* Поверхи */}
            <View style={styles.row}>
              <View style={styles.halfSection}>
                <TextInput
                  label="Поверх *"
                  value={formData.floor.toString()}
                  onChangeText={(text) => updateFormData('floor', parseInt(text) || 1)}
                  mode="outlined"
                  keyboardType="numeric"
                  error={!!errors.floor}
                />
                <HelperText type="error" visible={!!errors.floor}>
                  {errors.floor}
                </HelperText>
              </View>
              <View style={styles.halfSection}>
                <TextInput
                  label="Загалом поверхів *"
                  value={formData.totalFloors.toString()}
                  onChangeText={(text) => updateFormData('totalFloors', parseInt(text) || 1)}
                  mode="outlined"
                  keyboardType="numeric"
                  error={!!errors.totalFloors}
                />
                <HelperText type="error" visible={!!errors.totalFloors}>
                  {errors.totalFloors}
                </HelperText>
              </View>
            </View>

            {/* Тип будинку */}
            <View style={styles.section}>
              <Paragraph style={styles.label}>Тип будинку</Paragraph>
              <RadioButton.Group
                onValueChange={(value) => updateFormData('buildingType', value)}
                value={formData.buildingType}
              >
                {BUILDING_TYPES.map((type) => (
                  <RadioButton.Item
                    key={type.value}
                    label={type.label}
                    value={type.value}
                  />
                ))}
              </RadioButton.Group>
            </View>

            {/* Стан */}
            <View style={styles.section}>
              <Paragraph style={styles.label}>Стан квартири</Paragraph>
              <RadioButton.Group
                onValueChange={(value) => updateFormData('condition', value)}
                value={formData.condition}
              >
                {CONDITIONS.map((condition) => (
                  <RadioButton.Item
                    key={condition.value}
                    label={condition.label}
                    value={condition.value}
                  />
                ))}
              </RadioButton.Group>
            </View>

            {/* Додаткові опції */}
            <View style={styles.section}>
              <View style={styles.switchRow}>
                <Paragraph>Балкон</Paragraph>
                <Switch
                  value={formData.hasBalcony}
                  onValueChange={(value) => updateFormData('hasBalcony', value)}
                />
              </View>
              <View style={styles.switchRow}>
                <Paragraph>Ліфт</Paragraph>
                <Switch
                  value={formData.hasElevator}
                  onValueChange={(value) => updateFormData('hasElevator', value)}
                />
              </View>
            </View>

            {/* Опалення */}
            <View style={styles.section}>
              <Paragraph style={styles.label}>Опалення</Paragraph>
              <RadioButton.Group
                onValueChange={(value) => updateFormData('heating', value)}
                value={formData.heating}
              >
                <RadioButton.Item label="Центральне" value="central" />
                <RadioButton.Item label="Індивідуальне" value="individual" />
                <RadioButton.Item label="Відсутнє" value="none" />
              </RadioButton.Group>
            </View>

            {/* Опис */}
            <View style={styles.section}>
              <TextInput
                label="Додатковий опис (необов'язково)"
                value={formData.description}
                onChangeText={(text) => updateFormData('description', text)}
                mode="outlined"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Кнопки дій */}
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                style={styles.saveButton}
              >
                {saving ? 'Зберігаємо...' : 'Зберегти та оцінити'}
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
              >
                Скасувати
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Модальне вікно з картою */}
      <Portal>
        <Modal
          visible={showMap}
          onDismiss={() => setShowMap(false)}
          contentContainerStyle={styles.mapModal}
        >
          <View style={styles.mapContainer}>
            <View style={styles.mapHeader}>
              <Title>Оберіть локацію на карті</Title>
              <Button onPress={() => setShowMap(false)}>Закрити</Button>
            </View>

            {currentLocation && (
              <MapView
                provider={PROVIDER_OPENSTREETMAP}
                style={styles.map}
                initialRegion={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                onPress={handleMapPress}
                showsUserLocation={true}
                showsMyLocationButton={true}
              >
                {selectedLocation && (
                  <Marker
                    coordinate={{
                      latitude: selectedLocation.latitude,
                      longitude: selectedLocation.longitude,
                    }}
                    title="Обрана локація"
                    pinColor="blue"
                  />
                )}

                {/* Показуємо маркери районів Харкова */}
                {KHARKIV_CITY.districts.map(district => (
                  <Marker
                    key={district.id}
                    coordinate={{
                      latitude: district.coordinates.latitude,
                      longitude: district.coordinates.longitude,
                    }}
                    title={district.name}
                    description={district.description}
                    pinColor="red"
                  />
                ))}
              </MapView>
            )}

            <View style={styles.mapActions}>
              <Button
                mode="contained"
                onPress={confirmLocation}
                disabled={!selectedLocation}
                style={styles.confirmButton}
              >
                Підтвердити вибір
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfSection: {
    width: '48%',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cityChip: {
    margin: 4,
    backgroundColor: '#e3f2fd',
  },
  districtChip: {
    margin: 4,
    backgroundColor: '#f3e5f5',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  buttonContainer: {
    marginTop: 24,
  },
  saveButton: {
    marginBottom: 12,
  },
  cancelButton: {
    borderColor: '#2196F3',
  },
  // Стилі для карти
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressInput: {
    flex: 1,
    marginRight: 8,
  },
  mapButton: {
    marginTop: 8,
  },
  mapModal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    height: '80%',
  },
  mapContainer: {
    flex: 1,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  map: {
    flex: 1,
  },
  mapActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  confirmButton: {
    marginTop: 8,
  },
});

export default PropertyFormScreen;
