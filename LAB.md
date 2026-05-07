# Lab 08: Secrets and Environment Variables in GitHub Actions

## Overview

You have a Node.js/Express app that issues and validates JWT tokens. The app requires a `JWT_SECRET` environment variable to sign tokens — without it, requests fail with HTTP 500.

Your job: wire up a GitHub Actions workflow that injects this secret (and a non-sensitive variable) so the CI test suite passes.

---

## Learning Objectives

1. Distinguish **secrets** (sensitive, masked in logs) from **repository variables** (non-sensitive, visible in logs)
2. Reference `${{ secrets.NAME }}` and `${{ vars.NAME }}` in a workflow `env:` block
3. Understand how env vars flow: workflow → runner process → `process.env` in app code → test results

---

## The App

| Route | Behavior |
|-------|----------|
| `POST /token` | Accepts `{ username }`, returns a signed JWT. Returns HTTP 500 if `JWT_SECRET` is not set. |
| `GET /protected` | Validates `Authorization: Bearer <token>`, returns `{ message: "Hello, <username>" }`. Returns 401 if token is missing or invalid. |

The test suite in `test/auth.test.js` has **6 tests**. They will pass only when `JWT_SECRET` is available in the environment.

---

## Steps

### 1. Verify the app locally

```bash
npm install
JWT_SECRET=my-local-secret npm test
```

All 6 tests should pass. Now run without the variable:

```bash
npm test
```

Two tests will fail. This is intentional — it shows what happens when the secret is missing.

### 2. Create a GitHub repository

Push this code to a new GitHub repo (public or private).

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 3. Add the secret in GitHub

Go to your repo → **Settings** → **Secrets and variables** → **Actions** → **Secrets** tab → **New repository secret**:

| Name | Value |
|------|-------|
| `JWT_SECRET` | `super-secret-signing-key-lab08` |

### 4. Add the variable in GitHub

Same settings page, switch to the **Variables** tab → **New repository variable**:

| Name | Value |
|------|-------|
| `NODE_ENV` | `test` |

> Notice: `JWT_SECRET` is a **secret** (sensitive — should never appear in logs). `NODE_ENV` is a **variable** (non-sensitive — fine to show in logs). Both live in GitHub settings, but they're different buckets.

### 5. Fix the workflow

Open `.github/workflows/ci.yml`. Find the `env:` block with the TODO comments. Add the two missing lines:

```yaml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  NODE_ENV: ${{ vars.NODE_ENV }}
```

Commit and push.

### 6. Watch the run

Go to the **Actions** tab. Watch the workflow run. When it reaches the **Show env behavior** step, check the logs:

- `NODE_ENV is: test` — printed in plain text (it's a variable)
- `JWT_SECRET is: ***` — masked (it's a secret)

The **Run tests** step should show all 6 tests passing.

---

## Acceptance Criteria

- [ ] Workflow triggers on `push` to `main` and on `pull_request`
- [ ] Runs on `ubuntu-latest` with Node.js 20
- [ ] Uses `actions/checkout@v4` and `actions/setup-node@v4`
- [ ] `JWT_SECRET` injected via `${{ secrets.JWT_SECRET }}`
- [ ] `NODE_ENV` injected via `${{ vars.NODE_ENV }}`
- [ ] All 6 Jest tests pass
- [ ] Logs show `NODE_ENV is: test` (plain) and `JWT_SECRET is: ***` (masked)

---

## Key Concepts

**Why `secrets` and not just `env:`?**
Values set directly in YAML (`env: JWT_SECRET: my-value`) are visible to anyone who can read the workflow file — including in git history. Secrets are stored encrypted in GitHub and injected at runtime. They're also masked in logs automatically.

**Why have both secrets and vars?**
Not all config is sensitive. `NODE_ENV=test` is safe to show in logs — it helps you debug. Storing non-sensitive values in `vars` keeps your secrets list clean and makes the intent clear.

**What about forked PRs?**
Secrets are not available to workflows triggered by pull requests from forks (a security boundary). Keep this in mind when your lab uses secrets in PR workflows.
