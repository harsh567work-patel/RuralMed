import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { PowerSyncProvider } from './db/setup';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PowerSyncProvider>
      <App />
    </PowerSyncProvider>
  </StrictMode>
);
