# SparkX - Intelligent Robot Fleet Management Platform

A comprehensive cloud-native platform for real-time monitoring, management, and predictive maintenance of large-scale humanoid robot fleets.

## Quick Start

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# In another terminal, start the backend server
npm run dev:server

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Login Credentials

- **Username:** admin
- **Password:** sparkx2024

## Documentation

All project documentation has been organized in the **[Docs](./Docs/)** folder:

- **[README.md](./Docs/README.md)** - Complete project overview and features
- **[DEVELOPER_GUIDE.md](./Docs/DEVELOPER_GUIDE.md)** - Technical architecture and implementation
- **[DATABASE_SCHEMA.md](./Docs/DATABASE_SCHEMA.md)** - Database schema documentation
- **[azure-deploy.md](./Docs/azure-deploy.md)** - Azure cloud deployment guide
- **[PITCH_PREPARATION.md](./Docs/PITCH_PREPARATION.md)** - Feature overview and test cases

## Technologies

- React 18 + TypeScript
- Vite + Tailwind CSS
- Express.js + Prisma ORM
- Three.js for 3D visualization
- Vitest for unit testing

## Testing

The project includes comprehensive unit tests covering:
- React components (Header, UI elements)
- Utility functions (robot metrics, status distribution)
- Configuration validation (thresholds, ranges)
- API endpoint construction

**Test Statistics:**
- 35 tests across 4 test suites
- 100% passing rate
- Execution time: ~2.3 seconds

**Run Tests:**
```sh
npm test              # Watch mode
npm run test:run      # Run once
npm run test:ui       # Interactive UI
npm run test:coverage # Coverage report
```

## License

MIT
