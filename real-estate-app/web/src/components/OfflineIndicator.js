import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
} from '@mui/material';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Sync as SyncIcon,
  CloudSync as CloudSyncIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import useOfflineMode from '../hooks/useOfflineMode';

const OfflineIndicator = () => {
  const {
    isOnline,
    isServiceWorkerReady,
    syncStatus,
    syncData,
    checkCache,
    clearCache,
  } = useOfflineMode();

  const [cacheInfo, setCacheInfo] = React.useState({ hasCache: false, cacheSize: 0 });
  const [cacheDialogOpen, setCacheDialogOpen] = React.useState(false);

  // Перевіряємо кеш при монтуванні компонента
  React.useEffect(() => {
    const updateCacheInfo = async () => {
      const info = await checkCache();
      setCacheInfo(info);
    };

    updateCacheInfo();
  }, [checkCache]);

  const handleSync = async () => {
    await syncData();
  };

  const handleOpenCacheDialog = () => {
    setCacheDialogOpen(true);
  };

  const handleCloseCacheDialog = () => {
    setCacheDialogOpen(false);
  };

  const handleClearCache = async () => {
    const success = await clearCache();
    if (success) {
      const info = await checkCache();
      setCacheInfo(info);
      handleCloseCacheDialog();
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <SyncIcon sx={{ animation: 'spin 1s linear infinite' }} />;
      case 'synced':
        return <CloudSyncIcon color="success" />;
      case 'error':
        return <SyncIcon color="error" />;
      default:
        return <SyncIcon />;
    }
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'warning';
      case 'synced':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Індикатор онлайн/оффлайн */}
        <Tooltip title={isOnline ? 'Онлайн' : 'Оффлайн режим'}>
          <Chip
            icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
            label={isOnline ? 'Онлайн' : 'Оффлайн'}
            color={isOnline ? 'success' : 'default'}
            variant="outlined"
            size="small"
          />
        </Tooltip>

        {/* Індикатор Service Worker */}
        {isServiceWorkerReady && (
          <Tooltip title="Service Worker активний">
            <Chip
              icon={<CloudSyncIcon />}
              label="PWA"
              color="primary"
              variant="outlined"
              size="small"
            />
          </Tooltip>
        )}

        {/* Індикатор синхронізації */}
        {isOnline && (
          <Tooltip title={
            syncStatus === 'syncing' ? 'Синхронізація...' :
            syncStatus === 'synced' ? 'Синхронізовано' :
            syncStatus === 'error' ? 'Помилка синхронізації' :
            'Готовий до синхронізації'
          }>
            <IconButton
              size="small"
              onClick={handleSync}
              disabled={syncStatus === 'syncing'}
              sx={{
                color: syncStatus === 'synced' ? 'success.main' :
                       syncStatus === 'error' ? 'error.main' : 'inherit',
              }}
            >
              {getSyncStatusIcon()}
            </IconButton>
          </Tooltip>
        )}

        {/* Індикатор кешу */}
        {cacheInfo.hasCache && (
          <Tooltip title={`${cacheInfo.cacheSize} елементів у кеші`}>
            <IconButton
              size="small"
              onClick={handleOpenCacheDialog}
              sx={{ fontSize: '0.75rem' }}
            >
              💾
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Діалог управління кешем */}
      <Dialog open={cacheDialogOpen} onClose={handleCloseCacheDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Кеш додатку</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Кеш містить збережені дані для роботи в оффлайн режимі.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Статистика кешу:</strong>
            </Typography>
            <Typography variant="body2">
              • Кількість елементів: {cacheInfo.cacheSize}
            </Typography>
            <Typography variant="body2">
              • Назви кешів: {cacheInfo.cacheNames?.join(', ') || 'немає'}
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            Очищення кешу дозволить звільнити місце, але тимчасово погіршить роботу в оффлайн режимі.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCacheDialog}>Скасувати</Button>
          <Button
            onClick={handleClearCache}
            color="error"
            startIcon={<RefreshIcon />}
          >
            Очистити кеш
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSS для анімації синхронізації */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default OfflineIndicator;
