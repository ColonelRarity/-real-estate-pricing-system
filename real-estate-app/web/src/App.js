import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { blue, grey } from '@mui/material/colors';

// Імпорт компонентів
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import PropertyFormPage from './pages/PropertyFormPage';
import ResultsPage from './pages/ResultsPage';
import MapPage from './pages/MapPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AboutPage from './pages/AboutPage';

// Створення теми Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: blue[600],
      light: blue[400],
      dark: blue[800],
    },
    secondary: {
      main: grey[600],
      light: grey[400],
      dark: grey[800],
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      marginBottom: '1rem',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      marginBottom: '0.75rem',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      marginBottom: '0.5rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <Box component="main" sx={{ flexGrow: 1, py: 2 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/evaluate" element={<PropertyFormPage />} />
              <Route path="/results/:propertyId" element={<ResultsPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
