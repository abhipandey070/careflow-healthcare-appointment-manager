import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:8080";

async function getResponseData(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function App() {
  const [page, setPage] = useState("login");

  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("careflowUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [authMode, setAuthMode] = useState("login");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [form, setForm] = useState({
    patientName: "",
    date: "",
    time: "",
    reason: "",
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    } else {
      setAppointments([]);
    }
  }, [user]);

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${API}/api/doctors`);

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();
      setDoctors(data);
    } catch {
      showMessage(
        "Unable to load doctors. Please make sure the backend is running.",
        "error"
      );
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${API}/api/appointments`);

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();
      setAppointments(data);
    } catch {
      showMessage(
        "Unable to load appointments.",
        "error"
      );
    }
  };

  const handleAuthChange = (e) => {
    setAuthForm({
      ...authForm,
      [e.target.name]: e.target.value,
    });

    setMessage("");
  };

  const handleFormChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setMessage("");
  };

  const login = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    try {
      const response = await fetch(`${API}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password,
        }),
      });

      const data = await getResponseData(response);

      if (!response.ok) {
        showMessage(
          typeof data === "string"
            ? data
            : "Incorrect email or password. Please try again.",
          "error"
        );
        return;
      }

      setUser(data);

      localStorage.setItem(
        "careflowUser",
        JSON.stringify(data)
      );

      setAuthForm({
        name: "",
        email: "",
        password: "",
      });

      showMessage(
        "Login successful!",
        "success"
      );

      setTimeout(() => {
        setMessage("");
        setPage("home");
      }, 600);

    } catch {
      showMessage(
        "Cannot connect to CareFlow server. Please make sure the backend is running on port 8080.",
        "error"
      );
    }
  };

  const register = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    try {
      const response = await fetch(
        `${API}/api/users/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: authForm.name,
            email: authForm.email,
            password: authForm.password,
            role: "PATIENT",
          }),
        }
      );

      const data = await getResponseData(response);

      if (!response.ok) {
        showMessage(
          typeof data === "string"
            ? data
            : "Unable to create account.",
          "error"
        );
        return;
      }

      setUser(data);

      localStorage.setItem(
        "careflowUser",
        JSON.stringify(data)
      );

      setAuthForm({
        name: "",
        email: "",
        password: "",
      });

      showMessage(
        "Account created successfully!",
        "success"
      );

      setTimeout(() => {
        setMessage("");
        setPage("home");
      }, 600);

    } catch {
      showMessage(
        "Cannot connect to CareFlow server. Please make sure the backend is running on port 8080.",
        "error"
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("careflowUser");

    setUser(null);
    setAppointments([]);
    setSelectedDoctor(null);
    setMessage("");

    setAuthMode("login");
    setPage("login");
  };

  const openHome = () => {
    setMessage("");
    setPage("home");
  };

  const openDoctors = () => {
    setMessage("");
    setPage("doctors");
  };

  const openBooking = (doctor) => {
    if (!user) {
      setAuthMode("login");

      showMessage(
        "Please login to book an appointment.",
        "error"
      );

      setPage("login");
      return;
    }

    setSelectedDoctor(doctor);

    setForm({
      patientName: user.name,
      date: "",
      time: "",
      reason: "",
    });

    setMessage("");
    setPage("booking");
  };

  const bookAppointment = async (e) => {
    e.preventDefault();

    if (!user) {
      setAuthMode("login");

      showMessage(
        "Please login to book an appointment.",
        "error"
      );

      setPage("login");
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/appointments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patientName: user.name,
            doctorName: selectedDoctor.name,
            date: form.date,
            time: form.time,
            reason: form.reason,
            status: "BOOKED",
          }),
        }
      );

      const data = await getResponseData(response);

      if (!response.ok) {
        showMessage(
          typeof data === "string"
            ? data
            : "Unable to book appointment.",
          "error"
        );
        return;
      }

      setForm({
        patientName: "",
        date: "",
        time: "",
        reason: "",
      });

      setSelectedDoctor(null);

      await fetchAppointments();

      showMessage(
        "Appointment booked successfully!",
        "success"
      );

      setTimeout(() => {
        setMessage("");
        setPage("appointments");
      }, 700);

    } catch {
      showMessage(
        "Unable to connect to the server.",
        "error"
      );
    }
  };

  const cancelAppointment = async (id) => {
    if (!user) {
      setAuthMode("login");
      setPage("login");

      showMessage(
        "Please login to manage your appointments.",
        "error"
      );

      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/appointments/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      await fetchAppointments();

      showMessage(
        "Appointment cancelled successfully.",
        "success"
      );

    } catch {
      showMessage(
        "Unable to cancel appointment.",
        "error"
      );
    }
  };

  const userAppointments = appointments.filter(
    (appointment) =>
      appointment.patientName === user?.name
  );

  return (
    <div className="app">

      {/* ================= NAVBAR ================= */}

      <header className="navbar">

        <div
          className="logo"
          onClick={openHome}
          style={{ cursor: "pointer" }}
        >
          <span className="logo-icon">
            +
          </span>

          <div className="logo-text">
            <span>CareFlow</span>
            <small>HEALTHCARE</small>
          </div>
        </div>

        <nav>

          <button
            className={
              page === "home"
                ? "active-nav"
                : ""
            }
            onClick={openHome}
          >
            Home
          </button>

          <button
            className={
              page === "doctors"
                ? "active-nav"
                : ""
            }
            onClick={openDoctors}
          >
            Doctors
          </button>

          {user && (
            <button
              className={
                page === "appointments"
                  ? "active-nav"
                  : ""
              }
              onClick={() => {
                setMessage("");
                setPage("appointments");
              }}
            >
              My Appointments
            </button>
          )}

          {!user && (
            <button
              className="nav-cta"
              onClick={() => {
                setAuthMode("login");
                setMessage("");
                setPage("login");
              }}
            >
              Get Started
            </button>
          )}

          {user && (
            <button
              className="logout-nav"
              onClick={logout}
            >
              Logout
            </button>
          )}

        </nav>

      </header>


      {/* ================= LOGIN ================= */}

      {page === "login" && !user && (
        <main className="auth-page">

          <div className="auth-side">

            <p className="tag">
              CAREFLOW HEALTHCARE
            </p>

            <h1>
              Healthcare that
              <span> moves with you.</span>
            </h1>

            <p>
              Find trusted doctors, book appointments,
              and manage your healthcare visits from
              one simple platform.
            </p>

            <div className="auth-benefits">

              <div>
                <strong>✓</strong>
                <span>
                  Find experienced doctors
                </span>
              </div>

              <div>
                <strong>✓</strong>
                <span>
                  Book appointments easily
                </span>
              </div>

              <div>
                <strong>✓</strong>
                <span>
                  Manage your visits
                </span>
              </div>

            </div>

          </div>


          <div className="auth-card">

            <div className="auth-logo">
              <span className="logo-icon">
                +
              </span>
              CareFlow
            </div>

            <p className="auth-small">
              WELCOME BACK
            </p>

            <h2>
              Login to your account
            </h2>

            <p className="auth-subtitle">
              Access your healthcare appointments.
            </p>

            <form onSubmit={login}>

              <label>
                Email
              </label>

              <input
                type="email"
                name="email"
                value={authForm.email}
                onChange={handleAuthChange}
                placeholder="Enter your email"
                required
              />

              <label>
                Password
              </label>

              <input
                type="password"
                name="password"
                value={authForm.password}
                onChange={handleAuthChange}
                placeholder="Enter your password"
                required
              />

              {message && (
                <div
                  className={`message ${
                    messageType === "success"
                      ? "success-message"
                      : "error-message"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                className="primary-btn full"
                type="submit"
              >
                Login
              </button>

            </form>

            <div className="auth-switch">
              Don't have an account?

              <button
                onClick={() => {
                  setAuthMode("register");
                  setMessage("");
                  setPage("register");
                }}
              >
                Create Account
              </button>
            </div>

            <div className="guest-divider">
              <span>OR</span>
            </div>

            <button
              className="guest-btn"
              onClick={openDoctors}
            >
              Browse Doctors as Guest →
            </button>

          </div>

        </main>
      )}


      {/* ================= REGISTER ================= */}

      {page === "register" && !user && (
        <main className="auth-page">

          <div className="auth-side">

            <p className="tag">
              JOIN CAREFLOW
            </p>

            <h1>
              Start taking care
              <span> of your health.</span>
            </h1>

            <p>
              Create your CareFlow account and keep
              your appointments organized in one place.
            </p>

            <div className="auth-benefits">

              <div>
                <strong>✓</strong>
                <span>
                  Discover healthcare professionals
                </span>
              </div>

              <div>
                <strong>✓</strong>
                <span>
                  Schedule appointments quickly
                </span>
              </div>

              <div>
                <strong>✓</strong>
                <span>
                  Manage your upcoming visits
                </span>
              </div>

            </div>

          </div>


          <div className="auth-card">

            <div className="auth-logo">
              <span className="logo-icon">
                +
              </span>
              CareFlow
            </div>

            <p className="auth-small">
              CREATE ACCOUNT
            </p>

            <h2>
              Join CareFlow
            </h2>

            <p className="auth-subtitle">
              Create your patient account.
            </p>

            <form onSubmit={register}>

              <label>
                Full Name
              </label>

              <input
                type="text"
                name="name"
                value={authForm.name}
                onChange={handleAuthChange}
                placeholder="Enter your full name"
                required
              />

              <label>
                Email
              </label>

              <input
                type="email"
                name="email"
                value={authForm.email}
                onChange={handleAuthChange}
                placeholder="Enter your email"
                required
              />

              <label>
                Password
              </label>

              <input
                type="password"
                name="password"
                value={authForm.password}
                onChange={handleAuthChange}
                placeholder="Create a password"
                required
              />

              {message && (
                <div
                  className={`message ${
                    messageType === "success"
                      ? "success-message"
                      : "error-message"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                className="primary-btn full"
                type="submit"
              >
                Create Account
              </button>

            </form>

            <div className="auth-switch">
              Already have an account?

              <button
                onClick={() => {
                  setAuthMode("login");
                  setMessage("");
                  setPage("login");
                }}
              >
                Login
              </button>
            </div>

          </div>

        </main>
      )}


      {/* ================= HOME ================= */}

      {page === "home" && (
        <main>

          <section className="hero">

            <div className="hero-content">

              <div className="hero-badge">
                <span>●</span>
                Trusted Healthcare Platform
              </div>

              <p className="tag">
                CAREFLOW HEALTHCARE
              </p>

              <h1>
                Better care.
                <br />
                <span>Better connected.</span>
              </h1>

              <p className="hero-text">
                {user
                  ? `Welcome back, ${user.name}. `
                  : ""}
                Find experienced doctors, book appointments,
                and manage your healthcare visits from one
                simple and secure platform.
              </p>

              <div className="hero-buttons">

                <button
                  className="primary-btn"
                  onClick={openDoctors}
                >
                  Find a Doctor →
                </button>

                {!user && (
                  <button
                    className="secondary-btn"
                    onClick={() => {
                      setAuthMode("login");
                      setMessage("");
                      setPage("login");
                    }}
                  >
                    Login to CareFlow
                  </button>
                )}

                {user && (
                  <button
                    className="secondary-btn"
                    onClick={() =>
                      setPage("appointments")
                    }
                  >
                    My Appointments
                  </button>
                )}

              </div>

              <div className="hero-trust">

                <div>
                  <strong>✓</strong>
                  <span>
                    Easy booking
                  </span>
                </div>

                <div>
                  <strong>✓</strong>
                  <span>
                    Verified doctors
                  </span>
                </div>

                <div>
                  <strong>✓</strong>
                  <span>
                    Simple management
                  </span>
                </div>

              </div>

            </div>


            <div className="hero-visual">

              <div className="medical-card">

                <div className="medical-card-top">

                  <div className="medical-icon">
                    +
                  </div>

                  <span className="available-dot">
                    ● Available
                  </span>

                </div>

                <h3>
                  Your healthcare,
                  <br />
                  simplified.
                </h3>

                <p>
                  Everything you need to manage
                  your healthcare appointments
                  in one place.
                </p>

                <div className="medical-stats">

                  <div>
                    <strong>
                      {doctors.length}+
                    </strong>
                    <span>
                      Doctors
                    </span>
                  </div>

                  <div>
                    <strong>
                      24/7
                    </strong>
                    <span>
                      Access
                    </span>
                  </div>

                </div>

              </div>

              <div className="floating-card floating-one">

                <span>📅</span>

                <div>
                  <strong>
                    Easy Booking
                  </strong>

                  <small>
                    Schedule in seconds
                  </small>
                </div>

              </div>

              <div className="floating-card floating-two">

                <span>✓</span>

                <div>
                  <strong>
                    Appointment
                  </strong>

                  <small>
                    Successfully managed
                  </small>
                </div>

              </div>

            </div>

          </section>


          <section className="quick-section">

            <div className="section-heading">

              <p className="tag">
                EVERYTHING YOU NEED
              </p>

              <h2>
                Healthcare made simpler
              </h2>

              <p>
                CareFlow brings the essential healthcare
                experience together in one place.
              </p>

            </div>


            <div className="features">

              <div className="feature-card">

                <div className="feature-icon">
                  👨‍⚕️
                </div>

                <h3>
                  Find the Right Doctor
                </h3>

                <p>
                  Browse doctors by specialization,
                  experience and availability.
                </p>

                <button
                  onClick={openDoctors}
                  className="feature-link"
                >
                  Explore doctors →
                </button>

              </div>


              <div className="feature-card">

                <div className="feature-icon">
                  📅
                </div>

                <h3>
                  Book Appointments
                </h3>

                <p>
                  Choose a convenient date and time
                  and schedule your visit easily.
                </p>

                <button
                  onClick={() => {
                    if (!user) {
                      setAuthMode("login");
                      showMessage(
                        "Please login to book an appointment.",
                        "error"
                      );
                      setPage("login");
                    } else {
                      openDoctors();
                    }
                  }}
                  className="feature-link"
                >
                  Book a visit →
                </button>

              </div>


              <div className="feature-card">

                <div className="feature-icon">
                  🔒
                </div>

                <h3>
                  Manage Your Visits
                </h3>

                <p>
                  Keep your appointments organized
                  and manage them from your account.
                </p>

                <button
                  onClick={() => {
                    if (!user) {
                      setAuthMode("login");
                      showMessage(
                        "Please login to view your appointments.",
                        "error"
                      );
                      setPage("login");
                    } else {
                      setPage("appointments");
                    }
                  }}
                  className="feature-link"
                >
                  View appointments →
                </button>

              </div>

            </div>

          </section>


          <section className="why-section">

            <div className="why-content">

              <p className="tag">
                WHY CAREFLOW
              </p>

              <h2>
                Designed around
                <span> your care.</span>
              </h2>

              <p>
                Healthcare should be simple, accessible
                and organized. CareFlow gives patients
                one convenient place to discover doctors
                and manage their appointments.
              </p>

              <div className="why-list">

                <div>
                  <span>01</span>

                  <div>
                    <h3>
                      Discover
                    </h3>

                    <p>
                      Find doctors that match
                      your healthcare needs.
                    </p>
                  </div>
                </div>

                <div>
                  <span>02</span>

                  <div>
                    <h3>
                      Schedule
                    </h3>

                    <p>
                      Select your preferred date
                      and available time.
                    </p>
                  </div>
                </div>

                <div>
                  <span>03</span>

                  <div>
                    <h3>
                      Manage
                    </h3>

                    <p>
                      Keep your upcoming appointments
                      organized.
                    </p>
                  </div>
                </div>

              </div>

            </div>


            <div className="why-card">

              <div className="why-card-icon">
                ♥
              </div>

              <h3>
                Your health
                <br />
                matters.
              </h3>

              <p>
                CareFlow helps make every healthcare
                interaction a little easier.
              </p>

              <div className="why-line"></div>

              <span>
                CareFlow Healthcare
              </span>

            </div>

          </section>


          {!user && (
            <section className="final-cta">

              <div>

                <p className="tag">
                  GET STARTED
                </p>

                <h2>
                  Take control of
                  <span> your healthcare.</span>
                </h2>

                <p>
                  Create your free CareFlow account
                  and start managing your appointments
                  today.
                </p>

              </div>

              <button
                className="primary-btn light-btn"
                onClick={() => {
                  setAuthMode("register");
                  setMessage("");
                  setPage("register");
                }}
              >
                Create Free Account →
              </button>

            </section>
          )}

        </main>
      )}


      {/* ================= DOCTORS ================= */}

      {page === "doctors" && (
        <main className="page">

          <div className="page-heading">

            <p className="tag">
              OUR DOCTORS
            </p>

            <h1>
              Find your doctor
            </h1>

            <p>
              Explore our available healthcare
              professionals.
            </p>

          </div>


          <div className="doctor-grid">

            {doctors.map((doctor) => (

              <div
                className="doctor-card"
                key={doctor.id}
              >

                <div className="doctor-avatar">
                  {doctor.name
                    .replace("Dr. ", "")
                    .charAt(0)}
                </div>

                <h2>
                  {doctor.name}
                </h2>

                <p className="specialization">
                  {doctor.specialization}
                </p>

                <div className="doctor-info">

                  <p>
                    ⭐ {doctor.experience}
                  </p>

                  <p>
                    🕐 {doctor.availableTime}
                  </p>

                </div>

                <button
                  className="primary-btn full"
                  onClick={() =>
                    openBooking(doctor)
                  }
                >
                  {user
                    ? "Book Appointment"
                    : "Login to Book"}
                </button>

              </div>

            ))}

          </div>

        </main>
      )}


      {/* ================= BOOKING ================= */}

      {page === "booking" &&
        selectedDoctor &&
        user && (

          <main className="page">

            <button
              className="back-btn"
              onClick={() =>
                setPage("doctors")
              }
            >
              ← Back to doctors
            </button>

            <div className="booking-container">

              <div className="selected-doctor">

                <div className="doctor-avatar large">
                  {selectedDoctor.name
                    .replace("Dr. ", "")
                    .charAt(0)}
                </div>

                <h2>
                  {selectedDoctor.name}
                </h2>

                <p className="specialization">
                  {selectedDoctor.specialization}
                </p>

                <p>
                  ⭐ {selectedDoctor.experience}
                </p>

                <p>
                  🕐 {selectedDoctor.availableTime}
                </p>

              </div>


              <form
                className="booking-form"
                onSubmit={bookAppointment}
              >

                <p className="tag">
                  BOOK YOUR VISIT
                </p>

                <h1>
                  Schedule Appointment
                </h1>

                <label>
                  Patient Name
                </label>

                <input
                  type="text"
                  value={user.name}
                  readOnly
                />

                <label>
                  Date
                </label>

                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleFormChange}
                  required
                />

                <label>
                  Time
                </label>

                <input
                  type="time"
                  name="time"
                  value={form.time}
                  onChange={handleFormChange}
                  required
                />

                <label>
                  Reason for Visit
                </label>

                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleFormChange}
                  placeholder="Describe your reason for visiting"
                  rows="4"
                  required
                />

                {message && (
                  <div
                    className={`message ${
                      messageType === "success"
                        ? "success-message"
                        : "error-message"
                    }`}
                  >
                    {message}
                  </div>
                )}

                <button
                  className="primary-btn full"
                  type="submit"
                >
                  Confirm Appointment
                </button>

              </form>

            </div>

          </main>
        )}


      {/* ================= APPOINTMENTS ================= */}

      {page === "appointments" && user && (

        <main className="page">

          <div className="page-heading">

            <p className="tag">
              YOUR HEALTHCARE
            </p>

            <h1>
              My Appointments
            </h1>

            <p>
              Manage your upcoming healthcare visits.
            </p>

          </div>


          {userAppointments.length === 0 ? (

            <div className="empty">

              <div>
                📅
              </div>

              <h2>
                No appointments yet
              </h2>

              <p>
                Book an appointment with a doctor
                to get started.
              </p>

              <button
                className="primary-btn"
                onClick={openDoctors}
              >
                Find a Doctor
              </button>

            </div>

          ) : (

            <div className="appointment-list">

              {userAppointments.map(
                (appointment) => (

                  <div
                    className="appointment-card"
                    key={appointment.id}
                  >

                    <div className="appointment-date">

                      <strong>
                        {appointment.date}
                      </strong>

                      <span>
                        {appointment.time}
                      </span>

                    </div>


                    <div className="appointment-details">

                      <h2>
                        {appointment.doctorName}
                      </h2>

                      <p>
                        Patient:{" "}
                        {appointment.patientName}
                      </p>

                      <p>
                        Reason:{" "}
                        {appointment.reason}
                      </p>

                    </div>


                    <div className="appointment-actions">

                      <div className="status">
                        {appointment.status}
                      </div>

                      {appointment.status !==
                        "CANCELLED" && (

                        <button
                          className="cancel-btn"
                          onClick={() =>
                            cancelAppointment(
                              appointment.id
                            )
                          }
                        >
                          Cancel
                        </button>

                      )}

                    </div>

                  </div>

                )
              )}

            </div>

          )}


          {message && (
            <div
              className={`message ${
                messageType === "success"
                  ? "success-message"
                  : "error-message"
              }`}
            >
              {message}
            </div>
          )}

        </main>

      )}


      {/* ================= FOOTER ================= */}

      <footer>

        <strong>
          CareFlow
        </strong>

        <span>
          Healthcare Appointment Manager
        </span>

      </footer>

    </div>
  );
}

export default App;