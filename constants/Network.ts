/**
 * Global Network Configuration for G!Track-Mobile
 * Centralized IP management for connecting to the Admin Team's Laravel backend.
 */

// REPLACE with the Admin Team's laptop IP address (e.g., '192.168.0.108')
export const ADMIN_LAPTOP_IP = '192.168.0.108';


// THE PORT Laravel uses (usually 8000)
export const LARAVEL_PORT = '8007';
export const API_BASE_URL = `http://${ADMIN_LAPTOP_IP}:${LARAVEL_PORT}/api`;
export const API_TIMEOUT = 8000;

/**
 * MODE TOGGLE
 * Set to 'true' for real API connection.
 */
export const USE_REAL_API = true;

/**
 * ⚠️  CLEARTEXT SECURITY TOGGLE (DEVELOPMENT ONLY)
 * 
 * Set to 'false' to disable HTTP (unencrypted) connections to dev backend.
 * This is a SAFETY MEASURE in case the network security config causes issues.
 * 
 * When true: Dev build allows HTTP to 192.168.0.108:8007 (matches Expo Go behavior)
 * When false: Requires HTTPS (proper security, but dev backend must support it)
 * 
 * ⚠️  PRODUCTION: This toggle has NO EFFECT in production builds.
 * For production, always use HTTPS and remove the networkSecurityConfig plugin from app.json
 * 
 * HOW TO REVERT IF SOMETHING GOES WRONG:
 * 1. Set ENABLE_CLEARTEXT_DEV = false here
 * 2. Remove this from app.json plugins:
 *    [
 *      "expo-build-properties",
 *      { "android": { "networkSecurityConfig": "@xml/network_security_config" } }
 *    ]
 * 3. Delete: android/app/src/main/res/xml/network_security_config.xml
 * 4. Rebuild: eas build --platform android --profile preview --clear-cache
 */
export const ENABLE_CLEARTEXT_DEV = true; 