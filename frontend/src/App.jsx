
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Clock3,
  History,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  PlusCircle,
  Users,
  Trophy,
  ChartNoAxesColumn,
  Eye,
  RefreshCw
} from "lucide-react";

import "./styles.css";


const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const initialQuestion = {
  text: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  subject: "General Knowledge"
};

async function api(path, { token, ...options } = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

function prettyDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60
  ).padStart(2, "0")}`;
}

function getPercentage(score, total) {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("quizly-session") || "null"
      );
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [page, setPage] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("quizly-session") || "null"
      );
      return saved?.user?.role === "admin" ? "admin" : "test";
    } catch {
      return "test";
    }
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(600);
  const [attempt, setAttempt] = useState(null);
  const [history, setHistory] = useState([]);
  const [questionForm, setQuestionForm] = useState(initialQuestion);

  const [dashboard, setDashboard] = useState(null);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [expandedAttempt, setExpandedAttempt] = useState(null);

  const token = session?.token;
  const user = session?.user;
  const isAdmin = user?.role === "admin";

  const completedCount = useMemo(
    () =>
      Object.values(answers).filter(
        (value) => value !== null && value !== undefined
      ).length,
    [answers]
  );

  useEffect(() => {
    if (session) {
      localStorage.setItem(
        "quizly-session",
        JSON.stringify(session)
      );
    } else {
      localStorage.removeItem("quizly-session");
    }
  }, [session]);

  useEffect(() => {
    if (token && page === "history" && !isAdmin) {
      loadHistory();
    }
  }, [page, token, isAdmin]);

  const loadDashboard = useCallback(async () => {
    if (!token || !isAdmin) return;

    setBusy(true);
    setError("");

    try {
      const data = await api("/api/attempts/admin", { token });
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, [token, isAdmin]);

  useEffect(() => {
    if (token && isAdmin && page === "admin") {
      loadDashboard();
    }
  }, [token, isAdmin, page, loadDashboard]);

  async function authenticate(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const result = await api(
        `/api/auth/${authMode === "signup" ? "signup" : "login"}`,
        {
          method: "POST",
          body: JSON.stringify(form)
        }
      );

      setSession(result);
      setForm({ name: "", email: "", password: "" });
      setQuestions([]);
      setAnswers({});
      setAttempt(null);
      setPage(result.user?.role === "admin" ? "admin" : "test");
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function startTest() {
    if (!token || isAdmin) return;

    setError("");
    setAttempt(null);
    setAnswers({});
    setSeconds(600);
    setBusy(true);

    try {
      const qs = await api("/api/questions", { token });

      if (!Array.isArray(qs) || qs.length !== 10) {
        throw new Error(
          "The test requires 10 questions. Check your question database."
        );
      }

      setQuestions(qs);
      setPage("test");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const submitTest = useCallback(
    async (autoSubmitted = false) => {
      if (
        isAdmin ||
        !questions.length ||
        attempt ||
        busy ||
        !token
      ) {
        return;
      }

      setBusy(true);
      setError("");

      try {
        const result = await api("/api/attempts", {
          method: "POST",
          token,
          body: JSON.stringify({
            autoSubmitted,
            answers: questions.map((question) => ({
              questionId: question.id,
              selectedAnswer: answers[question.id] ?? null
            }))
          })
        });

        setAttempt(result);
        setPage("result");
        setQuestions([]);
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy(false);
      }
    },
    [token, isAdmin, questions, answers, attempt, busy]
  );

  useEffect(() => {
    if (page !== "test" || !questions.length || isAdmin || attempt) {
      return;
    }

    if (seconds <= 0) {
      submitTest(true);
      return;
    }

    const timer = setTimeout(() => {
      setSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [page, questions.length, seconds, attempt, isAdmin, submitTest]);

  async function loadHistory() {
    if (!token || isAdmin) return;

    try {
      const data = await api("/api/attempts/me", { token });
      setHistory(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    localStorage.removeItem("quizly-session");
    setSession(null);
    setQuestions([]);
    setAnswers({});
    setAttempt(null);
    setHistory([]);
    setDashboard(null);
    setExpandedStudent(null);
    setExpandedAttempt(null);
    setPage("test");
    setError("");
  }

  async function addQuestion(e) {
    e.preventDefault();

    if (!token || !isAdmin) return;

    setError("");
    setBusy(true);

    try {
      await api("/api/questions", {
        token,
        method: "POST",
        body: JSON.stringify({
          ...questionForm,
          correctAnswer: Number(questionForm.correctAnswer)
        })
      });

      setQuestionForm(initialQuestion);
      setError("Question added successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function changeOption(index, value) {
    setQuestionForm((current) => ({
      ...current,
      options: current.options.map((option, i) =>
        i === index ? value : option
      )
    }));
  }

  if (!session) {
    return (
      <main className="auth-shell">
        <section className="auth-art">
          <div className="brand">
            <span className="brand-icon">
              <BookOpen size={21} />
            </span>
            quizly
          </div>

          <div className="art-copy">
            <span className="eyebrow">YOUR NEXT CHALLENGE</span>
            <h1>
              Make every
              <br />
              minute <em>count.</em>
            </h1>
            <p>
              A calmer way to test what you know, track your progress,
              and keep getting better.
            </p>
          </div>

          <div className="art-bottom">
            <span>✦ Learn. Practice. Improve.</span>
            <span>01 / 03</span>
          </div>

          <div className="decor-circle circle-one" />
          <div className="decor-circle circle-two" />
        </section>

        <section className="auth-panel">
          <div className="mobile-brand brand">
            <span className="brand-icon">
              <BookOpen size={21} />
            </span>
            quizly
          </div>

          <div className="auth-card">
            <span className="eyebrow muted">
              {authMode === "login" ? "WELCOME BACK" : "GET STARTED"}
            </span>

            <h2>
              {authMode === "login"
                ? "Sign in to Quizly"
                : "Create your account"}
            </h2>

            <p className="subtext">
              {authMode === "login"
                ? "Pick up where you left off."
                : "Your learning journey starts here."}
            </p>

            <form onSubmit={authenticate} className="form-stack">
              {authMode === "signup" && (
                <label>
                  Full name
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="Your name"
                  />
                </label>
              )}

              <label>
                Email address
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="you@example.com"
                />
              </label>

              <label>
                Password
                <input
                  required
                  minLength={6}
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="At least 6 characters"
                />
              </label>

              {error && <p className="error">{error}</p>}

              <button className="primary full" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : authMode === "login"
                    ? "Sign in"
                    : "Create account"}
                <ArrowRight size={17} />
              </button>
            </form>

            <p className="switch-auth">
              {authMode === "login"
                ? "New to Quizly?"
                : "Already have an account?"}{" "}
              <button
                onClick={() => {
                  setAuthMode(
                    authMode === "login" ? "signup" : "login"
                  );
                  setError("");
                }}
              >
                {authMode === "login"
                  ? "Create an account"
                  : "Sign in"}
              </button>
            </p>
          </div>

          <p className="panel-foot">
            By continuing, you agree to use Quizly for learning and
            practice.
          </p>
        </section>
      </main>
    );
  }

  const pageTitle = isAdmin
    ? page === "addQuestion"
      ? "Add questions"
      : "Admin dashboard"
    : page === "history"
      ? "My history"
      : page === "result"
        ? "Test result"
        : "Take a test";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">
            <BookOpen size={21} />
          </span>
          quizly
        </div>

        <div className="side-label">WORKSPACE</div>

        {isAdmin ? (
          <>
            <button
              className={`nav-item ${page === "admin" ? "active" : ""}`}
              onClick={() => {
                setPage("admin");
                setError("");
              }}
            >
              <ShieldCheck size={18} />
              Dashboard
            </button>

            <button
              className={`nav-item ${page === "addQuestion" ? "active" : ""}`}
              onClick={() => {
                setPage("addQuestion");
                setError("");
              }}
            >
              <PlusCircle size={18} />
              Add questions
            </button>
          </>
        ) : (
          <>
            <button
              className={`nav-item ${
                page === "test" || page === "result" ? "active" : ""
              }`}
              onClick={() => {
                setPage("test");
                setError("");
              }}
            >
              <BookOpen size={18} />
              Take a test
            </button>

            <button
              className={`nav-item ${page === "history" ? "active" : ""}`}
              onClick={() => {
                setPage("history");
                setError("");
              }}
            >
              <History size={18} />
              My history
            </button>
          </>
        )}

        <div className="sidebar-bottom">
          <div className="user-mini">
            <div className="avatar">
              {user?.name?.[0]?.toUpperCase() || "S"}
            </div>

            <div className="user-meta">
              <strong>{user?.name}</strong>
              <small>{user?.email}</small>
            </div>
          </div>

          <button className="logout" onClick={logout}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace /</span>{" "}
            <strong>{pageTitle}</strong>
          </div>

          <div className="top-user">
            <span className="online-dot" />
            {isAdmin ? "Administrator" : "Signed in"}
          </div>
        </header>

        <div className="content-wrap">
          {error && (
            <div
              className={
                error.toLowerCase().includes("successfully")
                  ? "notice"
                  : "error-banner"
              }
            >
              {error}
              <button onClick={() => setError("")}>×</button>
            </div>
          )}

          {/* STUDENT WELCOME PAGE */}
          {!isAdmin && page === "test" && !questions.length && (
            <section className="welcome-layout">
              <div className="welcome-main">
                <div className="eyebrow muted">READY WHEN YOU ARE</div>

                <h1>
                  Small steps.
                  <br />
                  <span>Big progress.</span>
                </h1>

                <p className="lead">
                  A focused 10-question test is all it takes to see how
                  much you know. No pressure — just progress.
                </p>

                <button
                  className="primary"
                  onClick={startTest}
                  disabled={busy}
                >
                  {busy ? "Loading questions…" : "Start your test"}
                  <ArrowRight size={17} />
                </button>

                <div className="test-facts">
                  <div>
                    <span className="fact-icon">
                      <BookOpen size={18} />
                    </span>
                    <div>
                      <strong>10 questions</strong>
                      <small>Multiple choice</small>
                    </div>
                  </div>

                  <div>
                    <span className="fact-icon">
                      <Clock3 size={18} />
                    </span>
                    <div>
                      <strong>10 minutes</strong>
                      <small>Timed assessment</small>
                    </div>
                  </div>

                  <div>
                    <span className="fact-icon">
                      <CheckCircle2 size={18} />
                    </span>
                    <div>
                      <strong>Instant results</strong>
                      <small>Review every answer</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="welcome-side">
                <div className="progress-card">
                  <div className="progress-head">
                    <span className="eyebrow muted">YOUR JOURNEY</span>
                    <span className="sparkle">✦</span>
                  </div>

                  <div className="progress-illustration">
                    <div className="orbit orbit-a" />
                    <div className="orbit orbit-b" />
                    <div className="big-check">
                      <CheckCircle2 size={44} />
                    </div>
                    <div className="float-card float-a">
                      ✦ <b>Keep going!</b>
                    </div>
                    <div className="float-card float-b">
                      ↗ <b>Level up</b>
                    </div>
                  </div>

                  <h3>Every attempt makes you sharper.</h3>
                  <p>
                    Practice consistently and watch your confidence grow.
                  </p>
                </div>

                <div className="tip-card">
                  <span>✧</span>
                  <div>
                    <strong>A little tip</strong>
                    <p>
                      Read each question carefully. You can change answers
                      before submitting.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STUDENT EXAM */}
          {!isAdmin && page === "test" && questions.length > 0 && (
            <section className="test-view">
              <div className="test-heading">
                <div>
                  <span className="eyebrow muted">
                    ASSESSMENT IN PROGRESS
                  </span>
                  <h1>General knowledge test</h1>
                  <p>Choose one answer for each question.</p>
                </div>

                <div className={`timer ${seconds < 60 ? "urgent" : ""}`}>
                  <Clock3 size={18} />
                  <div>
                    <small>TIME REMAINING</small>
                    <strong>{formatTime(seconds)}</strong>
                  </div>
                </div>
              </div>

              <div className="test-progress">
                <div>
                  <span>
                    {completedCount} of {questions.length} answered
                  </span>
                  <span>
                    {Math.round(
                      (completedCount / questions.length) * 100
                    )}
                    %
                  </span>
                </div>

                <div className="progress-track">
                  <span
                    style={{
                      width: `${
                        (completedCount / questions.length) * 100
                      }%`
                    }}
                  />
                </div>
              </div>

              <div className="question-list">
                {questions.map((q, i) => (
                  <article className="question-card" key={q.id}>
                    <div className="question-top">
                      <span className="question-number">
                        QUESTION {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="subject-tag">
                        {q.subject || "General Knowledge"}
                      </span>
                    </div>

                    <h3>{q.text}</h3>

                    <div className="options-grid">
                      {q.options.map((option, j) => (
                        <button
                          type="button"
                          key={j}
                          className={`option ${
                            answers[q.id] === j ? "selected" : ""
                          }`}
                          onClick={() =>
                            setAnswers((current) => ({
                              ...current,
                              [q.id]: j
                            }))
                          }
                        >
                          <span className="option-letter">
                            {String.fromCharCode(65 + j)}
                          </span>
                          <span>{option}</span>
                          {answers[q.id] === j && (
                            <CheckCircle2
                              size={17}
                              className="option-check"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>

              <div className="submit-bar">
                <span>
                  Your progress is saved on this screen until you submit.
                </span>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm("Submit your test now?")) {
                      submitTest(false);
                    }
                  }}
                >
                  {busy ? "Submitting…" : "Submit test"}
                  <ArrowRight size={17} />
                </button>
              </div>
            </section>
          )}

          {/* STUDENT RESULT */}
          {!isAdmin && page === "result" && attempt && (
            <section className="result-view">
              <div className="eyebrow muted">TEST COMPLETED</div>
              <h1>Your results are in.</h1>
              <p className="lead">
                Here's how you did. Review the answers to learn from every
                question.
              </p>

              <div className="score-card">
                <div
                  className="score-ring"
                  style={{
                    "--score": `${getPercentage(
                      attempt.score,
                      attempt.total
                    )}%`
                  }}
                >
                  <div>
                    <strong>
                      {attempt.score}
                      <small>/{attempt.total}</small>
                    </strong>
                    <span>SCORE</span>
                  </div>
                </div>

                <div className="score-copy">
                  <span className="eyebrow">YOUR PERFORMANCE</span>
                  <h2>
                    {attempt.score / attempt.total >= 0.8
                      ? "Excellent work!"
                      : attempt.score / attempt.total >= 0.5
                        ? "Good effort!"
                        : "Keep practicing!"}
                  </h2>
                  <p>
                    You answered {attempt.score} question
                    {attempt.score === 1 ? "" : "s"} correctly (
                    {getPercentage(attempt.score, attempt.total)}%).{" "}
                    {attempt.autoSubmitted
                      ? "Your test was automatically submitted when time ran out."
                      : "Your attempt has been saved to history."}
                  </p>

                  <button className="primary" onClick={startTest}>
                    Try another test <ArrowRight size={17} />
                  </button>
                </div>
              </div>

              <div className="review-heading">
                <h2>Answer review</h2>
                <span>
                  {attempt.answers.filter((a) => a.isCorrect).length}{" "}
                  correct ·{" "}
                  {attempt.answers.filter((a) => !a.isCorrect).length}{" "}
                  incorrect
                </span>
              </div>

              <div className="review-list">
                {attempt.answers.map((a, i) => (
                  <article className="review-card" key={a.questionId}>
                    <div className="review-title">
                      <span
                        className={`review-icon ${
                          a.isCorrect ? "correct" : "incorrect"
                        }`}
                      >
                        {a.isCorrect ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <XCircle size={18} />
                        )}
                      </span>
                      <div>
                        <small>
                          QUESTION {String(i + 1).padStart(2, "0")}
                        </small>
                        <h3>{a.text}</h3>
                      </div>
                    </div>

                    <div className="review-answers">
                      <p
                        className={
                          a.selectedAnswer === null
                            ? "unanswered"
                            : a.isCorrect
                              ? "correct-text"
                              : "wrong-text"
                        }
                      >
                        <b>Your answer:</b>{" "}
                        {a.selectedAnswer === null
                          ? "Not answered"
                          : a.options[a.selectedAnswer]}
                      </p>
                      <p className="correct-text">
                        <b>Correct answer:</b>{" "}
                        {a.options[a.correctAnswer]}
                      </p>
                    </div>
                  </article>
                ))}
              </div>

              <button
                className="secondary"
                onClick={() => setPage("history")}
              >
                View attempt history <History size={16} />
              </button>
            </section>
          )}

          {/* STUDENT HISTORY */}
          {!isAdmin && page === "history" && (
            <section className="history-view">
              <div className="eyebrow muted">YOUR PROGRESS</div>
              <h1>Attempt history</h1>
              <p className="lead">
                Every test is another step forward. Here's your recent
                activity.
              </p>

              <div className="history-summary">
                <div>
                  <small>TOTAL ATTEMPTS</small>
                  <strong>{history.length}</strong>
                </div>
                <div>
                  <small>AVERAGE SCORE</small>
                  <strong>
                    {history.length
                      ? Math.round(
                          history.reduce(
                            (sum, a) =>
                              sum +
                              getPercentage(a.score, a.total),
                            0
                          ) / history.length
                        )
                      : 0}
                    %
                  </strong>
                </div>
                <div>
                  <small>BEST SCORE</small>
                  <strong>
                    {history.length
                      ? Math.max(
                          ...history.map((a) =>
                            getPercentage(a.score, a.total)
                          )
                        )
                      : 0}
                    %
                  </strong>
                </div>
              </div>

              <div className="history-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ATTEMPT</th>
                      <th>DATE &amp; TIME</th>
                      <th>SCORE</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((a, i) => (
                      <tr key={a.id}>
                        <td>
                          <span className="attempt-dot">
                            {String(history.length - i).padStart(2, "0")}
                          </span>
                          <b>Practice test</b>
                        </td>
                        <td>{prettyDate(a.submittedAt)}</td>
                        <td>
                          <b>
                            {a.score}/{a.total}
                          </b>
                          <span className="score-percent">
                            {" "}
                            · {getPercentage(a.score, a.total)}%
                          </span>
                        </td>
                        <td>
                          <span className="status-pill">
                            {a.autoSubmitted
                              ? "Auto-submitted"
                              : "Completed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!history.length && (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <History size={24} />
                    </div>
                    <h3>No attempts yet</h3>
                    <p>Your completed tests will show up here.</p>
                    <button className="primary" onClick={startTest}>
                      Take your first test <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ADMIN DASHBOARD */}
          {isAdmin && page === "admin" && (
            <section className="admin-view">
              <div className="eyebrow muted">ADMINISTRATION</div>
              <h1>Student dashboard</h1>
              <p className="lead">
                Track registered students, exam performance, and submitted
                answers.
              </p>

              <div className="admin-stats">
                <article className="admin-stat-card">
                  <div className="admin-stat-icon">
                    <Users size={21} />
                  </div>
                  <div>
                    <small>REGISTERED STUDENTS</small>
                    <strong>{dashboard?.totalStudents ?? "—"}</strong>
                  </div>
                </article>

                <article className="admin-stat-card">
                  <div className="admin-stat-icon">
                    <Trophy size={21} />
                  </div>
                  <div>
                    <small>TOTAL ATTEMPTS</small>
                    <strong>{dashboard?.totalAttempts ?? "—"}</strong>
                  </div>
                </article>

                <article className="admin-stat-card">
                  <div className="admin-stat-icon">
                    <ChartNoAxesColumn size={21} />
                  </div>
                  <div>
                    <small>AVERAGE PERCENTAGE</small>
                    <strong>
                      {dashboard
                        ? `${dashboard.averagePercentage}%`
                        : "—"}
                    </strong>
                  </div>
                </article>
              </div>

              <div className="admin-section-heading">
                <div>
                  <h2>Registered students</h2>
                  <p>Open a student record to see exam attempts.</p>
                </div>

                <button
                  className="secondary"
                  disabled={busy}
                  onClick={loadDashboard}
                >
                  <RefreshCw size={15} />
                  Refresh
                </button>
              </div>

              {busy && !dashboard && (
                <div className="empty-state">
                  <p>Loading student records…</p>
                </div>
              )}

              {dashboard?.students?.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Users size={24} />
                  </div>
                  <h3>No students registered yet</h3>
                  <p>Student accounts will appear here after signup.</p>
                </div>
              )}

              <div className="admin-student-list">
                {dashboard?.students?.map((student) => (
                  <article className="admin-student-card" key={student.id}>
                    <div className="admin-student-head">
                      <div className="admin-student-identity">
                        <div className="avatar">
                          {student.name?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div>
                          <h3>{student.name}</h3>
                          <p>{student.email}</p>
                          <small>
                            Registered {prettyDate(student.registeredAt)}
                          </small>
                        </div>
                      </div>

                      <div className="admin-student-summary">
                        <span className="status-pill">
                          {student.attempts.length}{" "}
                          {student.attempts.length === 1
                            ? "attempt"
                            : "attempts"}
                        </span>

                        <button
                          className="secondary"
                          onClick={() => {
                            setExpandedStudent(
                              expandedStudent === student.id
                                ? null
                                : student.id
                            );
                            setExpandedAttempt(null);
                          }}
                        >
                          <Eye size={15} />
                          {expandedStudent === student.id
                            ? "Hide details"
                            : "View details"}
                        </button>
                      </div>
                    </div>

                    {expandedStudent === student.id && (
                      <div className="admin-attempts">
                        {student.attempts.length === 0 ? (
                          <div className="empty-state compact">
                            <p>This student has not submitted an exam.</p>
                          </div>
                        ) : (
                          <div className="history-table-wrap">
                            <table>
                              <thead>
                                <tr>
                                  <th>DATE &amp; TIME</th>
                                  <th>SCORE</th>
                                  <th>PERCENTAGE</th>
                                  <th>SUBMISSION</th>
                                  <th>REVIEW</th>
                                </tr>
                              </thead>
                              <tbody>
                                {student.attempts.map((item) => (
                                  <tr key={item.id}>
                                    <td>{prettyDate(item.submittedAt)}</td>
                                    <td>
                                      <b>
                                        {item.score}/{item.total}
                                      </b>
                                    </td>
                                    <td>
                                      <span
                                        className={`admin-percent ${
                                          item.percentage >= 50
                                            ? "good"
                                            : "low"
                                        }`}
                                      >
                                        {item.percentage}%
                                      </span>
                                    </td>
                                    <td>
                                      <span className="status-pill">
                                        {item.autoSubmitted
                                          ? "Auto-submitted"
                                          : "Completed"}
                                      </span>
                                    </td>
                                    <td>
                                      <button
                                        className="review-button"
                                        onClick={() =>
                                          setExpandedAttempt(
                                            expandedAttempt === item.id
                                              ? null
                                              : item.id
                                          )
                                        }
                                      >
                                        {expandedAttempt === item.id
                                          ? "Close review"
                                          : "Review answers"}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {student.attempts
                          .filter((item) => item.id === expandedAttempt)
                          .map((item) => (
                            <div
                              className="admin-answer-review"
                              key={item.id}
                            >
                              <div className="admin-review-heading">
                                <div>
                                  <span className="eyebrow muted">
                                    EXAM REVIEW
                                  </span>
                                  <h3>
                                    Score: {item.score}/{item.total} ·{" "}
                                    {item.percentage}%
                                  </h3>
                                  <p>
                                    Submitted {prettyDate(item.submittedAt)}
                                  </p>
                                </div>
                                <span className="status-pill">
                                  {item.autoSubmitted
                                    ? "Auto-submitted"
                                    : "Completed"}
                                </span>
                              </div>

                              {item.answers.map((answer, index) => (
                                <article
                                  className="review-card admin-review-card"
                                  key={answer.questionId}
                                >
                                  <div className="review-title">
                                    <span
                                      className={`review-icon ${
                                        answer.isCorrect
                                          ? "correct"
                                          : "incorrect"
                                      }`}
                                    >
                                      {answer.isCorrect ? (
                                        <CheckCircle2 size={18} />
                                      ) : (
                                        <XCircle size={18} />
                                      )}
                                    </span>
                                    <div>
                                      <small>
                                        QUESTION{" "}
                                        {String(index + 1).padStart(2, "0")}
                                      </small>
                                      <h3>{answer.text}</h3>
                                    </div>
                                  </div>

                                  <div className="review-answers">
                                    <p
                                      className={
                                        answer.selectedAnswer === null
                                          ? "unanswered"
                                          : answer.isCorrect
                                            ? "correct-text"
                                            : "wrong-text"
                                      }
                                    >
                                      <b>Student answer:</b>{" "}
                                      {answer.selectedAnswer === null
                                        ? "Not answered"
                                        : answer.options[
                                            answer.selectedAnswer
                                          ] ?? "Unavailable"}
                                    </p>
                                    <p className="correct-text">
                                      <b>Correct answer:</b>{" "}
                                      {answer.options[
                                        answer.correctAnswer
                                      ] ?? "Unavailable"}
                                    </p>
                                  </div>
                                </article>
                              ))}
                            </div>
                          ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* ADD QUESTIONS - ADMIN ONLY */}
          {isAdmin && page === "addQuestion" && (
            <section className="admin-view">
              <div className="eyebrow muted">CONTENT MANAGEMENT</div>
              <h1>Add a question</h1>
              <p className="lead">
                Create a new multiple-choice question for the test bank.
              </p>

              <form className="admin-form" onSubmit={addQuestion}>
                <label>
                  Question text
                  <textarea
                    required
                    value={questionForm.text}
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        text: e.target.value
                      })
                    }
                    placeholder="Enter your question"
                  />
                </label>

                <label>
                  Subject
                  <input
                    value={questionForm.subject}
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        subject: e.target.value
                      })
                    }
                  />
                </label>

                <h3>Answer options</h3>

                {questionForm.options.map((option, index) => (
                  <div className="admin-option" key={index}>
                    <span>{String.fromCharCode(65 + index)}</span>
                    <input
                      required
                      value={option}
                      onChange={(e) =>
                        changeOption(index, e.target.value)
                      }
                      placeholder={`Option ${String.fromCharCode(
                        65 + index
                      )}`}
                    />
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="correct"
                        checked={
                          Number(questionForm.correctAnswer) === index
                        }
                        onChange={() =>
                          setQuestionForm({
                            ...questionForm,
                            correctAnswer: index
                          })
                        }
                      />
                      Correct
                    </label>
                  </div>
                ))}

                <button className="primary" disabled={busy}>
                  <PlusCircle size={17} />
                  {busy ? "Saving…" : "Add question"}
                </button>
              </form>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
