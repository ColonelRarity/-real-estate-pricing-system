import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  List,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList } from '../../App';
import { PropertyService, PropertyData } from '../services/PropertyService';

type HistoryScreenNavigationProp = StackNavigationProp<MainTabParamList, 'History'>;

interface Props {
  navigation: HistoryScreenNavigationProp;
}

const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [properties, setProperties] = useState<{ [key: string]: PropertyData }>({});
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const savedProperties = await PropertyService.getSavedProperties();
      setProperties(savedProperties);
    } catch (error) {
      console.error('Error loading history:', error);
      setSnackbarMessage('Помилка при завантаженні історії');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyPress = (propertyId: string) => {
    navigation.navigate('Results', { propertyId });
  };

  const handleDeleteProperty = (propertyId: string) => {
    Alert.alert(
      'Видалити оцінку',
      'Ви впевнені, що хочете видалити цю оцінку?',
      [
        { text: 'Скасувати', style: 'cancel' },
        { text: 'Видалити', style: 'destructive', onPress: () => deleteProperty(propertyId) },
      ]
    );
  };

  const deleteProperty = async (propertyId: string) => {
    try {
      // Отримуємо поточні властивості
      const currentProperties = { ...properties };
      delete currentProperties[propertyId];

      // Зберігаємо оновлений список
      // Note: В реальному додатку потрібно буде оновити PropertyService для видалення
      setProperties(currentProperties);

      setSnackbarMessage('Оцінку видалено');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error deleting property:', error);
      setSnackbarMessage('Помилка при видаленні оцінки');
      setSnackbarVisible(true);
    }
  };

  const renderProperty = ({ item }: { item: [string, PropertyData] }) => {
    const [propertyId, property] = item;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.propertyHeader}>
            <View style={styles.propertyInfo}>
              <Title style={styles.propertyTitle}>
                {property.city}, {property.district}
              </Title>
              <Paragraph style={styles.propertyAddress}>
                {property.address}
              </Paragraph>
              <Paragraph style={styles.propertyDetails}>
                {property.area} м² • {property.rooms} кімнат • {property.floor} поверх
              </Paragraph>
            </View>
          </View>

          <View style={styles.propertyActions}>
            <Button
              mode="outlined"
              onPress={() => handlePropertyPress(propertyId)}
              style={styles.viewButton}
            >
              Переглянути
            </Button>
            <Button
              mode="text"
              onPress={() => handleDeleteProperty(propertyId)}
              style={styles.deleteButton}
              textColor="#F44336"
            >
              Видалити
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const propertyList = Object.entries(properties);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {propertyList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Paragraph style={styles.emptyText}>
            У вас поки що немає збережених оцінок
          </Paragraph>
          <Paragraph style={styles.emptySubtext}>
            Створіть першу оцінку нерухомості на головному екрані
          </Paragraph>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Home')}
            style={styles.emptyButton}
          >
            Почати оцінку
          </Button>
        </View>
      ) : (
        <FlatList
          data={propertyList}
          renderItem={renderProperty}
          keyExtractor={([propertyId]) => propertyId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}

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
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  propertyHeader: {
    marginBottom: 12,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  propertyDetails: {
    fontSize: 12,
    color: '#888',
  },
  propertyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewButton: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    flex: 1,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    color: '#888',
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 120,
  },
});

export default HistoryScreen;
