import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import { CLERK_PUBLISHABLE_KEY } from './lib/clerk';
import './index.css';

const isClerkConfigured = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY &&
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY !== 'your_clerk_publishable_key_here';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isClerkConfigured ? (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>
);
