import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const ExportReport = ({ analyticsData, selectedCity }) => {
  const [open, setOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [loading, setLoading] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const generatePDF = () => {
    setLoading(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Заголовок
      doc.setFontSize(20);
      doc.setTextColor(33, 150, 243);
      doc.text(`Аналітика нерухомості - ${selectedCity}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Дата генерації
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Згенеровано: ${new Date().toLocaleDateString('uk-UA')}`, 20, yPosition);
      yPosition += 15;

      // Загальна статистика
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Загальна статистика:', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(12);
      const stats = [
        `Середня ціна: ${analyticsData.averagePrice.toLocaleString()} грн/м²`,
        `Загальна кількість оголошень: ${analyticsData.totalListings.toLocaleString()}`,
        `Зміна цін за місяць: ${analyticsData.priceChange >= 0 ? '+' : ''}${analyticsData.priceChange}%`,
        `Рівень попиту: ${analyticsData.demandLevel === 'high' ? 'Високий' : analyticsData.demandLevel === 'medium' ? 'Середній' : 'Низький'}`,
      ];

      stats.forEach(stat => {
        doc.text(`• ${stat}`, 25, yPosition);
        yPosition += 8;
      });

      yPosition += 10;

      // Ціни по районах
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.text('Ціни по районах:', 20, yPosition);
      yPosition += 15;

      analyticsData.topDistricts.forEach((district, index) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.text(`${index + 1}. ${district.district}`, 25, yPosition);
        yPosition += 8;
        doc.text(`   Ціна: ${district.avgPrice.toLocaleString()} грн/м²`, 30, yPosition);
        yPosition += 6;
        doc.text(`   Оголошень: ${district.count.toLocaleString()}`, 30, yPosition);
        yPosition += 10;
      });

      // Тренди цін
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.text('Тренди цін (останні місяці):', 20, yPosition);
      yPosition += 15;

      analyticsData.chartData.forEach((data, index) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(10);
        doc.text(`${data.month}: ${data.price.toLocaleString()} грн/м² (${data.listings} оголошень)`, 25, yPosition);
        yPosition += 8;
      });

      // Рекомендації
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.text('Рекомендації:', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      const recommendations = [
        'Для продажу рекомендуємо встановити ціну в межах діапазону оцінки',
        'Зверніть увагу на сезонність - весна та осінь традиційно кращі для продажу',
        'Розгляньте можливість косметичного ремонту для збільшення вартості',
        'Порівняйте з подібними об\'єктами в вашому районі для кращого розуміння ринку',
      ];

      recommendations.forEach(rec => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`• ${rec}`, 25, yPosition);
        yPosition += 8;
      });

      // Збереження файлу
      const fileName = `analytics_${selectedCity}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Помилка при генерації PDF');
    } finally {
      setLoading(false);
    }
  };

  const generateExcel = () => {
    setLoading(true);

    try {
      const workbook = XLSX.utils.book_new();

      // Аркуш з загальною статистикою
      const statsData = [
        ['Показник', 'Значення'],
        ['Місто', selectedCity],
        ['Середня ціна (грн/м²)', analyticsData.averagePrice],
        ['Кількість оголошень', analyticsData.totalListings],
        ['Зміна цін за місяць (%)', analyticsData.priceChange],
        ['Рівень попиту', analyticsData.demandLevel],
        ['Дата генерації', new Date().toLocaleDateString('uk-UA')],
      ];

      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Загальна статистика');

      // Аркуш з цінами по районах
      const districtsData = [
        ['Район', 'Середня ціна (грн/м²)', 'Кількість оголошень'],
        ...analyticsData.topDistricts.map(district => [
          district.district,
          district.avgPrice,
          district.count,
        ]),
      ];

      const districtsSheet = XLSX.utils.aoa_to_sheet(districtsData);
      XLSX.utils.book_append_sheet(workbook, districtsSheet, 'Ціни по районах');

      // Аркуш з трендами цін
      const trendsData = [
        ['Місяць', 'Ціна (грн/м²)', 'Кількість оголошень'],
        ...analyticsData.chartData.map(data => [
          data.month,
          data.price,
          data.listings,
        ]),
      ];

      const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
      XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Тренди цін');

      // Збереження файлу
      const fileName = `analytics_${selectedCity}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Помилка при генерації Excel файлу');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (exportFormat === 'pdf') {
      generatePDF();
    } else {
      generateExcel();
    }
    handleClose();
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={handleOpen}
        sx={{ mt: 2 }}
      >
        Експортувати звіт
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Експорт аналітичного звіту</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Оберіть формат для експорту детального звіту по аналітиці нерухомості в {selectedCity}.
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Формат файлу</InputLabel>
            <Select
              value={exportFormat}
              label="Формат файлу"
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <MenuItem value="pdf">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PdfIcon color="error" />
                  PDF документ
                </Box>
              </MenuItem>
              <MenuItem value="excel">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ExcelIcon color="success" />
                  Excel таблиця
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Alert severity="info">
            {exportFormat === 'pdf'
              ? 'PDF звіт міститиме всі графіки, статистику та рекомендації у форматі документа.'
              : 'Excel файл міститиме всі дані у вигляді таблиць для подальшого аналізу.'
            }
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Скасувати</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? 'Генерація...' : `Експортувати ${exportFormat.toUpperCase()}`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExportReport;
