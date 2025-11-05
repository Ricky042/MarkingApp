This document outlines the GitHub standards and workflow for all team members. Following these rules is mandatory to maintain code quality and a clean repository.
# 1. Branching Convention
All new work (features, bug fixes) **must** be done on a separate branch. Do not commit directly to main or dev.
### Branch Naming
Branches must be named using the following prefixes, followed by a short, hyphenated description:
- feat/: For new features (e.g., feat/add-login-page)
- fix/: For bug fixes (e.g., fix/login-delay-bug)
- docs/: For documentation changes (e.g., docs/update-architecture-diagram)
- style/: For code styling changes (e.g., style/format-all-files)
- refactor/: For code refactoring without changing functionality (e.g., refactor/simplify-report-logic)
**Base Branch:** All feature and fix branches should be created from the dev branch.
# 2. Commit Message Template
We follow the [Conventional Commits](https://www.conventionalcommits.org/) standard. This makes our commit history readable and helps automate versioning.
Your commit message **must** follow this format:
`<type>: <subject> [optional body]`
`<type>` **must be one of the following:**
- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- refactor: A code change that neither fixes a bug nor adds a feature
- perf: A code change that improves performance
- test: Adding missing tests or correcting existing tests
**Examples:**
- feat: add rubric upload button to assignment page
- fix: correct calculation for mark deviation
- docs: update CONTRIBUTING.md with new commit types
- refactor: simplify user authentication logic
# 3. GitHub Workflow: The Pull Request (PR) Process
Committing directly to dev or main is **prohibited**. All code must be submitted via a Pull Request (PR).
1. **Create Your Branch:** Create your feat/ or fix/ branch from the latest dev branch.
2. **Do Your Work:** Write your code and commit your changes using the commit message template (see section 2).
3. **Perform Self-Test:** Before creating a PR, you **must** self-test your changes locally to ensure they work. (This is from our QA Standard).
4. **Create Pull Request:**
    - Push your branch to GitHub.
    - Create a Pull Request from your branch into the dev branch.
    - **PR Title:** Use a clear title (e.g., feat: Add Rubric Upload Feature).
    - **PR Description:**
        - Briefly describe _what_ you changed and _why_.
        - **Link the Issue:** You **must** link the GitHub Issue this PR resolves (e.g., Closes #25).
        - **Confirm Self-Test:** You **must** confirm in writing that you have self-tested (e.g., [x] Tested locally, feature works as expected.).
5. **Request Review:**
    - Assign at least **one (1) other team member** as a **Reviewer**.
    - Do **not** merge your own PR.
6. **Code Review:**
    - The Reviewer will check the code for correctness, style, and adherence to the QA Standard.
    - The Reviewer may approve the PR or request changes.
7. **Merge:**
    - Once the PR is **approved** by the reviewer and all automated checks (if any) have passed, the PR can be merged into dev.