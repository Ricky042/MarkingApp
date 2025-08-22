# MarkingApp by Group 79

Welcome to the MarkingApp repository!
This repository is a documentation of all stages of development for the application for Deakin University lecturer

## What you need to do:
- Install requirements
- Split terminal
- Run the starter commands for front and backend at the same time

## Installing Stuff
Here's how to install most of the stuff to get it working

```bash
  cd backend
  npm install # Installs all the backend dependencies
  cd ..
  cd frontend-vite
  npm install # Installs the frontend dependencies
  npm install -D tailwindcss postcss autoprefixer # You might need this if tailwind doesn't install off npm
  npm install axois react-router-dom # If backend is failing
  ```

  ```bash
  cd frontend-vite
  npm run dev # Starts frontend
  cd .. # Split terminals
  cd backend
  node server.js # This will start the server storage stuff
  ```
## Extra Notes for Team
- If using VSCode, install some way to view .db files (I'm using SQLite viewer from the built in market thing)
- The database is excluded in the .gitignore for now, it creates a new database on startup, so for now database stuff is local only

## Quick List of current stack / reqs
- React
- Vite
- Tailwind
- Nodejs
- Nodemailer
- Shadcn
- SQLite3
