import { startPage } from './lib/app-startup.js';
await startPage(() => import('./home-main.js'));
