// config/features.ts
export const FEATURES = {
  USE_V2_CANVAS: import.meta.env.VITE_USE_V2_CANVAS === 'true',
  USE_INTERACTION_SM: import.meta.env.VITE_STATE_MACHINE === 'true',
  USE_NEW_PROPS: import.meta.env.VITE_NEW_PROPERTIES === 'true',
};
