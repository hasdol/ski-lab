/**
 * A single place to resolve the URL of your Cloud Function / Cloud Run
 * weather proxy.  Every component should import `WEATHER_ENDPOINT`
 * instead of hard‑coding anything.
 */

const PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ski-lab-dev';

const REGION = 'europe-north1';

const CF_URL = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/weatherForecast`;

/**
 * If you later move the proxy to Cloud Run you can expose
 * the Run URL through the NEXT_PUBLIC_WEATHER_PROXY_URL env‑var
 * and nothing else changes in the code‑base.
 */
export const WEATHER_ENDPOINT =
  process.env.NEXT_PUBLIC_WEATHER_PROXY_URL || CF_URL;
