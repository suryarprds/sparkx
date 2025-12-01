import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load the Swagger JSON specification
const swaggerPath = path.join(__dirname, 'swagger.json');
const swaggerSpec = JSON.parse(readFileSync(swaggerPath, 'utf-8'));
export default swaggerSpec;
//# sourceMappingURL=swagger.js.map