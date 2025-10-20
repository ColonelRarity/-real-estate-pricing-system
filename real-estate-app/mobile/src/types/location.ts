// Типи для географічних даних Харкова з використанням LUN класифікації

export interface District {
  id: string; // Код району за LUN (КОАТУУ)
  name: string; // Назва району
  type: 'district' | 'microdistrict' | 'neighborhood';
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  averagePricePerSqm?: number;
  description?: string;
}

export interface City {
  id: string; // Код міста за LUN (КОАТУУ)
  name: string; // Назва міста
  region: string; // Область
  coordinates: {
    latitude: number;
    longitude: number;
  };
  districts: District[];
  averagePricePerSqm: number;
  population?: number;
  isRegionalCenter: boolean;
}

// Дані для Харкова (MVP фокус на одному місті)
export const KHARKIV_CITY: City = {
  id: '6310400000',
  name: 'Харків',
  region: 'Харківська',
  coordinates: { latitude: 49.9935, longitude: 36.2304 },
  averagePricePerSqm: 1200,
  population: 1430886,
  isRegionalCenter: true,
  districts: [
    {
      id: '6310430000',
      name: 'Основ\'янський',
      type: 'district',
      coordinates: { latitude: 49.9845, longitude: 36.2428 },
      averagePricePerSqm: 1150,
      description: 'Центральний район з історичною забудовою'
    },
    {
      id: '6310460000',
      name: 'Слобідський',
      type: 'district',
      coordinates: { latitude: 49.9750, longitude: 36.2650 },
      averagePricePerSqm: 1100,
      description: 'Промисловий район з доступним житлом'
    },
    {
      id: '6310490000',
      name: 'Немишлянський',
      type: 'district',
      coordinates: { latitude: 49.9650, longitude: 36.2950 },
      averagePricePerSqm: 1050,
      description: 'Район з новобудовами та промисловими зонами'
    },
    {
      id: '6310520000',
      name: 'Шевченківський',
      type: 'district',
      coordinates: { latitude: 50.0050, longitude: 36.2250 },
      averagePricePerSqm: 1250,
      description: 'Престижний район з парками та університетами'
    },
    {
      id: '6310550000',
      name: 'Холодногірський',
      type: 'district',
      coordinates: { latitude: 50.0150, longitude: 36.2100 },
      averagePricePerSqm: 1000,
      description: 'Район з історичною забудовою та транспортними вузлами'
    },
    {
      id: '6310580000',
      name: 'Індустріальний',
      type: 'district',
      coordinates: { latitude: 49.9500, longitude: 36.3100 },
      averagePricePerSqm: 950,
      description: 'Промисловий район з доступним житлом'
    },
    {
      id: '6310610000',
      name: 'Київський',
      type: 'district',
      coordinates: { latitude: 50.0250, longitude: 36.3400 },
      averagePricePerSqm: 1300,
      description: 'Район з новобудовами та хорошою інфраструктурою'
    },
    {
      id: '6310640000',
      name: 'Салтівський',
      type: 'district',
      coordinates: { latitude: 50.0350, longitude: 36.3000 },
      averagePricePerSqm: 900,
      description: 'Найбільший житловий масив Харкова'
    },
    {
      id: '6310670000',
      name: 'Новобаварський',
      type: 'district',
      coordinates: { latitude: 49.9550, longitude: 36.2000 },
      averagePricePerSqm: 850,
      description: 'Район з приватним сектором та промисловими зонами'
    },
    // Детальні мікрорайони Харкова
    {
      id: 'micro_kharkiv_centr',
      name: 'Центр',
      type: 'microdistrict',
      coordinates: { latitude: 49.9935, longitude: 36.2304 },
      averagePricePerSqm: 1400,
      description: 'Історичний центр з архітектурними пам\'ятками'
    },
    {
      id: 'micro_kharkiv_saltivka',
      name: 'Салтівка',
      type: 'microdistrict',
      coordinates: { latitude: 50.0300, longitude: 36.2950 },
      averagePricePerSqm: 850,
      description: 'Найбільший житловий масив з панельною забудовою'
    },
    {
      id: 'micro_kharkiv_oleksiivka',
      name: 'Олексіївка',
      type: 'microdistrict',
      coordinates: { latitude: 50.0450, longitude: 36.2850 },
      averagePricePerSqm: 1300,
      description: 'Престижний район з новобудовами та котеджами'
    },
    {
      id: 'micro_kharkiv_kholodna_gora',
      name: 'Холодна Гора',
      type: 'microdistrict',
      coordinates: { latitude: 50.0100, longitude: 36.2050 },
      averagePricePerSqm: 950,
      description: 'Район з приватною забудовою та промисловими підприємствами'
    },
    {
      id: 'micro_kharkiv_nova_bavaria',
      name: 'Нова Баварія',
      type: 'microdistrict',
      coordinates: { latitude: 49.9450, longitude: 36.1950 },
      averagePricePerSqm: 800,
      description: 'Промисловий район з доступним житлом'
    },
    {
      id: 'micro_kharkiv_pavlove_pole',
      name: 'Павлове Поле',
      type: 'microdistrict',
      coordinates: { latitude: 49.9600, longitude: 36.2450 },
      averagePricePerSqm: 1000,
      description: 'Район з сучасною забудовою та торговельними центрами'
    },
    {
      id: 'micro_kharkiv_sortuvannya',
      name: 'Сортування',
      type: 'microdistrict',
      coordinates: { latitude: 49.9700, longitude: 36.2600 },
      averagePricePerSqm: 900,
      description: 'Район біля залізничного вокзалу з транспортною доступністю'
    },
    {
      id: 'micro_kharkiv_levada',
      name: 'Левада',
      type: 'microdistrict',
      coordinates: { latitude: 49.9850, longitude: 36.2500 },
      averagePricePerSqm: 1050,
      description: 'Район з історичною забудовою та зеленими зонами'
    },
    {
      id: 'micro_kharkiv_zhukovskogo',
      name: 'Жуковського',
      type: 'microdistrict',
      coordinates: { latitude: 50.0150, longitude: 36.2350 },
      averagePricePerSqm: 1200,
      description: 'Район з науковими установами та житловою забудовою'
    },
    {
      id: 'micro_kharkiv_derzhprom',
      name: 'Держпром',
      type: 'microdistrict',
      coordinates: { latitude: 49.9900, longitude: 36.2350 },
      averagePricePerSqm: 1350,
      description: 'Центральний район з адміністративними будівлями'
    },
    // Додані нові мікрорайони Харкова
    {
      id: 'micro_kharkiv_aeroport',
      name: 'Аеропорт',
      type: 'microdistrict',
      coordinates: { latitude: 49.9244, longitude: 36.2900 },
      averagePricePerSqm: 850,
      description: 'Район біля аеропорту з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_artema',
      name: 'Артема',
      type: 'microdistrict',
      coordinates: { latitude: 49.9500, longitude: 36.2700 },
      averagePricePerSqm: 800,
      description: 'Житловий масив з панельною забудовою'
    },
    {
      id: 'micro_kharkiv_botsad',
      name: 'Ботсад',
      type: 'microdistrict',
      coordinates: { latitude: 50.0250, longitude: 36.2450 },
      averagePricePerSqm: 1100,
      description: 'Район з ботанічним садом та елітною забудовою'
    },
    {
      id: 'micro_kharkiv_balashivka',
      name: 'Балашівка',
      type: 'microdistrict',
      coordinates: { latitude: 49.9450, longitude: 36.3200 },
      averagePricePerSqm: 750,
      description: 'Промисловий район з доступним житлом'
    },
    {
      id: 'micro_kharkiv_goryzont',
      name: 'Горизонт',
      type: 'microdistrict',
      coordinates: { latitude: 50.0400, longitude: 36.3100 },
      averagePricePerSqm: 950,
      description: 'Район з сучасною забудовою та парками'
    },
    {
      id: 'micro_kharkiv_goncharivka',
      name: 'Гончарівка',
      type: 'microdistrict',
      coordinates: { latitude: 49.9600, longitude: 36.2350 },
      averagePricePerSqm: 1000,
      description: 'Історичний район з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_hryhorivka',
      name: 'Григорівка',
      type: 'microdistrict',
      coordinates: { latitude: 49.9300, longitude: 36.3000 },
      averagePricePerSqm: 700,
      description: 'Селище з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_dalna_zhuravlivka',
      name: 'Дальня Журавлівка',
      type: 'microdistrict',
      coordinates: { latitude: 49.9250, longitude: 36.2800 },
      averagePricePerSqm: 650,
      description: 'Селище з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_dacha_55',
      name: 'Дача №55',
      type: 'microdistrict',
      coordinates: { latitude: 50.0350, longitude: 36.2600 },
      averagePricePerSqm: 1200,
      description: 'Елітний район з котеджами'
    },
    {
      id: 'micro_kharkiv_dzherela',
      name: 'Джерела',
      type: 'microdistrict',
      coordinates: { latitude: 50.0200, longitude: 36.2800 },
      averagePricePerSqm: 1050,
      description: 'Район з джерелами та зеленими зонами'
    },
    {
      id: 'micro_kharkiv_zhuravlivka',
      name: 'Журавлівка',
      type: 'microdistrict',
      coordinates: { latitude: 49.9200, longitude: 36.2850 },
      averagePricePerSqm: 700,
      description: 'Селище з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_zalyutine',
      name: 'Залютине',
      type: 'microdistrict',
      coordinates: { latitude: 49.9050, longitude: 36.3150 },
      averagePricePerSqm: 600,
      description: 'Селище з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_zaikivka',
      name: 'Заїківка',
      type: 'microdistrict',
      coordinates: { latitude: 49.9150, longitude: 36.2950 },
      averagePricePerSqm: 650,
      description: 'Селище з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_ivanivka',
      name: 'Іванівка',
      type: 'microdistrict',
      coordinates: { latitude: 49.9350, longitude: 36.3250 },
      averagePricePerSqm: 700,
      description: 'Селище з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_lysa_gora',
      name: 'Лиса Гора',
      type: 'microdistrict',
      coordinates: { latitude: 49.9550, longitude: 36.3150 },
      averagePricePerSqm: 750,
      description: 'Район з пагорбом та приватною забудовою'
    },
    {
      id: 'micro_kharkiv_lazkovka',
      name: 'Лазьковка',
      type: 'microdistrict',
      coordinates: { latitude: 49.9400, longitude: 36.3050 },
      averagePricePerSqm: 680,
      description: 'Селище з приватною забудовою'
    },
    // Нумеровані мікрорайони
    {
      id: 'micro_kharkiv_5',
      name: '5-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0450, longitude: 36.2950 },
      averagePricePerSqm: 900,
      description: 'Житловий масив з панельною забудовою'
    },
    {
      id: 'micro_kharkiv_522',
      name: '522-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0500, longitude: 36.3000 },
      averagePricePerSqm: 850,
      description: 'Житловий масив на Салтівці'
    },
    {
      id: 'micro_kharkiv_339',
      name: '339-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0350, longitude: 36.2850 },
      averagePricePerSqm: 820,
      description: 'Житловий масив з панельною забудовою'
    },
    {
      id: 'micro_kharkiv_6',
      name: '6-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0400, longitude: 36.2900 },
      averagePricePerSqm: 880,
      description: 'Житловий масив з панельною забудовою'
    },
    {
      id: 'micro_kharkiv_521',
      name: '521-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0480, longitude: 36.2980 },
      averagePricePerSqm: 840,
      description: 'Житловий масив на Салтівці'
    },
    {
      id: 'micro_kharkiv_337',
      name: '337-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0330, longitude: 36.2830 },
      averagePricePerSqm: 810,
      description: 'Житловий масив з панельною забудовою'
    },
    {
      id: 'micro_kharkiv_moskalivka',
      name: 'Москалівка',
      type: 'microdistrict',
      coordinates: { latitude: 49.9400, longitude: 36.2400 },
      averagePricePerSqm: 780,
      description: 'Район з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_2',
      name: '2-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0380, longitude: 36.2880 },
      averagePricePerSqm: 870,
      description: 'Житловий масив з панельною забудовою'
    },
    {
      id: 'micro_kharkiv_1',
      name: '1-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0360, longitude: 36.2860 },
      averagePricePerSqm: 860,
      description: 'Житловий масив з панельною забудовою'
    },
    {
      id: 'micro_kharkiv_625',
      name: '625-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0520, longitude: 36.3020 },
      averagePricePerSqm: 830,
      description: 'Житловий масив на Салтівці'
    },
    {
      id: 'micro_kharkiv_mzhk_internatsionalist',
      name: 'МЖК Інтернаціоналіст',
      type: 'microdistrict',
      coordinates: { latitude: 50.0550, longitude: 36.3050 },
      averagePricePerSqm: 800,
      description: 'Житловий комплекс з панельною забудовою'
    },
    {
      id: 'micro_kharkiv_626',
      name: '626-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0540, longitude: 36.3040 },
      averagePricePerSqm: 820,
      description: 'Житловий масив на Салтівці'
    },
    {
      id: 'micro_kharkiv_624',
      name: '624-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0510, longitude: 36.3010 },
      averagePricePerSqm: 840,
      description: 'Житловий масив на Салтівці'
    },
    {
      id: 'micro_kharkiv_603',
      name: '603-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0320, longitude: 36.2810 },
      averagePricePerSqm: 800,
      description: 'Житловий масив з панельною забудовою'
    },
    {
      id: 'micro_kharkiv_608',
      name: '608-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0370, longitude: 36.2860 },
      averagePricePerSqm: 810,
      description: 'Житловий масив з панельною забудовою'
    },
    {
      id: 'micro_kharkiv_520',
      name: '520-й мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0460, longitude: 36.2960 },
      averagePricePerSqm: 850,
      description: 'Житловий масив на Салтівці'
    },
    {
      id: 'micro_kharkiv_604',
      name: '604-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0340, longitude: 36.2830 },
      averagePricePerSqm: 790,
      description: 'Житловий масив з панельною забудовою'
    },
    {
      id: 'micro_kharkiv_759',
      name: '759-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0580, longitude: 36.3080 },
      averagePricePerSqm: 780,
      description: 'Житловий масив на Салтівці'
    },
    {
      id: 'micro_kharkiv_524',
      name: '524-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0500, longitude: 36.3000 },
      averagePricePerSqm: 860,
      description: 'Житловий масив на Салтівці'
    },
    {
      id: 'micro_kharkiv_602',
      name: '602-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0300, longitude: 36.2790 },
      averagePricePerSqm: 810,
      description: 'Житловий масив з панельною забудовою'
    },
    {
      id: 'micro_kharkiv_335',
      name: '335-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0310, longitude: 36.2810 },
      averagePricePerSqm: 820,
      description: 'Житловий масив з панельною забудовою'
    },
    {
      id: 'micro_kharkiv_sonyachny',
      name: 'Сонячний (761 мікрорайон)',
      type: 'microdistrict',
      coordinates: { latitude: 50.0600, longitude: 36.3100 },
      averagePricePerSqm: 770,
      description: 'Житловий масив на Салтівці'
    },
    {
      id: 'micro_kharkiv_531',
      name: '531-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0520, longitude: 36.3020 },
      averagePricePerSqm: 840,
      description: 'Житловий масив на Салтівці'
    },
    {
      id: 'micro_kharkiv_605',
      name: '605-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0360, longitude: 36.2850 },
      averagePricePerSqm: 800,
      description: 'Житловий масив з панельною забудовою'
    },
    {
      id: 'micro_kharkiv_607',
      name: '607-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0350, longitude: 36.2840 },
      averagePricePerSqm: 815,
      description: 'Житловий масив з панельною забудовою'
    },
    {
      id: 'micro_kharkiv_627',
      name: '627-ий мікрорайон',
      type: 'microdistrict',
      coordinates: { latitude: 50.0560, longitude: 36.3060 },
      averagePricePerSqm: 810,
      description: 'Житловий масив на Салтівці'
    },
    {
      id: 'micro_kharkiv_nagirny',
      name: 'Нагірний (Київський)',
      type: 'microdistrict',
      coordinates: { latitude: 50.0200, longitude: 36.3400 },
      averagePricePerSqm: 1250,
      description: 'Престижний район з новобудовами'
    },
    {
      id: 'micro_kharkiv_novi_doma',
      name: 'Нові Дома',
      type: 'microdistrict',
      coordinates: { latitude: 49.9250, longitude: 36.2750 },
      averagePricePerSqm: 720,
      description: 'Селище з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_novoselivka',
      name: 'Новоселівка',
      type: 'microdistrict',
      coordinates: { latitude: 49.9350, longitude: 36.2650 },
      averagePricePerSqm: 700,
      description: 'Селище з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_novozhanovo',
      name: 'Новожаново',
      type: 'microdistrict',
      coordinates: { latitude: 49.9450, longitude: 36.2550 },
      averagePricePerSqm: 680,
      description: 'Селище з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_odeska',
      name: 'Одеська',
      type: 'microdistrict',
      coordinates: { latitude: 49.9550, longitude: 36.2750 },
      averagePricePerSqm: 850,
      description: 'Район з транспортною доступністю'
    },
    {
      id: 'micro_kharkiv_osnova',
      name: 'Основа',
      type: 'microdistrict',
      coordinates: { latitude: 49.9400, longitude: 36.2950 },
      averagePricePerSqm: 750,
      description: 'Промисловий район з доступним житлом'
    },
    {
      id: 'micro_kharkiv_pivnichna_saltivka',
      name: 'Північна Салтівка',
      type: 'microdistrict',
      coordinates: { latitude: 50.0550, longitude: 36.3100 },
      averagePricePerSqm: 800,
      description: 'Північна частина Салтівки'
    },
    {
      id: 'micro_kharkiv_pavlivka',
      name: 'Павлівка',
      type: 'microdistrict',
      coordinates: { latitude: 49.9200, longitude: 36.2700 },
      averagePricePerSqm: 650,
      description: 'Селище з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_pisky',
      name: 'Піски',
      type: 'microdistrict',
      coordinates: { latitude: 49.9150, longitude: 36.2900 },
      averagePricePerSqm: 620,
      description: 'Селище з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_panasivka',
      name: 'Панасівка',
      type: 'microdistrict',
      coordinates: { latitude: 49.9300, longitude: 36.3100 },
      averagePricePerSqm: 680,
      description: 'Селище з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_pyatyhatky',
      name: 'П\'ятихатки',
      type: 'microdistrict',
      coordinates: { latitude: 49.9250, longitude: 36.3000 },
      averagePricePerSqm: 640,
      description: 'Селище з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_rubanivka',
      name: 'Рубанівка',
      type: 'microdistrict',
      coordinates: { latitude: 49.9100, longitude: 36.2850 },
      averagePricePerSqm: 600,
      description: 'Селище з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_rohansky',
      name: 'Роганський',
      type: 'microdistrict',
      coordinates: { latitude: 49.9050, longitude: 36.3050 },
      averagePricePerSqm: 580,
      description: 'Селище з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_sokilnyky',
      name: 'Сокільники',
      type: 'microdistrict',
      coordinates: { latitude: 50.0150, longitude: 36.2550 },
      averagePricePerSqm: 1150,
      description: 'Район з котеджами та зеленими зонами'
    },
    {
      id: 'micro_kharkiv_skhidny',
      name: 'Східний',
      type: 'microdistrict',
      coordinates: { latitude: 49.9650, longitude: 36.3300 },
      averagePricePerSqm: 950,
      description: 'Східний район з новобудовами'
    },
    {
      id: 'micro_kharkiv_sosnova_girka',
      name: 'Соснова Гірка',
      type: 'microdistrict',
      coordinates: { latitude: 50.0250, longitude: 36.2500 },
      averagePricePerSqm: 1200,
      description: 'Елітний район з котеджами'
    },
    {
      id: 'micro_kharkiv_selyshche_zhukovskogo',
      name: 'Селище Жуковського',
      type: 'microdistrict',
      coordinates: { latitude: 50.0200, longitude: 36.2400 },
      averagePricePerSqm: 1100,
      description: 'Селище з науковими установами'
    },
    {
      id: 'micro_kharkiv_kholodna_gora',
      name: 'Холодна Гора',
      type: 'microdistrict',
      coordinates: { latitude: 50.0100, longitude: 36.2050 },
      averagePricePerSqm: 950,
      description: 'Район з приватною забудовою та промисловими підприємствами'
    },
    {
      id: 'micro_kharkiv_khtz',
      name: 'ХТЗ',
      type: 'microdistrict',
      coordinates: { latitude: 49.9450, longitude: 36.3150 },
      averagePricePerSqm: 720,
      description: 'Район Харківського тракторного заводу'
    },
    {
      id: 'micro_kharkiv_chervony_promin',
      name: 'Червоний промінь',
      type: 'microdistrict',
      coordinates: { latitude: 49.9550, longitude: 36.3050 },
      averagePricePerSqm: 780,
      description: 'Район з панельною забудовою'
    },
    {
      id: 'micro_kharkiv_shatylivka',
      name: 'Шатилівка',
      type: 'microdistrict',
      coordinates: { latitude: 49.9250, longitude: 36.2600 },
      averagePricePerSqm: 680,
      description: 'Селище з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_shyshkovka',
      name: 'Шишковка',
      type: 'microdistrict',
      coordinates: { latitude: 49.9350, longitude: 36.2700 },
      averagePricePerSqm: 700,
      description: 'Селище з приватною забудовою'
    },
    {
      id: 'micro_kharkiv_shevchenky',
      name: 'Шевченки',
      type: 'microdistrict',
      coordinates: { latitude: 49.9450, longitude: 36.2800 },
      averagePricePerSqm: 720,
      description: 'Селище з приватною забудовою'
    },
  ]
};

// Допоміжні функції для роботи з геоданими Харкова
export const getKharkivCity = (): City => {
  return KHARKIV_CITY;
};

export const getDistrictById = (districtId: string): District | undefined => {
  return KHARKIV_CITY.districts.find(district => district.id === districtId);
};

export const getAllDistricts = (): string[] => {
  return KHARKIV_CITY.districts.map(d => d.name);
};

export const getDistrictsForKharkiv = (): string[] => {
  return getAllDistricts();
};

export const getKharkivCoordinates = () => {
  return KHARKIV_CITY.coordinates;
};

export const getDistrictCoordinates = (districtName: string) => {
  const district = KHARKIV_CITY.districts.find(d => d.name === districtName);
  return district?.coordinates;
};

// Сумісність з старим API
export const getAllCities = (): string[] => {
  return [KHARKIV_CITY.name];
};

export const getDistrictsForCity = (cityName: string): string[] => {
  if (cityName.toLowerCase() === 'харків') {
    return getAllDistricts();
  }
  return [];
};

export const getCityCoordinates = (cityName: string) => {
  if (cityName.toLowerCase() === 'харків') {
    return KHARKIV_CITY.coordinates;
  }
  return null;
};
