import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Favorite as FavoriteIcon,
  WatchLater as WatchLaterIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
  const {
    user,
    logout,
    updateProfile,
    favorites,
    watchlist,
    removeFromFavorites,
    removeFromWatchlist,
    getUserStats,
    updatePreferences,
  } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const stats = getUserStats();

  const handleEditProfile = () => {
    setEditData({
      name: user?.name || '',
      email: user?.email || '',
    });
    setEditMode(true);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await updateProfile(editData);
      setEditMode(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = async (field, value) => {
    try {
      await updatePreferences({ [field]: value });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  if (!user) {
    return (
      <Alert severity="info">
        Увійдіть в систему для доступу до профілю
      </Alert>
    );
  }

  return (
    <Box>
      {/* Профіль користувача */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{ width: 80, height: 80, mr: 3 }}
              src={user.avatar}
            >
              {user.name?.[0] || <PersonIcon />}
            </Avatar>

            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" gutterBottom>
                {user.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {user.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Приєднався: {new Date(user.createdAt).toLocaleDateString('uk-UA')}
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEditProfile}
            >
              Редагувати
            </Button>
          </Box>

          {/* Статистика */}
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {stats.totalFavorites}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Обраних
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {stats.totalWatchlist}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Відстежується
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Остання активність
                </Typography>
                <Typography variant="body1">
                  {new Date(stats.lastActivity).toLocaleDateString('uk-UA')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Обрані об'єкти */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FavoriteIcon color="error" />
            Обрані об'єкти ({favorites.length})
          </Typography>

          {favorites.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              У вас немає обраних об'єктів
            </Typography>
          ) : (
            <List dense>
              {favorites.map((propertyId, index) => (
                <ListItem key={propertyId}>
                  <ListItemText
                    primary={`Об'єкт #${propertyId}`}
                    secondary={`Додано: ${new Date().toLocaleDateString('uk-UA')}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => removeFromFavorites(propertyId)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Список для відстеження */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WatchLaterIcon color="warning" />
            Відстежувані об'єкти ({watchlist.length})
          </Typography>

          {watchlist.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              У вас немає об'єктів для відстеження
            </Typography>
          ) : (
            <List dense>
              {watchlist.map((item, index) => (
                <ListItem key={item.id}>
                  <ListItemText
                    primary={`Об'єкт #${item.id}`}
                    secondary={`Додано: ${new Date(item.addedAt).toLocaleDateString('uk-UA')}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => removeFromWatchlist(item.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Дії */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Дії
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setSettingsOpen(true)}
              fullWidth
            >
              Налаштування
            </Button>

            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={logout}
              fullWidth
            >
              Вийти з системи
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Діалог редагування профілю */}
      <Dialog open={editMode} onClose={() => setEditMode(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Редагування профілю</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ім'я"
                value={editData.name || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editData.email || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMode(false)}>
            Скасувати
          </Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Збереження...' : 'Зберегти'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Діалог налаштувань */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Налаштування</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Мова інтерфейсу
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Мова</InputLabel>
              <Select
                value={user?.preferences?.language || 'uk'}
                label="Мова"
                onChange={(e) => handleSettingsChange('language', e.target.value)}
              >
                <MenuItem value="uk">Українська</MenuItem>
                <MenuItem value="ru">Русский</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="subtitle1" gutterBottom>
              Валюта
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Валюта</InputLabel>
              <Select
                value={user?.preferences?.currency || 'UAH'}
                label="Валюта"
                onChange={(e) => handleSettingsChange('currency', e.target.value)}
              >
                <MenuItem value="UAH">Гривня (UAH)</MenuItem>
                <MenuItem value="USD">Долар (USD)</MenuItem>
                <MenuItem value="EUR">Євро (EUR)</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={user?.preferences?.notifications ?? true}
                  onChange={(e) => handleSettingsChange('notifications', e.target.checked)}
                />
              }
              label="Push-сповіщення"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>
            Закрити
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfile;
