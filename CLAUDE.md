# The Ones I Read - Bookshelf Project

## Tech Stack
- Next.js 15 (App Router, Turbopack)
- React 19 RC
- TypeScript 5
- Tailwind CSS 3.4
- Axios for API calls

## Project Structure
```
app/           # Next.js App Router pages
  layout.tsx   # Root layout
  page.tsx     # Home - book search
  dashboard/   # Dashboard page
utils/
  api.ts       # API client (axios)
```

## Development Guidelines
- Use `npm run dev` for development (Turbopack enabled)
- App Router conventions: page.tsx, layout.tsx, loading.tsx, error.tsx
- Korean language UI (검색, 도서 관련)
- API uses environment variables: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_API_KEY
- Path alias: `@/*` maps to project root

## Installed Plugins

### obra/superpowers (workflow methodology)
- Structured development: Design -> Plan -> Develop -> Review
- TDD with red-green-refactor cycles
- Systematic debugging with root cause analysis
- Skills auto-trigger based on development phase

### wshobson/agents (domain-specific agents)
Selected plugins for this project:
- **javascript-typescript**: JS/TS patterns, React, Node.js expertise
- **frontend-mobile-development**: Frontend UI development
- **tdd-workflows**: Test-driven development methodology
- **error-debugging**: Error analysis and trace debugging
- **git-pr-workflows**: Git workflow and PR automation
- **accessibility-compliance**: WCAG auditing, inclusive design
