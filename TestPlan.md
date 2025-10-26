# **Test Plan: Marker Moderation & Feedback Tool**

### **Document Control**

| Version | Date | Editor | Changes / Comments |
| :---- | :---- | :---- | :---- |
| 1.0 | 2025-09-04 | Qi Lin | Initial draft of the test plan based on user stories. |
| 1.1 | 2025-09-05 | Qi Lin | Expanded test cases to provide full coverage of all user stories. |
| 1.2 | 2025-09-06 | Qi Lin | Reviewed and corrected all user story references for traceability. |
| 1.3 | 2025-09-06 | Qi Lin | Final version for Week 6 progress report submission. Cleaned up formatting. |

Document Version: 1.3  
Date: 6th September 2025

### **1\. Introduction**

This document outlines the testing strategy for the "Marker Moderation & Feedback Tool" project. The purpose of this plan is to ensure that all functional and non-functional requirements are met, the system is free of critical defects, and the final product provides a reliable and intuitive user experience for both the Unit Chair and the Markers.

### **2\. Scope of Testing**

This plan covers the testing of all features defined in the project's User Stories and Use Case documents. The scope includes:

* Functionality for the **Unit Chair (Admin)** role.  
* Functionality for the **Marker** role.  
* Data processing and statistical calculations.  
* The automated notification system.

Testing will be performed on the web application deployed in a staging environment, using modern desktop browsers (Chrome, Firefox). Mobile browser testing is out of scope.

### **3\. Levels of Testing**

Our testing strategy will incorporate the following levels:

* **Unit Testing:** Testing individual functions and components in isolation to ensure they work correctly (e.g., a function that calculates the percentage difference between two scores).  
* **Integration Testing:** Testing the interaction between different components to ensure they work together as expected (e.g., ensuring that submitting marks via the frontend correctly updates the database on the backend).  
* **System Testing (End-to-End):** Testing the complete, integrated application to verify that it meets all specified requirements. This involves simulating full user journeys from start to finish.  
* **User Acceptance Testing (UAT):** The final phase of testing where the client (Carrie Ewin) will test the application to confirm it meets her needs and is ready for use.

### **4\. Test Cases**

The following table details the specific test cases derived from the project's user stories.

| Test Case ID | User Story Ref. | Test Description | Steps to Reproduce | Expected Result | Actual Result | Status |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **TC-A-001** | Story 1.1 | **Admin: Create a new moderation task** | 1\. Log in as Unit Chair. 2\. Navigate to "Tasks". 3\. Click "Create New Task". 4\. Fill in task name "Test Task 1" and year "2025". 5\. Click "Save". | A new task named "Test Task 1" should appear in the task list. The system should confirm "Task created successfully." |  | Not Run |
| **TC-A-002** | Story 1.2 | **Admin: Upload a rubric to a task** | 1\. Log in as Unit Chair. 2\. Open "Test Task 1". 3\. Click "Upload Rubric". 4\. Select a valid Word document rubric file. 5\. Click "Upload". | The system should parse the rubric and display its criteria and scoring structure on the screen for confirmation. |  | Not Run |
| **TC-A-003** | Story 1.3 | **Admin: Enter baseline marks and commentary** | 1\. Log in as Unit Chair. 2\. Open the rubric editor for "Test Task 1". 3\. Enter a valid score and a comment for each criterion. 4\. Click "Save Baseline". | The scores and comments should be saved successfully. When reopening the editor, the saved data should be present. |  | Not Run |
| **TC-A-004** | Story 3.1 & 3.2 | **Admin: View dashboard statistics** | 1\. Log in as Unit Chair. 2\. Navigate to the dashboard for a task with multiple marker submissions. 3\. Observe the statistics panel. | The dashboard should correctly display the average, standard deviation, min, and max scores for each criterion and the overall score. |  | Not Run |
| **TC-A-005** | Story 3.4 | **Admin: View marker completion status & improvement** | 1\. Log in as Unit Chair. 2\. Navigate to the task dashboard. 3\. Observe the list of assigned markers. | The list should clearly indicate which markers have "Completed" their submission and which are "Pending", and show comparison data if it's the second moderation task. |  | Not Run |
| **TC-A-006** | Story 3.3 | **Admin: Flag markers with high variance** | 1\. Log in as Unit Chair. 2\. Navigate to the dashboard where one marker's score is \>5% different from the baseline. 3\. Observe the marker list. | The marker whose score deviates by more than 5% should be visually highlighted (e.g., with a red background or an icon). |  | Not Run |
| **TC-A-007** | Story 5.1 | **Admin: Add a new marker to the system** | 1\. Log in as Unit Chair. 2\. Navigate to "User Management". 3\. Click "Add Marker". 4\. Enter a name and valid email. 5\. Click "Save". | A new marker account should be created and appear in the user list. An invitation email should be sent to the marker. |  | Not Run |
| **TC-A-008** | Story 3.5 | **Admin: Access historical moderation data** | 1\. Log in as Unit Chair. 2\. Ensure a completed task from a previous year exists. 3\. Navigate to the Tasks list. 4\. Filter/search for the previous year's task. 5\. Click to open it. | The system should load and display the full dashboard for the historical task, including all scores and statistics from that period. |  | Not Run |
| **TC-M-001** | Story 2.1 | **Marker: View assigned tasks on dashboard** | 1\. Log in as a Marker. 2\. Observe the main dashboard/home page. | The dashboard should display a list of all tasks currently assigned to this marker, showing their names and statuses (e.g., "Not Started", "Completed"). |  | Not Run |
| **TC-M-002** | Story 2.2 | **Marker: Submit marks for a task** | 1\. Log in as a Marker. 2\. Open an assigned task. 3\. Enter valid numerical scores for all criteria. 4\. Click "Submit". | The system should save the marks and immediately redirect to the feedback page. A "Submission successful" message should appear. |  | Not Run |
| **TC-M-003** | Story 2.3 | **Marker: View instant feedback after submission** | (Triggered by successful completion of TC-M-002) | The feedback page should display: the marker's scores, the Unit Chair's baseline scores, the calculated difference, and the Unit Chair's commentary. |  | Not Run |
| **TC-N-001** | Story 4.1 | **Notification: Marker receives email on submission** | (Triggered by successful completion of TC-M-002) | The marker should receive an email within 2 minutes containing a summary of their submission and the feedback. |  | Not Run |
| **TC-N-002** | Story 4.2 | **Notification: Marker receives email for a new task** | (Triggered after TC-A-001) | When a new moderation task is created and assigned, the marker should receive an email notification about the new task. |  | Not Run |
| **TC-N-003** | Story 4.3 | **Notification: Admin receives reminder about inactive markers** | 1\. Create a task and assign it to a marker. 2\. Wait for 7 days without the marker submitting. 3\. Check the Unit Chair's email inbox. | The Unit Chair should receive an email notification listing the markers who have not yet completed the task. |  | Not Run |
| **TC-N-004** | Story 4.2 | **Notification: Admin is notified of a submission** | (Triggered by successful completion of TC-M-002) | The Unit Chair should receive an email notification informing them that a specific marker has completed their submission. |  | Not Run |

