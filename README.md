<img src="assets/icon.svg" width="64" height="64" alt="">

# angular-mfe-prescription-demo

An Angular Shell and a Prescription Remote that are built and run separately.

## Structure

| Folder | What it is | Port |
| --- | --- | --- |
| `shell/` | Shell app | 4200 |
| `prescription/` | Prescription Remote and its standalone harness | 4201 |
| `e2e/` | Playwright tests | |

Each folder has its own `package.json` and is installed separately. The root holds only
shared tooling (fallow, prettier, the pre-commit hook).

## Setup

Requires Node 26.

```sh
nvm use
git config core.hooksPath .githooks

npm install
(cd shell && npm install)
(cd prescription && npm install)
(cd e2e && npm install)
```

## Run

```sh
cd prescription && npm start   # http://localhost:4201/sandbox/prescriptions
cd shell && npm start          # http://localhost:4200
```

## Test

```sh
cd shell && npm test           # unit tests
cd prescription && npm test    # unit tests
cd e2e && npm test             # e2e; starts both apps if they are not running
npm run audit                  # fallow, at the root
```
