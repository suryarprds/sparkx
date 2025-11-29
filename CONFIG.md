# Database Configuration

## Quick Start

1. Edit `config.yaml` and set `is_local: true` (SQLite) or `is_local: false` (PostgreSQL)
2. Run:
```bash
npm run db:sync
```

That's it! This command handles everything:
- Updates `.env`
- Updates Prisma schema
- Generates Prisma client
- Syncs database
- Seeds data

## Common Commands

```bash
# Full sync (after editing config.yaml)
npm run db:sync

# View database UI
npm run db:studio

# Seed only
npm run db:seed

# Push schema only
npm run db:push

# Generate Prisma client only
npm run db:generate
```

## Config File

`config.yaml` contains:
- **is_local**: Toggle between SQLite (`true`) and PostgreSQL (`false`)
- **environments**: Connection details for local and remote databases
- **server**: Port, CORS, API settings
- **prisma**: Logging configuration

