## 1. Purpose
This document defines the quality assurance process and standards our team follows to ensure all features are high-quality, bug-free, and meet client requirements.
## 2. Definition of Done (DoD)
A User Story or Task is considered **"Done"** only when it meets **all** of the following criteria:
- [ ] Code is written and **merged** to the dev branch.
- [ ] Code adheres to the project's coding standards.
- [ ] Code is **peer-reviewed** and **approved** by at least one other team member.
- [ ] All related test cases in the TestPlan.md have been **passed**.
- [ ] The feature has been deployed to the test environment and verified by QA (Qi Lin).
- [ ] The feature meets all acceptance criteria defined in the User Story.
- [ ] No new high-priority bugs are introduced.
## 3. Roles and Responsibilities
### Developers (Eric, Yihan, Baitong, Ke, Qi)
- **Must** write code that is clean and functional.
- **Must** perform developer self-testing (smoke testing) locally before creating a Pull Request.
- **Must** participate in code reviews for other team members.
### QA (Qi Lin)
- **Responsible** for creating and maintaining the TestPlan.md.
- **Responsible** for participating in Sprint Planning to identify testing needs early.
- **Responsible** for performing formal testing in the test environment.
- **Responsible** for logging all bugs found in GitHub Issues.
- **Responsible** for final verification that a feature meets the "Definition of Done".
## 4. Code Review Policy
- All new features **must** be developed on a separate branch (e.g., feat/feature-name).
- All code **must** be submitted via a Pull Request (PR) to the dev branch.
- All PRs **must** be approved by at least **one (1)** other team member before merging.
- The PR description **must** include proof of developer self-testing.
## 5. Bug (Defect) Tracking Policy
- All bugs, no matter how small, **must** be reported as "Issues" in our GitHub repository.
- Bug reports **must** include:
    - A clear title.
    - Steps to reproduce the bug.
    - Expected results vs. Actual results.
    - A priority label (e.g., High, Medium, Low).
- High-priority bugs must be fixed before new features are developed.