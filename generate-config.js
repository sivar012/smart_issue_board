const fs = require('fs');
const path = require('path');

// Load .env file manually (minimal dotenv implementation)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split(/\r?\n/).forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1'); // Remove quotes if present
            process.env[key] = value;
        }
    });
    console.log("Loaded environment variables from .env");
}

const configPath = path.join(__dirname, 'js/config.js');

const configContent = `export const firebaseConfig = {
    apiKey: "${process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || ''}",
    authDomain: "${process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || ''}",
    projectId: "${process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || ''}",
    storageBucket: "${process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || ''}",
    messagingSenderId: "${process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || ''}",
    appId: "${process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || ''}"
};`;

// Only generate if env vars are present (prevents overwriting local config with empty strings in dev if script is run accidentally)
// Generate if running on Vercel OR if we successfully loaded a local .env file
// Note: Vercel defaults outputDirectory to 'public' if not specified, but we are using root.
if (process.env.VERCEL || fs.existsSync(envPath)) {
    fs.writeFileSync(configPath, configContent);
    console.log("Generated js/config.js from environment variables.");
} else {
    console.log("No .env file found and not running in Vercel. Skipping config generation.");
}
