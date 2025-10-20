import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { AdService } from '../services/AdService';
import { PropertyService } from '../services/PropertyService';
import { KHARKIV_CITY } from '../types/location';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [savedPropertiesCount, setSavedPropertiesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const properties = await PropertyService.getSavedProperties();
      setSavedPropertiesCount(Object.keys(properties).length);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartValuation = async () => {
    try {
      setIsAdLoading(true);

      // Показуємо рекламу перед оцінкою
      const adWatched = await AdService.showRewardedAd();

      if (adWatched) {
        // Переходимо до форми оцінки після перегляду реклами
        navigation.navigate('PropertyForm');
      } else {
        // Якщо рекламу не переглянули, показуємо альтернативу
        Alert.alert(
          'Доступ до оцінки',
          'Для отримання оцінки потрібно переглянути коротке відео. Спробувати ще раз?',
          [
            { text: 'Скасувати', style: 'cancel' },
            { text: 'Спробувати', onPress: handleStartValuation },
          ]
        );
      }
    } catch (error) {
      console.error('Error showing ad:', error);
      // Якщо помилка з рекламою, все одно переходимо до форми
      navigation.navigate('PropertyForm');
    } finally {
      setIsAdLoading(false);
    }
  };

  const handleQuickValuation = () => {
    // Швидка оцінка без детальної форми
    Alert.alert(
      'Швидка оцінка',
      'Для швидкої оцінки потрібні основні параметри квартири',
      [
        { text: 'Детальна оцінка', onPress: handleStartValuation },
        { text: 'Продовжити', onPress: () => navigation.navigate('PropertyForm') },
      ]
    );
  };

  const handleShareApp = async () => {
    try {
      const result = await Share.share({
        message: 'Перевірте вартість своєї нерухомості з додатком Real Estate App! Завантажуйте: [посилання на додаток]',
        title: 'Real Estate App - Оцінка нерухомості',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <Title style={styles.title}>Оцінка нерухомості</Title>
          <Paragraph style={styles.subtitle}>
            Дізнайтеся реальну вартість своєї квартири в Україні та Європі
          </Paragraph>
        </View>

        {/* Quick Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Швидкі дії</Title>
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleStartValuation}
                style={styles.primaryButton}
                loading={isAdLoading}
                disabled={isAdLoading}
              >
                Почати оцінку
              </Button>
              <Button
                mode="outlined"
                onPress={handleQuickValuation}
                style={styles.secondaryButton}
              >
                Швидка оцінка
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Features */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Чому обирають нас?</Title>
            <View style={styles.featuresContainer}>
              <View style={styles.feature}>
                <Chip icon="map-marker" style={styles.chip}>
                  Точна геолокація
                </Chip>
                <Paragraph style={styles.featureText}>
                  Аналізуємо ринок по районах та містах
                </Paragraph>
              </View>
              <View style={styles.feature}>
                <Chip icon="brain" style={styles.chip}>
                  ШІ аналіз
                </Chip>
                <Paragraph style={styles.featureText}>
                  Використовуємо машинне навчання для оцінки
                </Paragraph>
              </View>
              <View style={styles.feature}>
                <Chip icon="trending-up" style={styles.chip}>
                  Актуальні дані
                </Chip>
                <Paragraph style={styles.featureText}>
                  Оновлюємо базу оголошень щодня
                </Paragraph>
              </View>
              <View style={styles.feature}>
                <Chip icon="shield-check" style={styles.chip}>
                  Безкоштовно
                </Chip>
                <Paragraph style={styles.featureText}>
                  Додаток повністю безкоштовний з рекламою
                </Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Stats */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Статистика</Title>
            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <Paragraph style={styles.statNumber}>{savedPropertiesCount}</Paragraph>
                <Paragraph style={styles.statLabel}>Збережених оцінок</Paragraph>
              </View>
              <View style={styles.stat}>
                <Paragraph style={styles.statNumber}>{KHARKIV_CITY.districts.length}</Paragraph>
                <Paragraph style={styles.statLabel}>Районів та мікрорайонів</Paragraph>
              </View>
              <View style={styles.stat}>
                <Paragraph style={styles.statNumber}>95%</Paragraph>
                <Paragraph style={styles.statLabel}>Точність оцінки</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Райони Харкова */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Райони Харкова</Title>
            <View style={styles.citiesContainer}>
              {KHARKIV_CITY.districts.slice(0, 8).map((district) => (
                <Chip key={district.id} style={styles.cityChip}>
                  {district.name}
                </Chip>
              ))}
              {KHARKIV_CITY.districts.length > 8 && (
                <Chip style={styles.cityChip}>
                  +{KHARKIV_CITY.districts.length - 8} районів
                </Chip>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Share Section */}
        <Card style={styles.card}>
          <Card.Content>
            <TouchableOpacity onPress={handleShareApp} style={styles.shareContainer}>
              <Title>Поділіться додатком</Title>
              <Paragraph>Розкажіть друзям про корисний додаток для оцінки нерухомості</Paragraph>
              <Button mode="outlined" style={styles.shareButton}>
                Поділитися
              </Button>
            </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#2196F3',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  buttonContainer: {
    marginTop: 16,
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    borderColor: '#2196F3',
  },
  featuresContainer: {
    marginTop: 16,
  },
  feature: {
    marginBottom: 16,
  },
  chip: {
    marginBottom: 8,
    backgroundColor: '#e3f2fd',
  },
  featureText: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  citiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  cityChip: {
    margin: 4,
    backgroundColor: '#f0f0f0',
  },
  shareContainer: {
    alignItems: 'center',
  },
  shareButton: {
    marginTop: 12,
    borderColor: '#2196F3',
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

export default HomeScreen;
