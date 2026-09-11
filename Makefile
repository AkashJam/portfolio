.PHONY: dev build lint typecheck test e2e check

dev:
	npm run dev

build:
	npm run build

lint:
	npm run lint

typecheck:
	npm run typecheck

test:
	npm run test

e2e:
	npx playwright test

# The same gate CI's `build` job runs on every push/PR. build before
# typecheck: standalone `next typegen` hangs once next.config.ts is wrapped
# with withSentryConfig (see ci.yml's comment) — build already generates
# everything typecheck needs.
check: lint build typecheck test
