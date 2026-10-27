import { startPage } from './lib/app-startup.js';
await startPage(() => import('./learn-main.js'));
