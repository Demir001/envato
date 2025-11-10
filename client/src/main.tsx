import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Helmet, HelmetProvider } from 'react-helmet-async';

import App from './App';
import './styles/globals.css';

// i18n (Uluslararasılaştırma)
import './locales/i18n';

// React Query istemcisini (client) oluştur
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 dakika
      retry: 1, // Hatalı sorguları 1 kez yeniden dene
      refetchOnWindowFocus: false, // Pencere odağıyla yeniden çekmeyi kapat
    },
  },
});

// Kök DOM öğesini bul (index.html'deki <div id="root">)
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    "Root element with ID 'root' not found in the DOM. Did you forget to add it to index.html?",
  );
}

// React Kök (Root) oluştur ve uygulamayı render et
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HelmetProvider>
      {/* HelmetProvider, React Helmet Async'in çalışması için gereklidir.
        Bu, sayfa başlıklarını (title) ve meta etiketlerini yönetmemizi sağlar.
      */}
      <Helmet>
        {/* Varsayılan sayfa başlığı */}
        <title>ClinicAdmin</title>
        <meta
          name="description"
          content="Küçük Klinik Yönetim Paneli - ClinicAdmin Dashboard"
        />
      </Helmet>

      {/* QueryClientProvider, React Query'yi tüm uygulama bileşenlerine 
        erişilebilir kılar.
      */}
      <QueryClientProvider client={queryClient}>
        {/* BrowserRouter, HTML5 history API'sini kullanarak 
          sayfa yönlendirmesini (routing) sağlar.
        */}
        <BrowserRouter>
          <App />
        </BrowserRouter>

        {/* ReactQueryDevtools, sadece geliştirme ortamında çalışan 
          ve sorguları incelemeyi sağlayan bir araçtır.
        */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
);