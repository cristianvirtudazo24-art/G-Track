/**
 * Global Network Configuration for G!Track-Mobile
 * Centralized IP management for connecting to the Admin Team's Laravel backend.
 */

// REPLACE with the Admin Team's laptop IP address (e.g., '192.168.1.XX')
export const ADMIN_LAPTOP_IP = '192.168.110.53'; 

// THE PORT Laravel uses (usually 8000)
export const LARAVEL_PORT = '8007';

// CONSTRUCT the full API URL
export const API_BASE_URL = `http://${ADMIN_LAPTOP_IP}:${LARAVEL_PORT}/api`;

// TIMEOUT (ms) - If the server doesn't respond in 8 seconds, fail gracefully.
export const API_TIMEOUT = 8000;

/**
 * MODE TOGGLE
 * Set to 'true' for real API connection.
 */
export const USE_REAL_API = true; 
