import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  List,
  Switch,
  Button,
  Divider,
  Dialog,
  Portal,
  ActivityIndicator,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList } from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdService } from '../services/AdService';

type SettingsScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Settings'>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const notifications = await AsyncStorage.getItem('notificationsEnabled');
      const offline = await AsyncStorage.getItem('offlineMode');

      setNotificationsEnabled(notifications !== 'false');
      setOfflineMode(offline === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, value.toString());

      if (key === 'notificationsEnabled') {
        setNotificationsEnabled(value);
      } else if (key === 'offlineMode') {
        setOfflineMode(value);
      }
    } catch (error) {
      console.error('Error saving setting:', error);
      Alert.alert('Помилка', 'Не вдалося зберегти налаштування');
    }
  };

  const handleResetData = async () => {
    try {
      await AsyncStorage.clear();
      setShowResetDialog(false);
      Alert.alert(
        'Дані скинуто',
        'Всі збережені дані видалено. Перезапустіть додаток для повного очищення.',
        [
          { text: 'OK', onPress: () => {
            // Можна додати логіку перезапуску додатку
          }},
        ]
      );
    } catch (error) {
      console.error('Error resetting data:', error);
      Alert.alert('Помилка', 'Не вдалося скинути дані');
    }
  };

  const handleContactSupport = () => {
    const email = 'support@realestateapp.com';
    const subject = 'Підтримка користувача Real Estate App';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Помилка', 'Не вдалося відкрити поштовий клієнт');
      }
    });
  };

  const handleRateApp = () => {
    // В реальному додатку тут буде посилання на магазин додатків
    Alert.alert(
      'Оцінити додаток',
      'Дякуємо за використання нашого додатку! Скоро ви зможете оцінити нас у магазині додатків.',
      [{ text: 'OK' }]
    );
  };

  const handleShareApp = async () => {
    try {
      await AdService.showRewardedAd();
      const message = 'Спробуйте цей корисний додаток для оцінки нерухомості! Real Estate App - швидко та точно визначає вартість квартири.';
      await Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Загальні налаштування */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Загальні налаштування</Title>

          <List.Item
            title="Сповіщення"
            description="Отримувати сповіщення про оновлення цін"
            right={() => (
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => saveSetting('notificationsEnabled', value)}
              />
            )}
          />

          <Divider style={styles.divider} />

          <List.Item
            title="Офлайн режим"
            description="Використовувати тільки локальні дані"
            right={() => (
              <Switch
                value={offlineMode}
                onValueChange={(value) => saveSetting('offlineMode', value)}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* Дані та приватність */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Дані та приватність</Title>

          <List.Item
            title="Експорт даних"
            description="Завантажити всі збережені оцінки"
            onPress={() => Alert.alert('Експорт', 'Функція експорту буде доступна в наступних версіях')}
            right={props => <List.Icon {...props} icon="download" />}
          />

          <Divider style={styles.divider} />

          <List.Item
            title="Очистити всі дані"
            description="Видалити всі збережені оцінки та налаштування"
            onPress={() => setShowResetDialog(true)}
            right={props => <List.Icon {...props} icon="delete" color="#F44336" />}
          />
        </Card.Content>
      </Card>

      {/* Про додаток */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Про додаток</Title>

          <List.Item
            title="Версія"
            description="1.0.0"
            right={props => <Paragraph style={styles.versionText}>1.0.0</Paragraph>}
          />

          <Divider style={styles.divider} />

          <List.Item
            title="Про розробника"
            description="Команда Real Estate App"
            onPress={() => setShowAboutDialog(true)}
          />

          <Divider style={styles.divider} />

          <List.Item
            title="Політика конфіденційності"
            description="Як ми використовуємо ваші дані"
            onPress={() => Alert.alert('Політика', 'Політика конфіденційності буде доступна в наступних версіях')}
          />

          <Divider style={styles.divider} />

          <List.Item
            title="Умови використання"
            description="Правила використання додатку"
            onPress={() => Alert.alert('Умови', 'Умови використання будуть доступні в наступних версіях')}
          />
        </Card.Content>
      </Card>

      {/* Підтримка */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Підтримка</Title>

          <List.Item
            title="Зв'язатися з підтримкою"
            description="Написати листа розробникам"
            onPress={handleContactSupport}
            right={props => <List.Icon {...props} icon="email" />}
          />

          <Divider style={styles.divider} />

          <List.Item
            title="Оцінити додаток"
            description="Залиште відгук у магазині додатків"
            onPress={handleRateApp}
            right={props => <List.Icon {...props} icon="star" />}
          />

          <Divider style={styles.divider} />

          <List.Item
            title="Поділитися додатком"
            description="Рекомендувати друзям"
            onPress={handleShareApp}
            right={props => <List.Icon {...props} icon="share" />}
          />
        </Card.Content>
      </Card>

      {/* Додаткова інформація */}
      <Card style={styles.card}>
        <Card.Content>
          <Paragraph style={styles.disclaimer}>
            Додаток надає оцінку вартості нерухомості на основі аналізу ринку.
            Фактична вартість може відрізнятися залежно від конкретних умов продажу.
          </Paragraph>
          <Paragraph style={styles.disclaimer}>
            Реклама допомагає підтримувати додаток безкоштовним для користувачів.
          </Paragraph>
        </Card.Content>
      </Card>

      {/* Reset Data Dialog */}
      <Portal>
        <Dialog visible={showResetDialog} onDismiss={() => setShowResetDialog(false)}>
          <Dialog.Title>Скинути всі дані</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Це видалить всі збережені оцінки, налаштування та історію.
              Цю дію неможливо скасувати.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowResetDialog(false)}>Скасувати</Button>
            <Button onPress={handleResetData} textColor="#F44336">
              Скинути
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* About Dialog */}
      <Portal>
        <Dialog visible={showAboutDialog} onDismiss={() => setShowAboutDialog(false)}>
          <Dialog.Title>Про Real Estate App</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Додаток для оцінки вартості нерухомості в Україні та Європі.
              Використовує сучасні алгоритми машинного навчання для точного аналізу ринку.
            </Paragraph>
            <Paragraph style={styles.dialogText}>
              Розроблено командою професіоналів у сфері нерухомості та IT.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAboutDialog(false)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
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
  card: {
    margin: 16,
    elevation: 2,
  },
  divider: {
    marginVertical: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#666',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  dialogText: {
    marginTop: 16,
  },
});

export default SettingsScreen;
