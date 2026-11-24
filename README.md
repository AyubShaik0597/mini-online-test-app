# Quizly — Online Test Application

Quizly is a full-stack online examination platform built using the MERN stack. It allows students to register, take timed multiple-choice tests, view results, and track their performance. Administrators can manage questions and monitor student attempts.

## 🌐 Live Demo

- **Frontend:** https://mini-online-test-app.vercel.app

## 🚀 Features

### Student
- Sign up and log in with email and password.
- Take a 10-question multiple-choice aptitude test.
- Complete the test within a 10-minute time limit.
- Automatic submission when the timer expires.
- View scores and correct/incorrect answers.
- View previous test attempts.

### Administrator
- Secure admin login.
- View registered students.
- Monitor exam attempts, scores, and percentages.
- Review students' submitted answers.
- Add and manage test questions.
- Restrict administrative operations to authorized users.

## 🛠️ Technologies Used

**Frontend**
- React.js
- Vite
- CSS

**Backend**
- Node.js
- Express.js
- JWT authentication

**Database**
- MongoDB Atlas

**Deployment**
- Vercel — Frontend
- Render — Backend

## 🔑 Demo Login Credentials

### Student Account
- Email: 
- Password: Set your password during registration.

### Administrator Account
- Admin email: ayub123@gmail.com
- Admin password: Ayub@1903

**Security note:** Create a separate demo administrator account if public access is needed. Use a unique password and avoid exposing production credentials.

## ⚙️ Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/mini-online-test-app.git
cd mini-online-test-app
```

### 2. Start the backend

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory and configure your environment variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret
CLIENT_ORIGIN=http://localhost:5173
ADMIN_EMAIL=your_admin_email
```

Start the backend:

```bash
npm run dev
```

### 3. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## 📁 Project Structure

```text
mini-online-test-app/
├── backend/
│   ├── src/
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   └── package.json
├── .gitignore
└── README.md
```

*The exact contents of the source directories may vary.*

## 🔒 Security

- Keep environment variables and database credentials private.
- Never commit `.env` files to GitHub.
- Use secure JWT configuration.
- Validate administrator roles on the backend for every protected admin operation.
- Never allow users to grant themselves administrator privileges through signup.

## 👨‍💻 Author

**Shaik Ayub**

Full-Stack Developer | Java | Spring Boot | React | Node.js | MongoDB

## 📄 License

This project is intended for learning, demonstration, and portfolio purposes.o `CLIENT_ORIGIN` on the backend.
- This starter project is ready for local development; you still need to create your own GitHub repository and deploy it to obtain live links.
