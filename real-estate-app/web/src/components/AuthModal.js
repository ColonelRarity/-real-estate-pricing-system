import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const AuthModal = ({ open, onClose }) => {
  const { login } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
    setFormData({ email: '', password: '', name: '' });
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError('');
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setError('Заповніть всі поля');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await login({
        email: formData.email,
        password: formData.password,
      });

      onClose();
    } catch (error) {
      setError('Невірний email або пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      setError('Заповніть всі поля');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // В реальному додатку тут буде запит на реєстрацію
      // await register(formData);

      // Тимчасова симуляція
      await login({
        email: formData.email,
        password: formData.password,
      });

      onClose();
    } catch (error) {
      setError('Помилка реєстрації');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ email: '', password: '', name: '' });
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Вхід" />
          <Tab label="Реєстрація" />
        </Tabs>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          {/* Вхід */}
          {tabValue === 0 && (
            <Box>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Пароль"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                sx={{ mb: 2 }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? 'Вхід...' : 'Увійти'}
              </Button>
            </Box>
          )}

          {/* Реєстрація */}
          {tabValue === 1 && (
            <Box>
              <TextField
                fullWidth
                label="Ім'я"
                value={formData.name}
                onChange={handleInputChange('name')}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Пароль"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                sx={{ mb: 2 }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? 'Реєстрація...' : 'Зареєструватися'}
              </Button>
            </Box>
          )}
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Увійшовши в систему, ви зможете зберігати обрані об'єкти та отримувати персоналізовані рекомендації
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Скасувати
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuthModal;
