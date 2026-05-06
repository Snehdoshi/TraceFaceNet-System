import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sqliteDbPath = path.resolve(__dirname, '..', 'research-analyzer.sqlite');
