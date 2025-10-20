import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Searchbar,
  Chip,
  Portal,
  Modal,
  ActivityIndicator,
  FAB,
  Snackbar,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import MapView, { Marker, PROVIDER_OPENSTREETMAP, Region } from 'react-native-maps';
import { PropertyService, PropertyData } from '../services/PropertyService';
import GeocodingService from '../services/GeocodingService';

type PropertyMapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PropertyMap'>;
type PropertyMapScreenRouteProp = RouteProp<RootStackParamList, 'PropertyMap'>;

interface Props {
  navigation: PropertyMapScreenNavigationProp;
  route: PropertyMapScreenRouteProp;
}

interface MapProperty extends PropertyData {
  distance?: number;
  similarity?: number;
}

const PropertyMapScreen: React.FC<Props> = ({ navigation, route }) => {
  const { propertyId, showSimilar = false } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<MapProperty[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<MapProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 49.9935,
    longitude: 36.2304,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    loadProperties();
  }, [propertyId, showSimilar]);

  useEffect(() => {
    filterProperties();
  }, [properties, searchQuery]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      let loadedProperties: MapProperty[] = [];

      if (propertyId && showSimilar) {
        // Завантажуємо подібні об'єкти для конкретного propertyId
        const similarProperties = await PropertyService.findSimilarProperties(propertyId, 2000, 20);
        loadedProperties = similarProperties.map(p => ({
          ...p,
          distance: p.distance,
          similarity: p.similarity
        }));

        // Також завантажуємо сам об'єкт
        const mainProperty = await PropertyService.getProperty(propertyId);
        if (mainProperty) {
          loadedProperties.unshift({
            ...mainProperty,
            distance: 0,
            similarity: 1.0
          });
        }
      } else {
        // Завантажуємо всі об'єкти з координатами
        const savedProperties = await PropertyService.getSavedProperties();
        loadedProperties = Object.values(savedProperties).filter(p => p.coordinates) as MapProperty[];
      }

      setProperties(loadedProperties);

      // Центруємо карту на першому об'єкті або центрі Харкова
      if (loadedProperties.length > 0 && loadedProperties[0].coordinates) {
        setMapRegion({
          latitude: loadedProperties[0].coordinates.latitude,
          longitude: loadedProperties[0].coordinates.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити об\'єкти нерухомості');
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    if (!searchQuery.trim()) {
      setFilteredProperties(properties);
      return;
    }

    const filtered = properties.filter(property =>
      property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (property.description && property.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    setFilteredProperties(filtered);
  };

  const handleMarkerPress = (property: MapProperty) => {
    setSelectedProperty(property);
  };

  const getMarkerColor = (property: MapProperty) => {
    if (property.similarity === 1.0) return 'red'; // Поточний об'єкт
    if (property.similarity && property.similarity > 0.8) return 'orange'; // Дуже схожі
    if (property.similarity && property.similarity > 0.6) return 'blue'; // Помірно схожі
    return 'green'; // Інші об'єкти
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatArea = (area: number) => {
    return `${area} м²`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Пошук */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Шукати за адресою..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {/* Карта */}
      <MapView
        provider={PROVIDER_OPENSTREETMAP}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {filteredProperties.map((property) => (
          property.coordinates && (
            <Marker
              key={property.id}
              coordinate={{
                latitude: property.coordinates.latitude,
                longitude: property.coordinates.longitude,
              }}
              onPress={() => handleMarkerPress(property)}
              pinColor={getMarkerColor(property)}
              title={property.address}
              description={`${formatPrice(property.area * 1200)} • ${formatArea(property.area)}`}
            />
          )
        ))}
      </MapView>

      {/* Інформаційна панель */}
      {selectedProperty && (
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.propertyTitle}>{selectedProperty.address}</Title>
            <Paragraph>Район: {selectedProperty.district}</Paragraph>
            <Paragraph>
              {formatArea(selectedProperty.area)} • {selectedProperty.rooms} кімнат • {selectedProperty.floor}/{selectedProperty.totalFloors} поверх
            </Paragraph>
            <Paragraph>Тип: {selectedProperty.buildingType} • Стан: {selectedProperty.condition}</Paragraph>

            {selectedProperty.distance !== undefined && (
              <Paragraph>Відстань: {Math.round(selectedProperty.distance)}м</Paragraph>
            )}

            {selectedProperty.similarity !== undefined && selectedProperty.similarity < 1.0 && (
              <Chip style={styles.similarityChip}>
                Схожість: {Math.round(selectedProperty.similarity * 100)}%
              </Chip>
            )}

            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={() => {
                  navigation.navigate('Results', { propertyId: selectedProperty.id });
                }}
                style={styles.actionButton}
              >
                Оцінити
              </Button>
              <Button
                mode="outlined"
                onPress={() => setSelectedProperty(null)}
                style={styles.actionButton}
              >
                Закрити
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* FAB для додавання нового об'єкта */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('PropertyForm')}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
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
  searchContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  searchbar: {
    elevation: 4,
  },
  map: {
    flex: 1,
  },
  infoCard: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    elevation: 8,
  },
  propertyTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  similarityChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default PropertyMapScreen;
