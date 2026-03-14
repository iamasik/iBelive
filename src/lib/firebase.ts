// Re-export Firebase instances that are configured via environment variables.
// The actual configuration (apiKey, authDomain, etc.) lives in `src/config/firebase.ts`
// and uses `import.meta.env.VITE_*` values so that all credentials can be provided
// via environment variables (e.g. in Vercel project settings).

export { auth, db } from '../config/firebase';
