import { startPage } from './lib/app-startup.js';

await startPage(() => import('./yield-inspect-main.js'));
