/**
 * App Parameters — simplified (no longer depends on Base44)
 * Token is managed by src/api/client.js via localStorage key 'af_token'
 */

export const appParams = {
  appId: null, // No longer needed
  token: localStorage.getItem('af_token'),
  appBaseUrl: '',
};
