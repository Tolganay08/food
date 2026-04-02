import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { LanguageProvider } from './i18n/LanguageContext';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#1F2933',
                borderRadius: '16px',
                border: '1px solid rgba(31,41,51,0.05)',
                padding: '12px 16px',
                fontFamily: '"DM Sans", sans-serif',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
              },
              success: { iconTheme: { primary: '#2EC4B6', secondary: '#fff' } },
              error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
            }}
          />
        </LanguageProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
