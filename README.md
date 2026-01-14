# Issue Tracker – Project Documentation

This project is a modern, responsive Issue Tracker application built to manage projects and bugs efficiently.

## 1. Why did you choose the frontend stack you used?
We chose a stack consisting of **HTML5, Tailwind CSS, and Vanilla JavaScript (ES Module)**.

*   **Simplicity & Speed**: By avoiding complex frameworks like React or Angular for this specific iteration, we eliminated build times and configuration headers ("Hello World" is just an `index.html` file).
*   **Tailwind CSS**: Used via CDN for rapid UI development. It allowed us to create a *premium, dark-mode first* design system without writing hundreds of lines of custom CSS. The utility-first approach made responsive design for mobile (e.g., the new split-screen login) trivial.
*   **Vanilla JS Modules**: Modern browsers support ES6 modules natively. This allows us to organize code into clean, reusable files (`auth.js`, `firebase.js`, `utils.js`) without needing Webpack or a bundler. It keeps the codebase lightweight and very close to the metal.

## 2. Explain your Firestore data structure
We use **Cloud Firestore** (NoSQL database) with the following collections:

### Collection: `issues`
Stores all bug reports and tasks.
```json
{
  "id": "auto-generated-uid",
  "title": "Fix login bug",
  "description": "User cannot login...",
  "priority": "High",     // Low, Medium, High, Critical
  "status": "Open",       // Open, In Progress, Done
  "assignedTo": "user@example.com",
  "createdBy": "admin@example.com",
  "createdAt": "Timestamp"
}
```

### Collection: `projects`
Stores high-level project containers.
```json
{
  "id": "auto-generated-uid",
  "name": "Website Redesign",
  "description": "Overhaul of the landing page",
  "status": "Active",
  "ownerId": "user-uid",
  "createdAt": "Timestamp"
}
```

## 3. Explain how you handled similar issues
We implemented a **"Smart Assist"** feature (`js/smart-assist.js`) to prevent duplicate bug reports.

*   **Logic**: When a user types in the "Issue Title" field on `create-issue.html`, we attach an event listener with a **debounce**.
*   **Search**: This triggers a Firestore query that fetches issues. In a production app with full-text search (like Algolia), we would query by relevance. Here, we implemented a client-side keyword matcher that checks if existing issue titles contain words from the new input.
*   **Result**: Matching issues are dynamically injected into the sidebar, allowing the user to click and view them immediately instead of creating a duplicate.

## 4. Mention what was confusing or challenging
*   **Firestore Security Rules**: Initially, the app faced "Access Denied" errors. Debugging this required understanding that Firestore blocks request by default. We had to explicitly configure the rules in the Firebase Console to `allow read, write: if request.auth != null;`.
*   **State Management without a Framework**: Keeping the "Dashboard Stats" (Total, Open, etc.) in sync with the list of issues required careful DOM manipulation. In React, this would be a simple `state` calculation; in Vanilla JS, we had to manually update the DOM elements (`innerText`) whenever the data fetching logic ran.
*   **Asynchronous Auth**: Handling the delay between page load and Firebase restoring the user's session (`onAuthStateChanged`) required adding loading states to prevent the app from kicking the user out prematurely.

## 5. Mention what you would improve next
*   **Full-Text Search**: Connect Firestore to a search engine like Typesense or Algolia to make the "Smart Assist" feature more robust and fuzzy-search capable.
*   **Role-Based Access Control (RBAC)**: Improve security rules so that only "Admins" can delete projects, while "Viewers" can only comment.
*   **Real-time Updates**: Switch from `getDocs` (one-time fetch) to `onSnapshot` listeners so that if one user updates an issue, it instantly updates on everyone else's dashboard without refreshing.
*   **Framework Migration**: As the app grows, migrating to **Next.js** or **React** would help manage the increasing complexity of DOM manipulations and state.

---
*Created by the IssueTracker Team*
