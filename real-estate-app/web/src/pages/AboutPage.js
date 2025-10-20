import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  DataUsage as DataIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Map as MapIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

const AboutPage = () => {
  const features = [
    {
      icon: <PsychologyIcon color="primary" />,
      title: 'Штучний інтелект',
      description: 'Використовуємо машинне навчання для точної оцінки вартості нерухомості на основі тисяч факторів.',
    },
    {
      icon: <DataIcon color="primary" />,
      title: '4 джерела даних',
      description: 'Аналізуємо оголошення з OLX, Dom.Ria, Realt.ua та Address.ua для максимальної точності.',
    },
    {
      icon: <MapIcon color="primary" />,
      title: 'Геолокація',
      description: 'Відображаємо об\'єкти на інтерактивній карті з точними координатами та можливістю порівняння.',
    },
    {
      icon: <SpeedIcon color="primary" />,
      title: 'Швидка оцінка',
      description: 'Отримуйте оцінку вартості за лічені секунди з детальним звітом та рекомендаціями.',
    },
    {
      icon: <TrendingUpIcon color="primary" />,
      title: 'Аналітика ринку',
      description: 'Відстежуйте тренди цін, статистику районів та рівень попиту в режимі реального часу.',
    },
    {
      icon: <SecurityIcon color="primary" />,
      title: 'Безпека та приватність',
      description: 'Всі дані зберігаються локально та передаються через захищені канали.',
    },
  ];

  const technologies = [
    'React 18',
    'Material-UI',
    'Python FastAPI',
    'PostgreSQL',
    'Scikit-learn',
    'Pandas',
    'BeautifulSoup',
    'Leaflet Maps',
    'Axios',
    'React Router',
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom textAlign="center">
          Про наш додаток
        </Typography>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom>
            Місія проекту
          </Typography>
          <Typography variant="body1" paragraph>
            Ми створили найточнішу систему оцінки вартості нерухомості в Україні з використанням
            штучного інтелекту та аналізу даних з 4 джерел. Наша мета - допомогти користувачам
            приймати обґрунтовані рішення при купівлі, продажу або оренді нерухомості.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Основні особливості */}
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              Основні особливості
            </Typography>

            <List>
              {features.map((feature, index) => (
                <ListItem key={index} sx={{ mb: 2 }}>
                  <ListItemIcon>
                    {feature.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={feature.title}
                    secondary={feature.description}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>

          {/* Технології */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Технології
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {technologies.map((tech, index) => (
                    <Chip key={index} label={tech} variant="outlined" size="small" />
                  ))}
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Статистика
                </Typography>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" gutterBottom>
                    15,000+
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    оголошень в базі даних
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" gutterBottom>
                    4
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    джерела даних для аналізу
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" gutterBottom>
                    85%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    точність оцінки
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Як це працює */}
        <Box sx={{ py: 6 }}>
          <Typography variant="h4" gutterBottom>
            Як це працює?
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" color="primary" gutterBottom>
                    1
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    Збір даних
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Автоматично збираємо оголошення з 4 джерел нерухомості кожні 30 хвилин.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" color="primary" gutterBottom>
                    2
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    Аналіз та навчання
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Використовуємо машинне навчання для аналізу факторів та навчання моделей оцінки.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" color="primary" gutterBottom>
                    3
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    Оцінка та рекомендації
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Надаємо точну оцінку з детальними рекомендаціями та порівнянням з ринком.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Команда */}
        <Box sx={{ py: 6 }}>
          <Typography variant="h4" gutterBottom>
            Наша команда
          </Typography>

          <Typography variant="body1" paragraph>
            Ми - команда розробників та data scientist'ів, які прагнуть зробити ринок нерухомості
            більш прозорим та доступним для всіх. Наш додаток поєднує найкращі практики веб-розробки,
            машинного навчання та UX дизайну.
          </Typography>

          <Typography variant="body1">
            Ми віримо, що точна інформація та розумний аналіз допоможуть людям приймати кращі
            рішення при операціях з нерухомістю.
          </Typography>
        </Box>

        {/* Контакти */}
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Зв'яжіться з нами
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body1">
                <strong>Email:</strong> support@real-estate-app.com
              </Typography>
              <Typography variant="body1">
                <strong>Телефон:</strong> +38 (050) 123-45-67
              </Typography>
              <Typography variant="body1">
                <strong>GitHub:</strong>{' '}
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  github.com/real-estate-app
                </a>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default AboutPage;
