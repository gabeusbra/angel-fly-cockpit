import { useState } from "react";
import { api, setToken } from "@/api/client";
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;
      if (mode === "login") {
        result = await api.auth.login(email, password);
      } else {
        result = await api.auth.register({ email, password, full_name: fullName });
      }
      setToken(result.token);
      const returnUrl = localStorage.getItem("af_return_url") || "/";
      localStorage.removeItem("af_return_url");
      window.location.href = returnUrl;
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        padding: "0 24px",
      }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56,
            borderRadius: 16,
            background: "linear-gradient(135deg, #FF4D35 0%, #FFB74D 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 8px 32px rgba(255, 77, 53, 0.3)",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
          </div>
          <h1 style={{
            fontSize: 24, fontWeight: 700, color: "#f8fafc",
            margin: "0 0 4px", letterSpacing: "-0.5px",
          }}>Angel Fly</h1>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>Cockpit</p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(30, 41, 59, 0.8)",
          backdropFilter: "blur(20px)",
          borderRadius: 20,
          border: "1px solid rgba(148, 163, 184, 0.1)",
          padding: 32,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}>
          {/* Tabs */}
          <div style={{
            display: "flex", gap: 4,
            background: "rgba(15, 23, 42, 0.5)",
            borderRadius: 12, padding: 4, marginBottom: 28,
          }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1, padding: "10px 0",
                  borderRadius: 10, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, letterSpacing: "0.3px",
                  background: mode === m ? "rgba(255, 77, 53, 0.15)" : "transparent",
                  color: mode === m ? "#FF4D35" : "#64748b",
                  transition: "all 0.2s",
                }}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                setError("");
                setLoading(true);
                try {
                  const result = await api.auth.google(credentialResponse.credential);
                  setToken(result.token);
                  const returnUrl = localStorage.getItem("af_return_url") || "/";
                  localStorage.removeItem("af_return_url");
                  window.location.href = returnUrl;
                } catch (err) {
                  setError(err.message || "Google login failed");
                  setLoading(false);
                }
              }}
              onError={() => {
                setError("Google login failed");
              }}
              theme="filled_black"
              shape="pill"
              text="continue_with"
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(148, 163, 184, 0.15)" }} />
            <span style={{ padding: "0 12px", fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>or use email</span>
            <div style={{ flex: 1, height: 1, background: "rgba(148, 163, 184, 0.15)" }} />
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  type="text" value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  style={{
                    width: "100%", padding: "12px 14px",
                    borderRadius: 12, border: "1px solid rgba(148, 163, 184, 0.15)",
                    background: "rgba(15, 23, 42, 0.5)", color: "#f8fafc",
                    fontSize: 14, outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                style={{
                  width: "100%", padding: "12px 14px",
                  borderRadius: 12, border: "1px solid rgba(148, 163, 184, 0.15)",
                  background: "rgba(15, 23, 42, 0.5)", color: "#f8fafc",
                  fontSize: 14, outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required minLength={6}
                style={{
                  width: "100%", padding: "12px 14px",
                  borderRadius: 12, border: "1px solid rgba(148, 163, 184, 0.15)",
                  background: "rgba(15, 23, 42, 0.5)", color: "#f8fafc",
                  fontSize: 14, outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10, marginBottom: 16,
                background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#fca5a5", fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width: "100%", padding: "13px 0",
                borderRadius: 12, border: "none", cursor: loading ? "wait" : "pointer",
                fontSize: 14, fontWeight: 600,
                background: "linear-gradient(135deg, #FF4D35, #FFB74D)",
                color: "white", letterSpacing: "0.3px",
                boxShadow: "0 4px 15px rgba(255, 77, 53, 0.3)",
                transition: "all 0.2s",
                opacity: loading ? 0.7 : 1,
              }}>
              {loading ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#475569" }}>
          © {new Date().getFullYear()} Angel Fly · Cockpit
        </p>
      </div>
    </div>
  );
}
