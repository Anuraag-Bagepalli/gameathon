import { useState } from 'react'; 
import { CheckCircle2, LoaderCircle, Users, QrCode } from 'lucide-react'; 
import { API_URL } from '../config';

const initial = {
  teamName: '',
  teamLeader: '',
  email: '',
  phone: '',
  college: '',
  participationType: 'offline',
  trainingOption: 'without-training',
  memberCount: '2',
  teamMembers: ['', ''],
  nationality: 'Indian',
  utrNumber: ''
};

export default function Registration() {
  const [form, setForm] = useState(initial);
  const [state, setState] = useState({ busy: false, type: '', text: '' });

  const change = e => {
    const { name, value } = e.target;
    if (name === 'memberCount') {
      const count = Number(value);
      setForm(f => ({
        ...f, 
        memberCount: value, 
        teamMembers: Array.from({ length: count }, (_, i) => f.teamMembers[i] || '')
      }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const member = (i, value) => setForm(f => ({
    ...f, 
    teamMembers: f.teamMembers.map((m, n) => n === i ? value : m)
  }));

  const getPrice = () => {
    if (form.participationType === 'offline') {
      return form.trainingOption === 'with-training' ? 699 : 599;
    } else {
      return form.trainingOption === 'with-training' ? 499 : 399;
    }
  };

  const submit = async e => {
    e.preventDefault();
    setState({ busy: true, type: '', text: '' });
    
    try {
      const payload = { ...form, teamLeader: form.teamMembers[0] };
      const r = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || d.message || 'Registration failed');
      
      setState({ busy: false, type: 'success', text: `Registration successful. Reference: ${d.registration?._id || 'received'}` });
      setForm(initial);
    } catch (err) {
      setState({ busy: false, type: 'error', text: err.message });
    }
  };

  return (
    <main className="page-shell">
      <div className="container">
        <header className="page-hero">
          <span className="kicker">// GAMEATHON 8.0 · 2026</span>
          <h1>Build with us.</h1>
          <p>Register your interest now. Final event dates, participation rules, and challenge details will be shared when announced.</p>
        </header>

        <form className="registration-form card" onSubmit={submit}>
          {state.text && <div className={`form-message ${state.type}`}>{state.text}</div>}
          
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

          <div className="form-row">
            <Field label="Team name" name="teamName" value={form.teamName} onChange={change} />
            <Field label="Email" name="email" type="email" value={form.email} onChange={change} />
          </div>

          <div className="form-row">
            <Field label="Phone" name="phone" type="tel" pattern="[0-9+ -]{10,15}" value={form.phone} onChange={change} />
            <Field label="College / organization" name="college" value={form.college} onChange={change} />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Participation Type</label>
              <div style={{ display: 'flex', gap: '20px', padding: '10px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'none', letterSpacing: 'normal', color: 'var(--text)' }}>
                  <input type="radio" name="participationType" value="offline" checked={form.participationType === 'offline'} onChange={change} />
                  Offline
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'none', letterSpacing: 'normal', color: 'var(--text)' }}>
                  <input type="radio" name="participationType" value="online" checked={form.participationType === 'online'} onChange={change} />
                  Online
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Training Option</label>
              <div style={{ display: 'flex', gap: '20px', padding: '10px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'none', letterSpacing: 'normal', color: 'var(--text)' }}>
                  <input type="radio" name="trainingOption" value="with-training" checked={form.trainingOption === 'with-training'} onChange={change} />
                  With Training
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'none', letterSpacing: 'normal', color: 'var(--text)' }}>
                  <input type="radio" name="trainingOption" value="without-training" checked={form.trainingOption === 'without-training'} onChange={change} />
                  Without Training
                </label>
              </div>
            </div>
          </div>
          
          <Select label="Team size" name="memberCount" value={form.memberCount} onChange={change} options={[[2,'2 creators'],[3,'3 creators'],[4,'4 creators']]} />
          
          <div className="form-row">
            {form.teamMembers.map((m, i) => (
              <Field key={i} label={i === 0 ? `Creator 1 (Team Lead)` : `Creator ${i + 1}`} value={m} onChange={e => member(i, e.target.value)} />
            ))}
          </div>

          {form.nationality === 'Indian' ? (
            <div style={{ padding: '20px', border: '1px solid var(--line)', borderRadius: '8px', marginBottom: '20px', background: 'rgba(168,85,247,.04)' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '1.1rem', color: 'var(--accent)', textTransform: 'uppercase' }}>Payment Details - Amount: ₹{getPrice()}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ flex: '1', minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', border: '1px dashed var(--accent)', borderRadius: '8px', background: 'var(--surface)' }}>
                  <QrCode size={48} color="var(--accent)" style={{ opacity: 0.5, marginBottom: '10px' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center' }}>[UPI QR Placeholder]</span>
                </div>
                <div style={{ flex: '2', minWidth: '250px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '15px' }}>Please scan the QR code to complete the registration fee payment of <strong>₹{getPrice()}</strong>. Enter your transaction UTR number below.</p>
                  <Field label="Transaction UTR Number" name="utrNumber" value={form.utrNumber} onChange={change} placeholder="Enter 12-digit UTR" required={true} />
                </div>
              </div>
            </div>
          ) : (
             <div className="interest-note" style={{ padding: '20px', border: '1px solid var(--line)', borderRadius: '8px', marginBottom: '20px', background: 'var(--surface)' }}>
               <Users />
               <div>
                 <strong>Foreign National Registration</strong>
                 <p>No payment mode required. Submit your registration and we'll process your application.</p>
               </div>
             </div>
          )}
          
          <label className="consent">
            <input type="checkbox" required /> I confirm that these contact and team details are accurate.
          </label>
          
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 22 }} disabled={state.busy}>
            {state.busy ? <><LoaderCircle className="spin" size={18} /> Sending...</> : <><CheckCircle2 size={18} /> Submit Registration</>}
          </button>
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
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </div>
  );
}
