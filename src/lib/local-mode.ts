export const isLocalhost = () => {
  if (typeof window === 'undefined') return false;
  return ['localhost','127.0.0.1','::1'].includes(window.location.hostname);
};

export const getLocalOverride = (k: string) => {
  if (typeof localStorage === 'undefined') return undefined;
  return localStorage.getItem(k) || undefined;
};

export const isLocalBypassEnabled = () => {
  const override = getLocalOverride('DEV_AUTH_MODE'); // 'clerk' | 'bypass'
  if (override) return override === 'bypass' && isLocalhost();
  return import.meta.env.VITE_LOCAL_MODE === 'true' && isLocalhost();
};

export const getLocalDevUserId = () => import.meta.env.VITE_LOCAL_USER_ID || LOCAL_DEV_USER_ID;

export const isLocalMode = () => {
  return import.meta.env.VITE_LOCAL_MODE === 'true';
};

export const LOCAL_DEV_USER_ID = 'local-dev-user';
