import type { DayKey, Macros, MealKey, WeeklyDiet } from './types';

export const DAYS: DayKey[] = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo'
];

export const MEALS: MealKey[] = ['desayuno', 'm_manana', 'comida', 'cena'];

export const DAY_LABELS: Record<DayKey, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo'
};

export const MEAL_LABELS: Record<MealKey, string> = {
  desayuno: 'Desayuno',
  m_manana: 'Media Mañana',
  comida: 'Comida',
  cena: 'Cena'
};

export const MACRO_TARGETS: Record<MealKey, Macros> = {
  desayuno: { kcal: 495, protein: 30, carbs: 60, fat: 15 },
  m_manana: { kcal: 310, protein: 20, carbs: 35, fat: 10 },
  comida: { kcal: 640, protein: 50, carbs: 65, fat: 20 },
  cena: { kcal: 455, protein: 40, carbs: 40, fat: 15 }
};

export const DAILY_TARGETS = { kcal: 1900, protein: 140, carbs: 200, fat: 60 };

const D = MACRO_TARGETS.desayuno;
const MM = MACRO_TARGETS.m_manana;
const C = MACRO_TARGETS.comida;
const CE = MACRO_TARGETS.cena;

export const WEEKLY_DIET: WeeklyDiet = {
  lunes: {
    desayuno: [
      {
        name: 'Tortilla con tostadas',
        items: [
          'Tortilla de 2 huevos + 4 claras',
          'Pan integral tostado 90 g',
          'Tomate rallado 100 g',
          'AOVE 5 g',
          'Kiwi 1 ud (100 g)'
        ],
        macros: D
      },
      {
        name: 'Yogur griego con tortitas',
        items: [
          'Yogur griego natural 0% 250 g',
          'Tortitas de arroz 4 ud',
          'Plátano 120 g',
          'Almendras 12 g'
        ],
        macros: D
      }
    ],
    m_manana: [
      {
        name: 'Atún con tortitas',
        items: ['Atún al natural 80 g escurrido', 'Tortitas de arroz 3 ud', 'Nueces 10 g'],
        macros: MM
      },
      {
        name: 'Yogur con manzana',
        items: [
          'Yogur griego 0% 170 g',
          'Manzana 150 g',
          'Almendras 15 g',
          'Tortita de arroz 1 ud'
        ],
        macros: MM
      }
    ],
    comida: [
      {
        name: 'Pollo con arroz basmati',
        items: [
          'Pechuga de pollo a la plancha 180 g',
          'Arroz basmati 75 g (en seco)',
          'Puré de calabacín 250 g',
          'AOVE 10 g'
        ],
        macros: C
      },
      {
        name: 'Ternera magra con patata',
        items: [
          'Ternera magra a la plancha 170 g',
          'Patata cocida 300 g',
          'Puré de calabacín 250 g',
          'AOVE 8 g'
        ],
        macros: C
      }
    ],
    cena: [
      {
        name: 'Merluza al horno',
        items: [
          'Merluza al horno 220 g',
          'Patata asada 180 g',
          'Puré de calabacín 250 g',
          'AOVE 8 g'
        ],
        macros: CE
      },
      {
        name: 'Tortilla con pan integral',
        items: [
          'Tortilla de 2 huevos + 4 claras',
          'Pan integral 60 g',
          'Puré de calabacín 250 g'
        ],
        macros: CE
      }
    ]
  },
  martes: {
    desayuno: [
      {
        name: 'Revuelto con pavo',
        items: [
          'Revuelto de 1 huevo + 5 claras',
          'Fiambre de pavo 60 g',
          'Pan integral 90 g',
          'Naranja 1 ud (180 g)'
        ],
        macros: D
      },
      {
        name: 'Queso batido con cereales de maíz',
        items: [
          'Queso fresco batido 0% 250 g',
          'Copos de maíz sin azúcar 50 g',
          'Fresas 150 g',
          'Nueces 12 g'
        ],
        macros: D
      }
    ],
    m_manana: [
      {
        name: 'Mini bocadillo de pavo',
        items: ['Pan integral 60 g', 'Fiambre de pavo 80 g', 'Tomate en rodajas 80 g', 'Nueces 8 g'],
        macros: MM
      },
      {
        name: 'Huevos duros con fruta',
        items: ['Huevos duros 2 ud', 'Tortitas de arroz 3 ud', 'Manzana 120 g'],
        macros: MM
      }
    ],
    comida: [
      {
        name: 'Ternera con pasta integral',
        items: [
          'Ternera magra a la plancha 170 g',
          'Pasta integral 70 g (en seco)',
          'Puré de calabacín 250 g',
          'AOVE 8 g'
        ],
        macros: C
      },
      {
        name: 'Pavo con arroz',
        items: [
          'Pechuga de pavo a la plancha 190 g',
          'Arroz blanco 75 g (en seco)',
          'Puré de calabacín 250 g',
          'AOVE 10 g'
        ],
        macros: C
      }
    ],
    cena: [
      {
        name: 'Bacalao con patata',
        items: [
          'Lomo de bacalao 230 g',
          'Patata cocida 180 g',
          'Puré de calabacín 250 g',
          'AOVE 8 g'
        ],
        macros: CE
      },
      {
        name: 'Sepia a la plancha',
        items: [
          'Sepia a la plancha 250 g',
          'Pan integral 60 g',
          'Puré de calabacín 250 g',
          'AOVE 10 g'
        ],
        macros: CE
      }
    ]
  },
  miercoles: {
    desayuno: [
      {
        name: 'Tostadas con queso batido y pavo',
        items: [
          'Pan integral 90 g',
          'Queso fresco batido 0% 100 g',
          'Fiambre de pavo 60 g',
          'AOVE 8 g',
          'Pera 1 ud (150 g)'
        ],
        macros: D
      },
      {
        name: 'Tortitas con requesón',
        items: [
          'Tortitas de arroz 4 ud',
          'Requesón desnatado 150 g',
          'Plátano 120 g',
          'Almendras 10 g'
        ],
        macros: D
      }
    ],
    m_manana: [
      {
        name: 'Atún con pan',
        items: ['Atún al natural 80 g escurrido', 'Pan integral 50 g', 'Tomate 100 g', 'Nueces 8 g'],
        macros: MM
      },
      {
        name: 'Yogur con uvas',
        items: ['Yogur griego 0% 170 g', 'Uvas 120 g', 'Nueces 12 g', 'Tortita de arroz 1 ud'],
        macros: MM
      }
    ],
    comida: [
      {
        name: 'Pollo con patata asada',
        items: [
          'Pechuga de pollo a la plancha 180 g',
          'Patata asada 320 g',
          'Puré de calabacín 250 g',
          'AOVE 10 g'
        ],
        macros: C
      },
      {
        name: 'Atún fresco con arroz',
        items: [
          'Atún fresco a la plancha 170 g',
          'Arroz blanco 75 g (en seco)',
          'Puré de calabacín 250 g',
          'AOVE 8 g'
        ],
        macros: C
      }
    ],
    cena: [
      {
        name: 'Lubina al horno',
        items: [
          'Lubina al horno 230 g',
          'Patata cocida 170 g',
          'Puré de calabacín 250 g',
          'AOVE 6 g'
        ],
        macros: CE
      },
      {
        name: 'Pollo con arroz',
        items: [
          'Pechuga de pollo 150 g',
          'Arroz blanco 50 g (en seco)',
          'Puré de calabacín 250 g',
          'AOVE 6 g'
        ],
        macros: CE
      }
    ]
  },
  jueves: {
    desayuno: [
      {
        name: 'Tortilla de claras con pan',
        items: [
          'Tortilla de 1 huevo + 5 claras',
          'Pan integral 90 g',
          'Tomate rallado 100 g',
          'AOVE 6 g',
          'Mandarinas 2 ud'
        ],
        macros: D
      },
      {
        name: 'Yogur griego con kiwi',
        items: [
          'Yogur griego natural 0% 250 g',
          'Tortitas de maíz 4 ud',
          'Kiwi 2 ud',
          'Almendras 12 g'
        ],
        macros: D
      }
    ],
    m_manana: [
      {
        name: 'Queso batido con manzana',
        items: ['Queso fresco batido 0% 200 g', 'Manzana 150 g', 'Nueces 10 g', 'Tortita de arroz 1 ud'],
        macros: MM
      },
      {
        name: 'Bocadillo de atún',
        items: ['Pan integral 60 g', 'Atún al natural 60 g', 'Tomate 80 g', 'Almendras 8 g'],
        macros: MM
      }
    ],
    comida: [
      {
        name: 'Pavo con pasta',
        items: [
          'Pechuga de pavo a la plancha 190 g',
          'Pasta 70 g (en seco)',
          'Puré de calabacín 250 g',
          'AOVE 10 g'
        ],
        macros: C
      },
      {
        name: 'Pollo con patata cocida',
        items: [
          'Pechuga de pollo 180 g',
          'Patata cocida 320 g',
          'Puré de calabacín 250 g',
          'AOVE 10 g'
        ],
        macros: C
      }
    ],
    cena: [
      {
        name: 'Merluza con pan',
        items: [
          'Merluza a la plancha 220 g',
          'Pan integral 60 g',
          'Puré de calabacín 250 g',
          'AOVE 8 g'
        ],
        macros: CE
      },
      {
        name: 'Revuelto de gambas',
        items: [
          'Gambas peladas 200 g',
          'Huevo 1 ud',
          'Patata cocida 170 g',
          'Puré de calabacín 250 g',
          'AOVE 6 g'
        ],
        macros: CE
      }
    ]
  },
  viernes: {
    desayuno: [
      {
        name: 'Bocadillo de pavo y queso',
        items: [
          'Pan integral 100 g',
          'Fiambre de pavo 90 g',
          'Queso fresco batido 0% 80 g',
          'AOVE 6 g',
          'Naranja 1 ud'
        ],
        macros: D
      },
      {
        name: 'Requesón con cereales de maíz',
        items: [
          'Requesón desnatado 200 g',
          'Copos de maíz sin azúcar 45 g',
          'Fresas 150 g',
          'Nueces 12 g'
        ],
        macros: D
      }
    ],
    m_manana: [
      {
        name: 'Huevos duros con tortitas',
        items: ['Huevos duros 2 ud', 'Tortitas de arroz 2 ud', 'Pera 130 g'],
        macros: MM
      },
      {
        name: 'Atún con almendras',
        items: ['Atún al natural 80 g escurrido', 'Tortitas de arroz 3 ud', 'Almendras 10 g'],
        macros: MM
      }
    ],
    comida: [
      {
        name: 'Ternera con arroz',
        items: [
          'Ternera magra a la plancha 170 g',
          'Arroz blanco 75 g (en seco)',
          'Puré de calabacín 250 g',
          'AOVE 8 g'
        ],
        macros: C
      },
      {
        name: 'Salmón con patata',
        items: [
          'Salmón a la plancha 140 g',
          'Patata cocida 300 g',
          'Puré de calabacín 250 g'
        ],
        macros: C
      }
    ],
    cena: [
      {
        name: 'Bacalao al horno',
        items: [
          'Lomo de bacalao 230 g',
          'Patata asada 180 g',
          'Puré de calabacín 250 g',
          'AOVE 8 g'
        ],
        macros: CE
      },
      {
        name: 'Tortilla con pan',
        items: [
          'Tortilla de 2 huevos + 4 claras',
          'Pan integral 60 g',
          'Puré de calabacín 250 g'
        ],
        macros: CE
      }
    ]
  },
  sabado: {
    desayuno: [
      {
        name: 'Tortitas con pavo y queso',
        items: [
          'Tortitas de arroz 5 ud',
          'Fiambre de pavo 80 g',
          'Queso fresco batido 0% 120 g',
          'Almendras 12 g',
          'Manzana 120 g'
        ],
        macros: D
      },
      {
        name: 'Tostadas con tomate y jamón',
        items: [
          'Pan integral 90 g',
          'Jamón serrano sin grasa visible 50 g',
          'Tomate rallado 100 g',
          'AOVE 8 g',
          'Yogur griego 0% 125 g'
        ],
        macros: D
      }
    ],
    m_manana: [
      {
        name: 'Yogur con fruta y nueces',
        items: ['Yogur griego 0% 170 g', 'Plátano 100 g', 'Nueces 12 g'],
        macros: MM
      },
      {
        name: 'Pavo con pan y tomate',
        items: ['Fiambre de pavo 80 g', 'Pan integral 60 g', 'Tomate 80 g', 'Nueces 8 g'],
        macros: MM
      }
    ],
    comida: [
      {
        name: 'Arroz con pollo y sepia',
        items: [
          'Arroz 75 g (en seco)',
          'Pechuga de pollo 120 g',
          'Sepia 120 g',
          'Puré de calabacín 250 g',
          'AOVE 10 g'
        ],
        macros: C
      },
      {
        name: 'Ternera con pasta',
        items: [
          'Ternera magra a la plancha 170 g',
          'Pasta 70 g (en seco)',
          'Puré de calabacín 250 g',
          'AOVE 8 g'
        ],
        macros: C
      }
    ],
    cena: [
      {
        name: 'Dorada al horno',
        items: [
          'Dorada al horno 230 g',
          'Patata asada 170 g',
          'Puré de calabacín 250 g',
          'AOVE 6 g'
        ],
        macros: CE
      },
      {
        name: 'Pollo con arroz',
        items: [
          'Pechuga de pollo 150 g',
          'Arroz blanco 50 g (en seco)',
          'Puré de calabacín 250 g',
          'AOVE 6 g'
        ],
        macros: CE
      }
    ]
  },
  domingo: {
    desayuno: [
      {
        name: 'Tortilla francesa con pan',
        items: [
          'Tortilla de 2 huevos + 4 claras',
          'Pan integral 90 g',
          'Tomate rallado 100 g',
          'AOVE 5 g',
          'Fresas 150 g'
        ],
        macros: D
      },
      {
        name: 'Queso batido con cereales',
        items: [
          'Queso fresco batido 0% 250 g',
          'Copos de maíz sin azúcar 50 g',
          'Plátano 100 g',
          'Almendras 10 g'
        ],
        macros: D
      }
    ],
    m_manana: [
      {
        name: 'Atún con tortitas y nueces',
        items: ['Atún al natural 80 g escurrido', 'Tortitas de arroz 3 ud', 'Nueces 10 g'],
        macros: MM
      },
      {
        name: 'Huevos duros con manzana',
        items: ['Huevos duros 2 ud', 'Tortitas de arroz 3 ud', 'Manzana 120 g'],
        macros: MM
      }
    ],
    comida: [
      {
        name: 'Pollo asado con arroz',
        items: [
          'Pollo asado sin piel 180 g',
          'Arroz blanco 75 g (en seco)',
          'Puré de calabacín 250 g',
          'AOVE 10 g'
        ],
        macros: C
      },
      {
        name: 'Ternera con patata',
        items: [
          'Ternera magra a la plancha 170 g',
          'Patata asada 320 g',
          'Puré de calabacín 250 g',
          'AOVE 8 g'
        ],
        macros: C
      }
    ],
    cena: [
      {
        name: 'Merluza en salsa verde ligera',
        items: [
          'Merluza 220 g en salsa verde (sin harina)',
          'Patata cocida 180 g',
          'Puré de calabacín 250 g',
          'AOVE 8 g'
        ],
        macros: CE
      },
      {
        name: 'Gambas y sepia a la plancha',
        items: [
          'Gambas peladas 150 g',
          'Sepia 150 g',
          'Pan integral 60 g',
          'Puré de calabacín 250 g',
          'AOVE 8 g'
        ],
        macros: CE
      }
    ]
  }
};
