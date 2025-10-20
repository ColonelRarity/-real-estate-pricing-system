import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  ProgressBar,
  Chip,
  List,
  ActivityIndicator,
  FAB,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { PropertyService, PropertyValuation } from '../services/PropertyService';
import { AdService } from '../services/AdService';

type ResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Results'>;
type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

interface Props {
  navigation: ResultsScreenNavigationProp;
  route: ResultsScreenRouteProp;
}

const ResultsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { propertyId } = route.params;
  const [loading, setLoading] = useState(true);
  const [valuation, setValuation] = useState<PropertyValuation | null>(null);
  const [property, setProperty] = useState<any>(null);

  useEffect(() => {
    loadData();

    // Показуємо рекламу після отримання результатів
    setTimeout(() => {
      AdService.showInterstitialAd();
    }, 2000);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Завантажуємо оцінку
      const valuationData = await PropertyService.getValuation(propertyId);
      setValuation(valuationData);

      // Завантажуємо дані про нерухомість
      const propertyData = await PropertyService.getProperty(propertyId);
      setProperty(propertyData);

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити дані оцінки');
    } finally {
      setLoading(false);
    }
  };

  const handleShareResults = async () => {
    if (!valuation || !property) return;

    try {
      const message = `Оцінка моєї нерухомості:
📍 ${property.city}, ${property.district}
🏠 ${property.area} м², ${property.rooms} кімнат
💰 Оцінка: $${valuation.estimatedValue.toLocaleString()}

Отримана через додаток Real Estate App`;

      await Share.share({
        message,
        title: 'Оцінка нерухомості',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleNewValuation = () => {
    navigation.navigate('PropertyForm');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4CAF50';
    if (confidence >= 0.6) return '#FF9800';
    return '#F44336';
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'low': return '#F44336';
      default: return '#2196F3';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Paragraph style={styles.loadingText}>Аналізуємо ринок...</Paragraph>
      </View>
    );
  }

  if (!valuation || !property) {
    return (
      <View style={styles.errorContainer}>
        <Paragraph>Не вдалося отримати оцінку</Paragraph>
        <Button onPress={loadData}>Спробувати знову</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Основна оцінка */}
        <Card style={styles.mainCard}>
          <Card.Content>
            <Title style={styles.mainTitle}>Оцінка вартості</Title>
            <View style={styles.priceContainer}>
              <Title style={styles.priceText}>
                ${valuation.estimatedValue.toLocaleString()}
              </Title>
              <Paragraph style={styles.priceSubtext}>
                Діапазон: ${valuation.priceRange.min.toLocaleString()} - ${valuation.priceRange.max.toLocaleString()}
              </Paragraph>
            </View>

            {/* Впевненість моделі */}
            <View style={styles.confidenceContainer}>
              <Paragraph>Точність оцінки</Paragraph>
              <View style={styles.confidenceBar}>
                <ProgressBar
                  progress={valuation.confidence}
                  color={getConfidenceColor(valuation.confidence)}
                  style={styles.progressBar}
                />
                <Paragraph style={[styles.confidenceText, { color: getConfidenceColor(valuation.confidence) }]}>
                  {Math.round(valuation.confidence * 100)}%
                </Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Деталі нерухомості */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Деталі об'єкта</Title>
            <List.Item
              title="Місто та район"
              description={`${property.city}, ${property.district}`}
              left={props => <List.Icon {...props} icon="map-marker" />}
            />
            <List.Item
              title="Адреса"
              description={property.address}
              left={props => <List.Icon {...props} icon="home" />}
            />
            <List.Item
              title="Площа та кімнати"
              description={`${property.area} м², ${property.rooms} кімнат`}
              left={props => <List.Icon {...props} icon="floor-plan" />}
            />
            <List.Item
              title="Поверх"
              description={`${property.floor} з ${property.totalFloors}`}
              left={props => <List.Icon {...props} icon="stairs" />}
            />
            <List.Item
              title="Тип будинку"
              description={
                property.buildingType === 'brick' ? 'Цегла' :
                property.buildingType === 'panel' ? 'Панель' :
                property.buildingType === 'monolithic' ? 'Моноліт' : 'Дерево'
              }
              left={props => <List.Icon {...props} icon="office-building" />}
            />
            <List.Item
              title="Стан"
              description={
                property.condition === 'excellent' ? 'Відмінний' :
                property.condition === 'good' ? 'Добрий' :
                property.condition === 'fair' ? 'Задовільний' : 'Поганий'
              }
              left={props => <List.Icon {...props} icon="check-circle" />}
            />
          </Card.Content>
        </Card>

        {/* Фактори, що впливають на ціну */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Фактори оцінки</Title>
            <View style={styles.factorsContainer}>
              <View style={styles.factor}>
                <Paragraph>Локація</Paragraph>
                <ProgressBar
                  progress={valuation.factors.location}
                  color="#2196F3"
                  style={styles.factorBar}
                />
              </View>
              <View style={styles.factor}>
                <Paragraph>Площа</Paragraph>
                <ProgressBar
                  progress={valuation.factors.area}
                  color="#2196F3"
                  style={styles.factorBar}
                />
              </View>
              <View style={styles.factor}>
                <Paragraph>Стан</Paragraph>
                <ProgressBar
                  progress={valuation.factors.condition}
                  color="#2196F3"
                  style={styles.factorBar}
                />
              </View>
              <View style={styles.factor}>
                <Paragraph>Будинок</Paragraph>
                <ProgressBar
                  progress={valuation.factors.building}
                  color="#2196F3"
                  style={styles.factorBar}
                />
              </View>
              <View style={styles.factor}>
                <Paragraph>Поверх</Paragraph>
                <ProgressBar
                  progress={valuation.factors.floor}
                  color="#2196F3"
                  style={styles.factorBar}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Тренди ринку */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Тренди ринку</Title>
            <View style={styles.marketContainer}>
              <View style={styles.marketItem}>
                <Paragraph>Середня ціна за м²</Paragraph>
                <Title style={styles.marketValue}>
                  ${valuation.marketTrends.averagePricePerSqm}
                </Title>
              </View>
              <View style={styles.marketItem}>
                <Paragraph>Зміна ціни за місяць</Paragraph>
                <Title style={[
                  styles.marketValue,
                  { color: valuation.marketTrends.priceChangeLastMonth >= 0 ? '#4CAF50' : '#F44336' }
                ]}>
                  {valuation.marketTrends.priceChangeLastMonth >= 0 ? '+' : ''}
                  {valuation.marketTrends.priceChangeLastMonth}%
                </Title>
              </View>
              <View style={styles.marketItem}>
                <Paragraph>Рівень попиту</Paragraph>
                <Chip
                  style={[
                    styles.demandChip,
                    { backgroundColor: getDemandColor(valuation.marketTrends.demandLevel) }
                  ]}
                >
                  {valuation.marketTrends.demandLevel === 'high' ? 'Високий' :
                   valuation.marketTrends.demandLevel === 'medium' ? 'Середній' : 'Низький'}
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Поради */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Рекомендації</Title>
            <Paragraph style={styles.recommendation}>
              • Для продажу рекомендуємо встановити ціну в межах діапазону оцінки
            </Paragraph>
            <Paragraph style={styles.recommendation}>
              • Зверніть увагу на сезонність - весна та осінь традиційно кращі для продажу
            </Paragraph>
            <Paragraph style={styles.recommendation}>
              • Розгляньте можливість косметичного ремонту для збільшення вартості
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Дії */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.actionsContainer}>
              <Button
                mode="contained"
                onPress={handleNewValuation}
                style={styles.actionButton}
              >
                Нова оцінка
              </Button>
              <Button
                mode="outlined"
                onPress={handleShareResults}
                style={styles.actionButton}
              >
                Поділитися
              </Button>
            </View>

            {/* Додатково: перегляд карти з подібними об'єктами */}
            <View style={styles.mapActionsContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('PropertyMap', {
                  propertyId,
                  showSimilar: true
                })}
                style={styles.mapButton}
                icon="map"
              >
                Переглянути на карті
              </Button>
              <Paragraph style={styles.mapHint}>
                Порівняйте з подібними об'єктами поблизу
              </Paragraph>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Banner Ad */}
      <View style={styles.bannerContainer}>
        {AdService.renderBannerAd()}
      </View>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  mainCard: {
    margin: 16,
    elevation: 8,
    backgroundColor: '#2196F3',
  },
  mainTitle: {
    color: 'white',
    textAlign: 'center',
  },
  priceContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  priceText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  priceSubtext: {
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
  },
  confidenceContainer: {
    marginTop: 20,
  },
  confidenceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    marginRight: 12,
  },
  confidenceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  factorsContainer: {
    marginTop: 16,
  },
  factor: {
    marginBottom: 12,
  },
  factorBar: {
    height: 6,
    marginTop: 4,
  },
  marketContainer: {
    marginTop: 16,
  },
  marketItem: {
    marginBottom: 16,
    alignItems: 'center',
  },
  marketValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  demandChip: {
    color: 'white',
  },
  recommendation: {
    marginBottom: 8,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  mapActionsContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  mapButton: {
    marginBottom: 8,
  },
  mapHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 80,
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default ResultsScreen;
