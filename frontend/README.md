# 🚀 CodeIT

CodeIT is a full-stack coding platform inspired by platforms like LeetCode and HackerRank. It allows users to solve programming problems, participate in competitions, and receive automated code evaluation through backend integration.

---

## ✨ Features

### 👤 Authentication
- User Registration
- User Login
- JWT Authentication
- Role-based access (User/Admin)

---

### 🧑‍💻 Coding Environment
- Multi-language code editor
- Run code against sample test cases
- Submit solutions for evaluation
- Execution results with verdicts
- Hidden test case evaluation
- JSON input parsing for examples

---

### 📚 Problem Management
- Browse all coding problems
- Search problems
- Filter by topic
- Filter by difficulty
- View:
  - Problem Statement
  - Examples
  - Constraints
  - Hidden Test Cases (Admin)
- Rich example formatting

---

### 🏆 Competition System
- Create coding competitions
- Schedule competitions with:
  - Start Date & Time
  - End Date & Time
- Assign multiple problems to competitions
- Search problems while assigning
- Auto-selected problem list
- Competition dashboard

---

### 🛠️ Admin Panel

#### Problem Management
- Create new coding problems
- Quick Create Problem panel
- Add:
  - Title
  - Description
  - Difficulty
  - Topics
  - Examples
  - Constraints
  - Hidden Test Cases

#### Competition Management
- Create competitions
- Assign multiple problems before creation
- Live searchable problem list
- Selected Problems preview

---

### 📄 Problem Creation

Supports dynamic creation of:

- Multiple Examples
- Multiple Constraints
- Multiple Hidden Test Cases

Example structure:

```text
Example 1
Input
Output
Explanation
```

```text
Constraint 1
Constraint 2
Constraint 3
```

```text
Hidden Test Case 1
Input
Output
```

---

### 📅 Scheduling

Competitions use an interactive date & time picker with:

- Start Date
- End Date
- Time Selection
- End date validation

---

## 🛠 Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Datepicker
- Axios

### Backend

- Spring Boot
- Spring Security
- JWT Authentication
- JPA / Hibernate
- PostgreSQL (or configured database)

---

## 📂 Project Structure

```
src/
│
├── components/
├── context/
├── lib/
├── pages/
├── types/
├── App.tsx
└── main.tsx
```

---

## 🚀 Installation

Clone the repository

```bash
git clone <repository-url>
```

Install dependencies

```bash
npm install
```

Run the frontend

```bash
npm run dev
```

---

## 📦 Additional Packages

```bash
npm install react-datepicker
npm install date-fns
```

---

## 🔒 Roles

### User

- Register
- Login
- Solve Problems
- Submit Solutions
- Participate in Competitions

### Admin

- Create Problems
- Manage Competitions
- Assign Problems
- Configure Test Cases

---

## 📌 Current Progress

### ✅ Completed

- Authentication
- Role-based access
- Problem listing
- Problem details
- Code editor
- Code execution
- Submission workflow
- Competition creation
- Problem assignment
- Search functionality
- Dynamic examples
- Dynamic constraints
- Dynamic hidden test cases
- Date & time scheduling
- Admin dashboard

---

## 🚧 Upcoming Features

- User Profile
- Profile Picture Upload
- Edit Profile
- Username/Email Login
- Leaderboard
- Contest Rankings
- Discussion Section
- User Statistics
- Problem Bookmarking
- Theme Customization
- Notifications
- Code History
- Contest Analytics
- Custom Test Case Runner
- AI Code Review

---

## 👥 Contributors

- **Frontend:** Manya Katakol
- **Backend:** Sobhagya Verma

---

## 📜 License

This project is developed for educational and learning purposes.