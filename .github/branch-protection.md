# Branch Protection Configuration

This document describes the required branch protection rules for this repository.
These rules must be configured manually in GitHub repository settings.

## Main Branch Protection Rules

Navigate to: **Settings → Branches → Add branch protection rule**

### Branch name pattern: `main`

- [x] **Require a pull request before merging**
  - [x] Require approvals (at least 1)
  - [x] Dismiss stale pull request approvals when new commits are pushed
- [x] **Require status checks to pass before merging**
  - Required status checks:
    - `Lint Checks`
    - `Simulated Card Game`
    - `Server Startup Test`
- [x] **Require branches to be up to date before merging**
- [x] **Do not allow deletions** (prevent the main branch from being deleted)
- [x] **Restrict who can push to matching branches** (only allow merges via PR from dev)

## Workflow

1. All development happens on the `dev` branch
2. When ready, create a Pull Request from `dev` → `main`
3. CI tests (lint, game simulation, server test) must all pass
4. After approval and passing checks, merge to `main`
5. Docker image is automatically built and pushed on merge to `main`

## Branch Structure

```
main (protected - production)
  └── dev (development branch)
        └── feature/* (optional feature branches)
```
