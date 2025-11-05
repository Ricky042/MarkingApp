### Project Kick-off: Meeting Summary & Requirements Analysis

- **Project:** Marker Moderation & Feedback Tool

- **Client:** Carrie Ewin, Unit Chair

- **Date of Meeting:** Week 3 (as per file name)

- **Document Version:** 1.0

### 1.0 Meeting Summary

This document outlines the summary and initial requirements gathered
from the project kick-off meeting with the client, Carrie Ewin. The
primary objective of this project is to develop a software tool to
streamline and automate the assignment moderation process between a Unit
Chair and a team of approximately 10-15 markers. The goal is to replace
the current manual, inefficient workflow with a system that provides
instant, data-driven feedback to markers, thereby improving marking
consistency and saving significant administrative time.

### 2.0 The Core Problem

The client\'s current process for moderating assignment marking with her
team is entirely manual, relying on Excel spreadsheets and email
correspondence. This workflow is extremely time-consuming and
repetitive, particularly the tasks of consolidating data from 10
different spreadsheets and writing individual feedback for each marker.
This results in a feedback loop that takes approximately one week, which
is too slow to allow markers to effectively learn and adjust their
marking for subsequent tasks.

### 3.0 Current Workflow & Pain Points

The existing manual process is as follows:

1.  The client emails the assignment and rubric to all markers.

2.  She marks the assignment herself in an Excel file.

3.  Each of the \~10 markers marks the assignment and emails their
    individual Excel spreadsheet back to her.

4.  **Pain Point:** The client must manually copy and paste the marks
    from all 10 spreadsheets into a single master file to compare them.

5.  **Pain Point:** She then writes formulas to calculate the variance
    between her marks and each marker\'s scores.

6.  **Pain Point:** The most time-consuming part is writing individual,
    often repetitive, feedback commentary in Word documents for every
    single marker.

7.  **Pain Point:** This entire process takes about a week, delaying
    crucial feedback.

### 4.0 Software Requirements Specification (SRS)

#### 4.1 User Roles

- **Unit Chair (Administrator):**

  - Has full administrative access to the system.

  - Can create new moderation tasks for different assignments and
    academic years.

  - Uploads the marking rubric for each assignment.

  - Inputs her own marks and commentary to serve as the baseline for
    comparison.

  - Accesses a \"behind-the-scenes\" dashboard with aggregated
    statistics and individual marker performance data.

- **Marker:**

  - Logs into the system to view assigned moderation tasks.

  - Inputs their marks against the provided rubric.

  - Can see a comparison of their marks against the Unit Chair\'s marks
    immediately after submission.

  - Receives an automated email with their marks, the chair\'s feedback,
    and the comparison data.

  - Can only view their own marks and feedback; they cannot see the
    marks of other markers.

#### 4.2 Functional Requirements

- **F-1: Rubric Management**

  - The admin must be able to upload a rubric, likely from a Word
    document.

  - The rubric structure for an assignment is fixed once it has been
    uploaded and the moderation process begins.

- **F-2: Marking & Feedback Workflow**

  - The admin enters her marks and commentary for each criterion on the
    rubric first.

  - Markers then log in to input their own marks against the same
    rubric.

  - An optional comment box should be available for markers to add their
    own justifications for each criterion if they wish.

  - Upon a marker clicking \"submit\", the system must instantly display
    the differences between their marks and the admin\'s, alongside the
    admin\'s pre-entered commentary.

  - Markers will only submit their marks once per moderation task; there
    is no need for resubmission or version history of their marks.

- **F-3: Notification System**

  - An email must be automatically sent to a marker immediately upon
    submission, containing a copy of their marks, the admin\'s marks,
    the differences, and the feedback.

  - Markers should be notified when a new moderation task is available
    for them to complete.

  - A reminder notification should be sent to markers who have not
    completed a task after a set period (e.g., one week).

  - The admin should receive a notification each time a marker completes
    a submission.

  - The admin should receive a summary notification of which markers
    have not completed the task after a week.

- **F-4: Admin Dashboard & Statistical Analysis**

  - The admin view must display a summary of all marks from all markers
    for an assignment.

  - The system must calculate and display the average, standard
    deviation, minimum, and maximum mark for each criterion and for the
    overall score.

  - The system must calculate the percentage difference between a
    marker\'s score and the admin\'s score for each criterion.

  - The dashboard must visually flag any marker whose score deviates
    from the admin\'s by a predefined percentage (e.g., more than 5%).

  - The system should allow the admin to see if a marker\'s alignment
    has improved between the first and second moderation assignments.

- **F-5: Data Persistence**

  - The system must store the history of each marker\'s marks from
    previous assignments and years for the admin to review.

#### 4.3 Non-Functional Requirements

- **NF-1: Platform**

  - The solution must be a web application. A mobile application is not
    required.

  - The website does not need to be mobile-friendly; a desktop-only
    experience is acceptable.

- **NF-2: User Interface & Experience (UI/UX)**

  - The design should be simple, clear, and easy to read.

  - Data presentation should be in a simple table or list format.
    Complex visuals like charts and graphs are not needed.

  - The client is not concerned with specific color schemes,
    prioritizing readability and clarity above aesthetics.

- **NF-3: Integration**

  - The application will be a standalone tool. It does not need to
    integrate with any external systems, including the university\'s
    Learning Management System (LMS).

- **NF-4: Scalability & Performance**

  - The system will be used by a small team, likely never exceeding 15
    markers.

  - The system must allow for new markers to be added each year.

- **NF-5: Security & Privacy**

  - Students must not have any access to the platform.

  - Markers can only view their own scores and feedback; they must not
    be able to see the scores of other markers.

#### 4.4 Out of Scope

- **AI-Assisted Feedback:** The client explicitly rejected the idea of
  using AI to generate feedback due to ethical concerns regarding the
  processing of real student assignment data.

- **Student Assignment Hosting:** The system will not host or manage the
  actual student assignment files. The client will distribute these
  separately.

- **Mobile Application:** A mobile app is not required.
