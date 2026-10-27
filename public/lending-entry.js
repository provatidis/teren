import { startPage } from './lib/app-startup.js';
await startPage(() => import('./lending-main.js'));
