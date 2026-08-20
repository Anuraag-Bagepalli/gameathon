import { useState } from "react";
import { CheckCircle2, LoaderCircle, Users, Lock } from "lucide-react";
import { API_URL } from "../config";

const initial = {
  teamName: "",
  teamLeader: "",
  email: "",
  phone: "",
  college: "",
  participationType: "offline",
  trainingOption: "without-training",
  memberCount: "2",
  teamMembers: ["", ""],
  nationality: "Indian",
  utrNumber: "",
};

export default function Registration() {
  const [form, setForm] = useState(initial);
  const [state, setState] = useState({ busy: false, type: "", text: "" });
  const [step, setStep] = useState(1);

  const change = (e) => {
    const { name, value } = e.target;
    if (name === "memberCount") {
      const count = Number(value);
      setForm((f) => ({
        ...f,
        memberCount: value,
        teamMembers: Array.from(
          { length: count },
          (_, i) => f.teamMembers[i] || "",
        ),
      }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const member = (i, value) =>
    setForm((f) => ({
      ...f,
      teamMembers: f.teamMembers.map((m, n) => (n === i ? value : m)),
    }));

  const getPrice = () => {
    if (form.participationType === "offline") {
      return form.trainingOption === "with-training" ? 699 : 599;
    } else {
      return form.trainingOption === "with-training" ? 499 : 399;
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setState({ busy: true, type: "", text: "" });

    try {
      const payload = { ...form, teamLeader: form.teamMembers[0] };
      const r = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const d = await r.json();
      if (!r.ok) throw new Error(d.error || d.message || "Registration failed");

      setState({
        busy: false,
        type: "success",
        text: `Registration successful. Reference: ${d.registration?._id || "received"}`,
      });
      setForm(initial);
    } catch (err) {
      setState({ busy: false, type: "error", text: err.message });
    }
  };

  return (
    <main className="page-shell">
      <div className="container">
        <header className="page-hero">
          <span className="kicker">// GAMEATHON 8.0 · 2026</span>
          <h1>Build with us.</h1>
          <p>
            Register your interest now. Final event dates, participation rules,
            and challenge details will be shared when announced.
          </p>
        </header>

        <form className="registration-form card" onSubmit={submit}>

          {/*
          <div className="form-group">
            <label>Nationality</label>
            <div style={{ display: 'flex', gap: '20px', padding: '10px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'none', letterSpacing: 'normal', color: 'var(--text)' }}>
                <input type="radio" name="nationality" value="Indian" checked={form.nationality === 'Indian'} onChange={change} />
                Indian National
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'none', letterSpacing: 'normal', color: 'var(--text)' }}>
                <input type="radio" name="nationality" value="Foreign" checked={form.nationality === 'Foreign'} onChange={change} />
                Foreign National
              </label>
            </div>
          </div>
          */}

          {step === 1 && (
            <>
              <div className="form-row">
            <Field
              label="Team name"
              name="teamName"
              value={form.teamName}
              onChange={change}
            />
            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={change}
            />
          </div>

          <div className="form-row">
            <Field
              label="Phone"
              name="phone"
              type="tel"
              pattern="[0-9]{10}"
              maxLength="10"
              minLength="10"
              title="Please enter a valid 10-digit phone number"
              value={form.phone}
              onChange={change}
            />
            <Field
              label="College / organization"
              name="college"
              value={form.college}
              onChange={change}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Participation Type</label>
              <div style={{ display: "flex", gap: "20px", padding: "10px 0" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    textTransform: "none",
                    letterSpacing: "normal",
                    color: "var(--text)",
                  }}
                >
                  <input
                    type="radio"
                    name="participationType"
                    value="offline"
                    checked={form.participationType === "offline"}
                    onChange={change}
                  />
                  Offline
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    textTransform: "none",
                    letterSpacing: "normal",
                    color: "var(--text)",
                  }}
                >
                  <input
                    type="radio"
                    name="participationType"
                    value="online"
                    checked={form.participationType === "online"}
                    onChange={change}
                  />
                  Online
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Training Option</label>
              <div style={{ display: "flex", gap: "20px", padding: "10px 0" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    textTransform: "none",
                    letterSpacing: "normal",
                    color: "var(--text)",
                  }}
                >
                  <input
                    type="radio"
                    name="trainingOption"
                    value="with-training"
                    checked={form.trainingOption === "with-training"}
                    onChange={change}
                  />
                  With Training
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    textTransform: "none",
                    letterSpacing: "normal",
                    color: "var(--text)",
                  }}
                >
                  <input
                    type="radio"
                    name="trainingOption"
                    value="without-training"
                    checked={form.trainingOption === "without-training"}
                    onChange={change}
                  />
                  Without Training
                </label>
              </div>
            </div>
          </div>

          <Select
            label="Team size"
            name="memberCount"
            value={form.memberCount}
            onChange={change}
            options={[
              [2, "2 creators"],
              [3, "3 creators"],
              [4, "4 creators"],
            ]}
          />

          <div className="form-row">
            {form.teamMembers.map((m, i) => (
              <Field
                key={i}
                label={i === 0 ? `Creator 1 (Team Lead)` : `Creator ${i + 1}`}
                value={m}
                onChange={(e) => member(i, e.target.value)}
              />
            ))}
          </div>
            </>
          )}

          {step === 2 && (
          <div
            style={{
              padding: "25px",
              border: "1px solid var(--accent)",
              borderRadius: "8px",
              marginBottom: "20px",
              background: "rgba(168,85,247,.04)",
              boxShadow: "0 0 20px rgba(168, 85, 247, 0.15), inset 0 0 10px rgba(168, 85, 247, 0.05)",
              color: "var(--text)",
              fontFamily: "monospace"
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(168, 85, 247, 0.3)', paddingBottom: '15px', marginBottom: '20px' }}>
              <h3
                style={{
                  fontSize: "1.2rem",
                  color: "var(--accent)",
                  textTransform: "uppercase",
                  margin: 0,
                  letterSpacing: "1px",
                  textShadow: "0 0 10px rgba(168, 85, 247, 0.5)"
                }}
              >
                ENCRYPTED GATEWAY // PAYMENT_PENDING
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent)', fontSize: '0.8rem', opacity: 0.8 }}>
                <Lock size={14} /> SECURE
              </div>
            </div>
            
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "30px",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  flex: "1",
                  minWidth: "200px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative"
                }}
              >
                <div style={{ 
                  background: '#fff', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  boxShadow: '0 0 25px rgba(168, 85, 247, 0.4), 0 0 50px rgba(168, 85, 247, 0.2)', 
                  marginBottom: '15px',
                  border: '2px solid var(--accent)',
                  position: 'relative'
                }}>
                  <img 
                    src="/upi-qr.png" 
                    alt="UPI Payment QR Code" 
                    style={{ width: "100%", maxWidth: "180px", height: "auto", display: 'block' }} 
                  />
                  <div style={{ borderTop: '2px dashed var(--accent)', marginTop: '10px', paddingTop: '10px', textAlign: 'center', color: '#000', fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '2px' }}>
                    SCAN_TO_PAY
                  </div>
                </div>
              </div>
              
              <div style={{ flex: "1.5", minWidth: "250px" }}>
                <div style={{ background: 'var(--surface)', padding: '15px', borderRadius: '4px', borderLeft: '3px solid var(--accent)', marginBottom: '20px' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)', lineHeight: '1.6' }}>
                    [SYS] Polling gateway interface...<br/>
                    [SYS] Handshake init to NODE_77...<br/>
                    [CRIT] Complete payment of <strong style={{color: '#FF003C'}}>₹{getPrice()}</strong> to unlock tunnel.
                  </p>
                </div>
                
                <div style={{ marginBottom: "15px", display: 'flex', justifyContent: 'space-between', color: 'var(--accent)', fontSize: '0.85rem' }}>
                  <span>12-DIGIT UTR HASH</span>
                  <span style={{ color: '#FF003C' }}>REQUIRED</span>
                </div>
                
                <input
                  name="utrNumber"
                  value={form.utrNumber}
                  onChange={change}
                  placeholder="XXXX-XXXX-XXXX"
                  pattern="[0-9]{12}"
                  maxLength="12"
                  minLength="12"
                  title="Please enter a valid 12-digit UTR number"
                  required={true}
                  style={{
                    width: '100%',
                    background: 'var(--surface)',
                    border: '1px solid rgba(168, 85, 247, 0.5)',
                    borderLeft: '4px solid var(--accent)',
                    borderRight: '4px solid var(--accent)',
                    padding: '12px 15px',
                    color: 'var(--accent)',
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    outline: 'none',
                    letterSpacing: '2px',
                    textAlign: 'center',
                    marginBottom: '5px'
                  }}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 15px rgba(168, 85, 247, 0.3)'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                />
                <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--muted)', marginTop: '10px' }}>
                  {form.utrNumber.length === 12 ? <span style={{color: 'var(--accent)'}}>HASH_VALIDATED // READY</span> : 'AWAITING_INPUT'}
                </div>
              </div>
            </div>
          </div>
          )}


          {step === 2 && (
            <label className="consent">
              <input type="checkbox" required /> I confirm that these contact and
              team details are accurate.
            </label>
          )}

          {state.text && (
            <div className={`form-message ${state.type}`} style={{ marginTop: '20px', marginBottom: '0' }}>{state.text}</div>
          )}

          {step === 1 ? (
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 22 }}
              type="submit"
            >
              Proceed to Payment
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '15px', marginTop: 22 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: '1', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', fontFamily: 'monospace', textTransform: 'uppercase' }}
                onClick={() => setStep(1)}
                disabled={state.busy}
              >
                {"< ABORT"}
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: '2', background: 'var(--accent)', color: '#fff', border: 'none', fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 'bold' }}
                type="submit"
                disabled={state.busy || form.utrNumber.length !== 12}
              >
                {state.busy ? (
                  <>
                    <LoaderCircle className="spin" size={18} /> PROCESSING...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> VERIFY TRANSACTION
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}

function Field({ label, ...props }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input required autoComplete="off" {...props} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <select required {...props}>
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
