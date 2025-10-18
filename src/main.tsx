import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';
import { CLERK_PUBLISHABLE_KEY } from './lib/clerk';
import { isLocalMode } from './lib/local-mode';

const localMode = isLocalMode();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {localMode ? (
      <App />
    ) : (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    )}
  </StrictMode>
);
