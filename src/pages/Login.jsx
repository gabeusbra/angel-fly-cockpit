import { useEffect, useRef, useState } from "react";
import { api, setToken } from "@/api/client";
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleWrapRef = useRef(null);
  const [googleWidth, setGoogleWidth] = useState(320);

  useEffect(() => {
    const updateWidth = () => {
      const w = googleWrapRef.current?.clientWidth || 320;
      setGoogleWidth(Math.max(200, Math.floor(w)));
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

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
      background: `
        radial-gradient(circle at 16% 14%, rgba(255, 131, 72, 0.14), transparent 38%),
        radial-gradient(circle at 86% 6%, rgba(255, 57, 50, 0.1), transparent 34%),
        linear-gradient(160deg, #f6f5f2 0%, #f4f1ea 52%, #f6f4ef 100%)
      `,
      fontFamily: "'Work Sans', system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        padding: "0 24px",
      }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 10,
            margin: "0 auto",
          }}>
            <img
              src="/branding/icon.svg"
              alt="Angel Fly"
              style={{ width: 40, height: 40, objectFit: "contain" }}
            />
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "blur(18px)",
          borderRadius: 16,
          border: "1px solid rgba(0, 0, 0, 0.1)",
          padding: 32,
          boxShadow: "0 20px 56px -28px rgba(0, 0, 0, 0.28)",
        }}>
          {/* Tabs */}
          <div style={{
            display: "flex", gap: 4,
            background: "rgba(255, 255, 255, 0.62)",
            borderRadius: 10, padding: 4, marginBottom: 24,
            border: "1px solid rgba(0,0,0,0.08)",
          }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1, padding: "10px 0",
                  borderRadius: 10, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, letterSpacing: "0.3px",
                  background: mode === m ? "linear-gradient(135deg, rgba(255,57,50,0.14), rgba(255,131,72,0.14))" : "transparent",
                  color: mode === m ? "#c13a22" : "#6b7280",
                  transition: "all 0.2s",
                }}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <div ref={googleWrapRef} style={{ marginBottom: 24, width: "100%" }}>
            <div style={{ width: "100%", overflow: "hidden", borderRadius: 6 }}>
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
                theme="outline"
                shape="rectangular"
                text="continue_with"
                width={googleWidth}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(148, 163, 184, 0.15)" }} />
            <span style={{ padding: "0 12px", fontSize: 12, color: "#6b7280", fontWeight: 500 }}>or use email</span>
            <div style={{ flex: 1, height: 1, background: "rgba(148, 163, 184, 0.15)" }} />
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#6b7280", marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  type="text" value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  style={{
                    width: "100%", padding: "12px 14px",
                    borderRadius: 10, border: "1px solid rgba(0, 0, 0, 0.1)",
                    background: "rgba(255,255,255,0.72)", color: "#171717",
                    fontSize: 14, outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#6b7280", marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                style={{
                  width: "100%", padding: "12px 14px",
                  borderRadius: 10, border: "1px solid rgba(0, 0, 0, 0.1)",
                  background: "rgba(255,255,255,0.72)", color: "#171717",
                  fontSize: 14, outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#6b7280", marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required minLength={6}
                style={{
                  width: "100%", padding: "12px 14px",
                  borderRadius: 10, border: "1px solid rgba(0, 0, 0, 0.1)",
                  background: "rgba(255,255,255,0.72)", color: "#171717",
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
                borderRadius: 6, border: "none", cursor: loading ? "wait" : "pointer",
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

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#737373" }}>
          © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
