---
name: GitHub Workflow Standards
description: Enforces the proper branching, commit, and PR strategies for the repository.
---

# GitHub Workflow Standards

As an AI agent collaborating in this repository, you **MUST** follow these specific version control patterns when managing Git and GitHub.

## Branching Strategy

1. **Never commit directly to `main`.**
2. **Always create a feature branch** before making code changes.
   - Example command: `git checkout -b <branch-name>`
   - Keep branch names descriptive and lowercase (e.g., `feat/relay-server`, `fix/proxy-port`).

## Commit Constraints

1. **Conventional Commits:** The subject line MUST start with the appropriate prefix followed by a colon and a space.
   - `feat:` (New features)
   - `fix:` (Bug fixes)
   - `docs:` (Documentation only changes)
   - `style:` (Changes that do not affect the meaning of the code)
   - `refactor:` (Code changes that neither fix a bug nor add a feature)
   - `perf:` (Code changes that improve performance)
   - `test:` (Adding missing tests or correcting existing tests)
   - `chore:` (Changes to the build process or auxiliary tools)
2. **Length Limit:** The subject line (the entire first line of the commit message) **MUST be under 50 characters**. If you need to include more details, add a blank line after the subject and list the details as bullet points in the commit body.
3. **Imperative Mood:** Use the imperative mood in the subject line (e.g., "Add feature" not "Added feature").
4. **Lowercase:** The commit message subject line must be completely lowercase (do not capitalize the first letter).

## Pull Requests (PRs) & Issues

The user prefers to **manually** handle Pull Request and Issue creation on GitHub. Your job is to prepare everything for them in text.

1. **Ask for Approval:** Before creating the PR artifacts, ask the user if they are ready to open the PR. When they approve, push the branch (`git push origin <branch-name>`).
2. **Issue Generation:** Provide a perfectly formatted, **short and simple** Markdown block for the primary Issue. It MUST include:
   - A short, descriptive **Issue Title**.
   - A list of suggested **Labels** (e.g., `enhancement`, `bug`).
   - A concise **Description** outlining exactly what the branch solves.
   - An empty `Resolves #[Insert Issue Number Here]` tag at the bottom.
3. **New Problems / Ideas:** If the current work reveals _new_ problems, bugs, or ideas that fall outside the current scope, you MUST generate separate, optional Issue markdown blocks for these discoveries so the user can decide if they want to track them.
4. **The PR Draft:** Finally, you MUST provide the exact **PR Title** and a **Short Description** that the user should copy/paste into the Pull Request body when they open it manually.
