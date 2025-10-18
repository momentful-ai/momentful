export const isLocalMode = () => {
  return import.meta.env.VITE_LOCAL_MODE === 'true';
};

export const LOCAL_DEV_USER_ID = 'local-dev-user';
