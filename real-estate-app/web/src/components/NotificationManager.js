import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Typography,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsNone as NotificationsNoneIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const NotificationManager = () => {
  const [open, setOpen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');
  const [settings, setSettings] = useState({
    newListings: true,
    priceChanges: true,
    marketUpdates: false,
    weeklyDigest: false,
  });

  useEffect(() => {
    checkNotificationSupport();
    checkSubscriptionStatus();
    checkPermissionStatus();
  }, []);

  const checkNotificationSupport = () => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
  };

  const checkPermissionStatus = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermission(Notification.permission);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        await subscribeToNotifications();
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const subscribeToNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Генеруємо VAPID ключі (в реальному додатку це буде на backend)
      const vapidPublicKey = 'BMj8nPJ8nPJ8nPJ8nPJ8nPJ8nPJ8nPJ8nPJ8nPJ8nPJ8nPJ8nPJ8nPJ8nPJ8nPJ8nPJ8nPJ8nPJ8nPJ8nPJ8nPJ8';

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Надсилаємо підписку на backend
      await saveSubscription(subscription);

      setIsSubscribed(true);
      console.log('✅ Підписано на сповіщення');
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
    }
  };

  const unsubscribeFromNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await removeSubscription(subscription.endpoint);
      }

      setIsSubscribed(false);
      console.log('❌ Відписано від сповіщень');
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
    }
  };

  const saveSubscription = async (subscription) => {
    try {
      // Надсилаємо підписку на backend
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          settings: settings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      console.log('✅ Підписку збережено на сервері');
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  const removeSubscription = async (endpoint) => {
    try {
      // Видаляємо підписку з backend
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint }),
      });

      console.log('✅ Підписку видалено з сервера');
    } catch (error) {
      console.error('Error removing subscription:', error);
    }
  };

  const updateSettings = async (newSettings) => {
    setSettings(newSettings);

    if (isSubscribed) {
      try {
        // Оновлюємо налаштування на backend
        await fetch('/api/notifications/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newSettings),
        });

        console.log('✅ Налаштування сповіщень оновлено');
      } catch (error) {
        console.error('Error updating notification settings:', error);
      }
    }
  };

  const handleSettingChange = (setting) => (event) => {
    const newSettings = {
      ...settings,
      [setting]: event.target.checked,
    };

    setSettings(newSettings);
    updateSettings(newSettings);
  };

  const testNotification = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification('Тестове сповіщення', {
        body: 'Сповіщення працюють правильно! 🎉',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification',
        requireInteraction: false,
        actions: [
          {
            action: 'view',
            title: 'Переглянути',
          },
          {
            action: 'dismiss',
            title: 'Закрити',
          },
        ],
      });

      console.log('✅ Тестове сповіщення надіслано');
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  // Конвертація VAPID ключа
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { status: 'Дозволено', color: 'success', icon: <NotificationsActiveIcon /> };
      case 'denied':
        return { status: 'Заборонено', color: 'error', icon: <NotificationsNoneIcon /> };
      default:
        return { status: 'Не визначено', color: 'warning', icon: <NotificationsIcon /> };
    }
  };

  const permissionStatus = getPermissionStatus();

  return (
    <>
      <IconButton
        color="inherit"
        onClick={() => setOpen(true)}
        title="Налаштування сповіщень"
      >
        {isSubscribed ? <NotificationsActiveIcon /> : <NotificationsNoneIcon />}
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon />
          Налаштування сповіщень
        </DialogTitle>

        <DialogContent>
          {!isSupported && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Ваш браузер не підтримує сповіщення
            </Alert>
          )}

          {/* Статус дозволів */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Статус сповіщень:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {permissionStatus.icon}
              <Chip
                label={permissionStatus.status}
                color={permissionStatus.color}
                size="small"
              />
            </Box>
          </Box>

          {/* Кнопки дій */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            {permission !== 'granted' && (
              <Button
                variant="contained"
                onClick={requestPermission}
                startIcon={<NotificationsIcon />}
                fullWidth
              >
                Дозволити сповіщення
              </Button>
            )}

            {permission === 'granted' && !isSubscribed && (
              <Button
                variant="contained"
                onClick={subscribeToNotifications}
                startIcon={<NotificationsActiveIcon />}
                fullWidth
              >
                Підписатися на сповіщення
              </Button>
            )}

            {isSubscribed && (
              <Button
                variant="outlined"
                color="error"
                onClick={unsubscribeFromNotifications}
                startIcon={<NotificationsNoneIcon />}
                fullWidth
              >
                Відписатися
              </Button>
            )}
          </Box>

          {/* Налаштування типів сповіщень */}
          {isSubscribed && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Типи сповіщень:
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Нові оголошення"
                    secondary="Сповіщення про нові оголошення в обраному районі"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.newListings}
                      onChange={handleSettingChange('newListings')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <Divider />

                <ListItem>
                  <ListItemText
                    primary="Зміни цін"
                    secondary="Сповіщення про значні зміни цін на подібну нерухомість"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.priceChanges}
                      onChange={handleSettingChange('priceChanges')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <Divider />

                <ListItem>
                  <ListItemText
                    primary="Оновлення ринку"
                    secondary="Щотижневі звіти про стан ринку нерухомості"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.marketUpdates}
                      onChange={handleSettingChange('marketUpdates')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <Divider />

                <ListItem>
                  <ListItemText
                    primary="Тижневий дайджест"
                    secondary="Підсумок тижня з найважливішими змінами"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.weeklyDigest}
                      onChange={handleSettingChange('weeklyDigest')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </Box>
          )}

          {/* Тест сповіщення */}
          {isSubscribed && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="outlined"
                onClick={testNotification}
                startIcon={<NotificationsIcon />}
              >
                Надіслати тестове сповіщення
              </Button>
            </Box>
          )}

          {/* Інформація */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              Сповіщення допоможуть вам не пропустити нові оголошення та важливі зміни на ринку нерухомості.
              Ви можете налаштувати типи сповіщень, які вас цікавлять.
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            Закрити
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationManager;
