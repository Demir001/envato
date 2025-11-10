/* eslint-env node */

/** @type {import('jest').Config} */
const config = {
  // --- Ortam (Environment) ---
  // Tarayıcı benzeri bir ortam (JSDOM) sağlar
  testEnvironment: 'jest-environment-jsdom',

  // --- Kök Dizin ---
  // Testlerin ve modüllerin aranacağı yer
  rootDir: '.',

  // --- Dönüştürücüler (Transformers) ---
  // TypeScript (.ts, .tsx) dosyalarını 'ts-jest' ile JavaScript'e dönüştür
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        // 'tsconfig.json'u okumasını sağlar
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },

  // --- Modül Çözümleme (Module Resolution) ---
  // 'src/components/ui/button' yerine '@/components/ui/button'
  // (tsconfig.json 'paths' ile aynı)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // CSS, SCSS, Resim dosyalarını 'mock'la (jest-transform-stub)
    '\\.(css|less|sass|scss)$': 'jest-transform-stub',
    '\\.(gif|ttf|eot|svg|png|jpg)$': 'jest-transform-stub',
  },

  // --- Test Kurulumu (Setup) ---
  // Her test çalıştırılmadan *önce* bu dosya çalıştırılır
  // (örn. 'jest-dom'u import etmek, 'fetch'i mock'lamak için)
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // --- Test Dosyası Eşleştirme ---
  // Hangi dosyaların test olduğunu belirler
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.test.tsx',
  ],

  // --- Kod Kapsamı (Code Coverage) ---
  // (Opsiyonel, ama iyi bir pratiktir)
  // collectCoverage: true,
  // coverageDirectory: 'coverage',
  // coverageProvider: 'v8',
};

module.exports = config;