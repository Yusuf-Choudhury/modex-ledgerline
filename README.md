# Ledgerline open core

Open-source alternative to Jira and Confluence. Licensed under AGPL-3.0.

## Self-host

Self-hosting is free forever.

```
docker compose up
```

Set `LEDGERLINE_DB_PASSWORD` before you run it. The app reads `LEDGERLINE_DATABASE_URL` and loads `db/schema.sql` on first start.

## Develop

- `npm install`
- `npm run dev`
- `npm test`
- `npm run mcp` starts the MCP server

## Pricing

| Plan | Price |
|---|---|
| Self-hosting | Free forever |
| Private AI | £12 per user a month, 3-seat minimum |
| Agent API | 2p per action, or 25p per action on the larger model |
| Hosting | £49 a month, no AI included |
| Enterprise | From £1,350 |

## Licence

AGPL-3.0. See `LICENSE`.
