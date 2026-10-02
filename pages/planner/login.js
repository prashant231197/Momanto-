import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Logo3D from '../../components/Logo3D';

export default function PlannerLogin() {
  const router = useRouter();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState('login');

  // Sign In Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingNotice, setPendingNotice] = useState('');
  const [focused, setFocused] = useState('');

  // Register Studio Form State
  const [regData, setRegData] = useState({
    business_name: '',
    owner_name: '',
    phone: '',
    email: '',
    city: 'Bhopal',
    password: '',
    confirmPassword: ''
  });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // Approval Modal State
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [submittedStudio, setSubmittedStudio] = useState(null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter phone/email, 2 = enter otp & new pwd
  const [forgotInput, setForgotInput] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPwd, setForgotNewPwd] = useState('');
  const [forgotConfirmPwd, setForgotConfirmPwd] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // ── HANDLE SIGN IN ──
  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPendingNotice('');

    try {
      const response = await fetch('/api/planner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('planner_token', data.token);
        localStorage.setItem('planner_data', JSON.stringify(data.planner));
        router.push('/planner/dashboard');
      } else {
        if (data.pendingApproval) {
          setPendingNotice(data.error);
        } else {
          setError(data.error || 'Login failed');
        }
      }
    } catch {
      setError('Something went wrong. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── HANDLE REGISTER STUDIO ──
  async function handleRegister(e) {
    e.preventDefault();
    setRegError('');

    if (regData.password !== regData.confirmPassword) {
      setRegError('Passwords do not match');
      return;
    }
    if (regData.password.length < 8) {
      setRegError('Password must be at least 8 characters long');
      return;
    }
    if (regData.phone.replace(/\D/g, '').length < 10) {
      setRegError('Please enter a valid 10-digit mobile number');
      return;
    }

    setRegLoading(true);

    try {
      const response = await fetch('/api/planner/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmittedStudio({
          name: regData.business_name,
          phone: regData.phone,
          email: regData.email
        });
        setShowApprovalModal(true);
        // Reset form
        setRegData({
          business_name: '',
          owner_name: '',
          phone: '',
          email: '',
          city: 'Bhopal',
          password: '',
          confirmPassword: ''
        });
      } else {
        setRegError(data.error || 'Registration failed. Please try again.');
      }
    } catch {
      setRegError('Network error. Please try again.');
    } finally {
      setRegLoading(false);
    }
  }

  // ── FORGOT PASSWORD: SEND OTP ──
  async function handleSendForgotOtp(e) {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    try {
      const res = await fetch('/api/planner/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrEmail: forgotInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerifiedPhone(data.phone);
        setForgotStep(2);
      } else {
        setForgotError(data.error || 'Account not found.');
      }
    } catch {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  }

  // ── FORGOT PASSWORD: RESET PASSWORD ──
  async function handleResetPassword(e) {
    e.preventDefault();
    setForgotError('');

    if (forgotNewPwd !== forgotConfirmPwd) {
      setForgotError('New passwords do not match');
      return;
    }
    if (forgotNewPwd.length < 8) {
      setForgotError('Password must be at least 8 characters long');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetch('/api/planner/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: verifiedPhone,
          otp: forgotOtp,
          new_password: forgotNewPwd
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotSuccess('✅ Password reset successfully! Please sign in with your new password.');
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotStep(1);
          setForgotOtp('');
          setForgotNewPwd('');
          setForgotConfirmPwd('');
          setForgotSuccess('');
          setMode('login');
        }, 1800);
      } else {
        setForgotError(data.error || 'Verification code failed');
      }
    } catch {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>{mode === 'login' ? 'Planner Sign In' : 'Register Studio'} | Momanto Partner</title>
        <link href="https://fonts.googleapis.com/css2?family=Okra:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <Logo3D size="sm" />
          <Link href="/" className="back-link">
            <span>←</span> Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <div className="page">
        {/* Left Branding Panel */}
        <div className="left-panel">
          <div className="left-content">
            <div className="brand-badge">Momanto Partner Network</div>
            <h1 className="left-heading">
              India's Premier<br />
              <span className="heading-green">Celebration Platform</span><br />
              for Planners
            </h1>
            <p className="left-sub">
              Expand your studio bookings, manage packages, track real-time doorstep setups, and receive instant direct customer payments.
            </p>

            <div className="stats-row">
              <div className="stat-pill">
                <span className="stat-num">500+</span>
                <span className="stat-label">Events Done</span>
              </div>
              <div className="stat-pill">
                <span className="stat-num">4.8★</span>
                <span className="stat-label">Avg Rating</span>
              </div>
              <div className="stat-pill">
                <span className="stat-num">20+</span>
                <span className="stat-label">Cities</span>
              </div>
            </div>

            <div className="float-card card1">
              <span className="card-emoji">🎂</span>
              <div>
                <div className="card-title">New Celebration Order!</div>
                <div className="card-sub">Royal Birthday Arch • ₹4,999</div>
              </div>
              <span className="card-badge">Instant Alert</span>
            </div>

            <div className="float-card card2">
              <span className="card-emoji">🛡️</span>
              <div>
                <div className="card-title">Verified Partner Badge</div>
                <div className="card-sub">Admin Audited & Approved Studios</div>
              </div>
              <span className="card-badge green">Trusted</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="right-panel">
          <div className="form-card">
            
            {/* Tab Switcher */}
            <div className="tab-switch">
              <button
                type="button"
                className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); setError(''); setPendingNotice(''); }}
              >
                🔐 Sign In
              </button>
              <button
                type="button"
                className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
                onClick={() => { setMode('register'); setRegError(''); }}
              >
                🏢 Register Studio
              </button>
            </div>

            {/* ════ MODE: SIGN IN ════ */}
            {mode === 'login' && (
              <>
                <div className="form-top">
                  <h2 className="form-title">Partner Sign In</h2>
                  <p className="form-sub">Access your studio orders and packages</p>
                </div>

                {pendingNotice && (
                  <div className="pending-box">
                    <span className="pending-icon">⏳</span>
                    <div>
                      <strong>Account Under Review</strong>
                      <p>{pendingNotice}</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="error-box">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="form">
                  <div className={`field ${focused === 'email' ? 'focused' : ''} ${email ? 'filled' : ''}`}>
                    <label className="field-label">Registered Email</label>
                    <div className="field-wrap">
                      <span className="field-icon">✉️</span>
                      <input
                        type="email"
                        className="field-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocused('email')}
                        onBlur={() => setFocused('')}
                        placeholder="planner@momanto.in"
                        required
                      />
                    </div>
                  </div>

                  <div className={`field ${focused === 'password' ? 'focused' : ''} ${password ? 'filled' : ''}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="field-label">Password</label>
                      <button
                        type="button"
                        className="forgot-link"
                        onClick={() => {
                          setForgotError('');
                          setForgotSuccess('');
                          setForgotStep(1);
                          setShowForgotModal(true);
                        }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="field-wrap">
                      <span className="field-icon">🔒</span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="field-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocused('password')}
                        onBlur={() => setFocused('')}
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        className="toggle-pwd-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? '👁️' : '🙈'}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? (
                      <span className="btn-loading">
                        <span className="spinner" /> Signing in...
                      </span>
                    ) : (
                      'Sign In to Dashboard →'
                    )}
                  </button>
                </form>
              </>
            )}

            {/* ════ MODE: REGISTER STUDIO ════ */}
            {mode === 'register' && (
              <>
                <div className="form-top">
                  <h2 className="form-title">Join as a Partner</h2>
                  <p className="form-sub">Register your decor studio for admin approval</p>
                </div>

                {regError && (
                  <div className="error-box">
                    <span>⚠️</span> {regError}
                  </div>
                )}

                <form onSubmit={handleRegister} className="form">
                  <div className="field">
                    <label className="field-label">Studio / Business Name *</label>
                    <div className="field-wrap">
                      <span className="field-icon">🎨</span>
                      <input
                        type="text"
                        className="field-input"
                        value={regData.business_name}
                        onChange={e => setRegData({ ...regData, business_name: e.target.value })}
                        placeholder="e.g. Royal Decorators Bhopal"
                        required
                      />
                    </div>
                  </div>

                  <div className="field-grid-2">
                    <div className="field">
                      <label className="field-label">Owner Name</label>
                      <div className="field-wrap">
                        <span className="field-icon">👤</span>
                        <input
                          type="text"
                          className="field-input"
                          value={regData.owner_name}
                          onChange={e => setRegData({ ...regData, owner_name: e.target.value })}
                          placeholder="Your Name"
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label className="field-label">City *</label>
                      <div className="field-wrap">
                        <span className="field-icon">📍</span>
                        <input
                          type="text"
                          className="field-input"
                          value={regData.city}
                          onChange={e => setRegData({ ...regData, city: e.target.value })}
                          placeholder="Bhopal / Indore"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="field-grid-2">
                    <div className="field">
                      <label className="field-label">WhatsApp Number *</label>
                      <div className="field-wrap">
                        <span className="field-icon">📞</span>
                        <input
                          type="tel"
                          className="field-input"
                          value={regData.phone}
                          onChange={e => setRegData({ ...regData, phone: e.target.value })}
                          placeholder="9876543210"
                          maxLength={12}
                          required
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label className="field-label">Email ID *</label>
                      <div className="field-wrap">
                        <span className="field-icon">✉️</span>
                        <input
                          type="email"
                          className="field-input"
                          value={regData.email}
                          onChange={e => setRegData({ ...regData, email: e.target.value })}
                          placeholder="studio@example.com"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="field-grid-2">
                    <div className="field">
                      <label className="field-label">Create Password *</label>
                      <div className="field-wrap">
                        <span className="field-icon">🔒</span>
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          className="field-input"
                          value={regData.password}
                          onChange={e => setRegData({ ...regData, password: e.target.value })}
                          placeholder="Min 8 characters"
                          required
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label className="field-label">Confirm Password *</label>
                      <div className="field-wrap">
                        <span className="field-icon">🔑</span>
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          className="field-input"
                          value={regData.confirmPassword}
                          onChange={e => setRegData({ ...regData, confirmPassword: e.target.value })}
                          placeholder="Re-enter password"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '-4px 0 4px' }}>
                    <input
                      type="checkbox"
                      id="showRegPwd"
                      checked={showRegPassword}
                      onChange={e => setShowRegPassword(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="showRegPwd" style={{ fontSize: 12, color: '#6B7280', cursor: 'pointer' }}>
                      Show password
                    </label>
                  </div>

                  <button type="submit" className="submit-btn" disabled={regLoading}>
                    {regLoading ? (
                      <span className="btn-loading">
                        <span className="spinner" /> Submitting Application...
                      </span>
                    ) : (
                      'Submit Studio for Admin Approval →'
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Security Badge Footer */}
            <div className="security-footer">
              <div className="sec-badge">
                <span className="sec-icon">🛡️</span>
                <div>
                  <div className="sec-title">Momanto Verified Partner Onboarding</div>
                  <div className="sec-desc">All new decorators undergo 100% Admin audit before going live.</div>
                </div>
              </div>
              <p className="sec-help">
                Need urgent onboarding support? Contact <a href="mailto:admin@momanto.in">admin@momanto.in</a>
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* ════ APPLICATION SUBMITTED POPUP MODAL ════ */}
      {showApprovalModal && (
        <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '16px 8px 8px' }}>
              <div className="success-icon-wrap">🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#166534', margin: '14px 0 8px' }}>
                Application Submitted for Approval!
              </h2>
              <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6, marginBottom: 18 }}>
                Thank you for applying to partner with <strong>Momanto</strong>! Your studio account (<strong>{submittedStudio?.name}</strong>) has been forwarded to our <strong>Admin Verification Desk</strong>.
              </p>
              
              <div className="approval-card">
                <div className="approval-step">
                  <span>1️⃣</span>
                  <div>
                    <strong>Admin Verification</strong>
                    <p>Our onboarding team will review your contact details and studio profile.</p>
                  </div>
                </div>
                <div className="approval-step">
                  <span>2️⃣</span>
                  <div>
                    <strong>Direct Contact & Activation</strong>
                    <p>You will receive an approval confirmation on WhatsApp & Email once approved.</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="submit-btn"
                style={{ marginTop: 20 }}
                onClick={() => {
                  setShowApprovalModal(false);
                  setMode('login');
                  setPendingNotice('Your studio application has been submitted and is currently pending Admin review.');
                }}
              >
                Go to Sign In →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ FORGOT PASSWORD MODAL ════ */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header-bar">
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>🔐 Reset Planner Password</h3>
              <button className="modal-close-btn" onClick={() => setShowForgotModal(false)}>✕</button>
            </div>

            {forgotError && (
              <div className="error-box" style={{ margin: '12px 0' }}>
                <span>⚠️</span> {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="success-box" style={{ margin: '12px 0' }}>
                {forgotSuccess}
              </div>
            )}

            {forgotStep === 1 && !forgotSuccess && (
              <form onSubmit={handleSendForgotOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                  Enter your registered mobile number or email ID. We will send a secure 4-digit verification code.
                </p>
                <div className="field">
                  <label className="field-label">Mobile Number or Email *</label>
                  <div className="field-wrap">
                    <span className="field-icon">📱</span>
                    <input
                      type="text"
                      className="field-input"
                      value={forgotInput}
                      onChange={e => setForgotInput(e.target.value)}
                      placeholder="e.g. 9876543210 or planner@momanto.in"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="submit-btn" disabled={forgotLoading}>
                  {forgotLoading ? 'Sending Verification Code...' : 'Send OTP →'}
                </button>
              </form>
            )}

            {forgotStep === 2 && !forgotSuccess && (
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
                <p style={{ fontSize: 13, color: '#15803D', margin: 0, fontWeight: 600 }}>
                  OTP sent to number ending in ...{verifiedPhone.slice(-4)}
                </p>

                <div className="field">
                  <label className="field-label">4-Digit Verification Code *</label>
                  <div className="field-wrap">
                    <span className="field-icon">🔢</span>
                    <input
                      type="text"
                      className="field-input"
                      value={forgotOtp}
                      onChange={e => setForgotOtp(e.target.value)}
                      placeholder="e.g. 4821"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">New Password *</label>
                  <div className="field-wrap">
                    <span className="field-icon">🔒</span>
                    <input
                      type="password"
                      className="field-input"
                      value={forgotNewPwd}
                      onChange={e => setForgotNewPwd(e.target.value)}
                      placeholder="Min 8 characters"
                      required
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Confirm New Password *</label>
                  <div className="field-wrap">
                    <span className="field-icon">🔑</span>
                    <input
                      type="password"
                      className="field-input"
                      value={forgotConfirmPwd}
                      onChange={e => setForgotConfirmPwd(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="submit-btn" disabled={forgotLoading}>
                  {forgotLoading ? 'Resetting Password...' : 'Reset & Save Password →'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --green:      #1a9e3f;
    --green-dark: #157a32;
    --green-light:#e8f5ec;
    --green-mid:  #c8ecd2;
    --white:      #ffffff;
    --ink:        #1c1c1c;
    --muted:      #6b7280;
    --border:     #e5e7eb;
    --bg:         #f8fdf9;
    --red:        #e23744;
  }

  body {
    font-family: 'Okra', 'Segoe UI', sans-serif;
    background: var(--bg);
    color: var(--ink);
    overflow-x: hidden;
  }

  /* Navbar */
  .navbar {
    position: sticky; top: 0; z-index: 100;
    background: var(--white);
    border-bottom: 1px solid var(--border);
    box-shadow: 0 1px 8px rgba(0,0,0,0.06);
  }
  .navbar-inner {
    max-width: 1300px; margin: 0 auto;
    padding: 0 28px; height: 64px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .back-link {
    display: flex; align-items: center; gap: 6px;
    font-size: 14px; font-weight: 600; color: var(--muted);
    text-decoration: none; transition: color 0.2s;
  }
  .back-link:hover { color: var(--green); }

  /* Page Layout */
  .page {
    display: flex; min-height: calc(100vh - 64px);
  }

  /* Left Panel */
  .left-panel {
    flex: 1;
    background: linear-gradient(145deg, #0d7a2e 0%, #1a9e3f 40%, #22c55e 100%);
    padding: 60px 56px;
    display: flex; align-items: center;
    position: relative; overflow: hidden;
  }
  .left-panel::before {
    content: '';
    position: absolute; inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
  .left-content { position: relative; z-index: 2; max-width: 480px; }

  .brand-badge {
    display: inline-flex; align-items: center;
    background: rgba(255,255,255,0.2); color: #fff;
    font-size: 12px; font-weight: 700; letter-spacing: 0.5px;
    padding: 6px 14px; border-radius: 50px;
    border: 1px solid rgba(255,255,255,0.3);
    margin-bottom: 24px; backdrop-filter: blur(8px);
  }

  .left-heading {
    font-size: clamp(30px, 3.8vw, 46px);
    font-weight: 800; color: #fff;
    line-height: 1.15; margin-bottom: 20px;
    letter-spacing: -0.5px;
  }
  .heading-green {
    color: #bbf7d0;
  }

  .left-sub {
    font-size: 15px; font-weight: 500;
    color: rgba(255,255,255,0.85);
    line-height: 1.6; margin-bottom: 36px;
  }

  .stats-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 36px; }
  .stat-pill {
    background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 12px; padding: 10px 18px;
    display: flex; flex-direction: column; gap: 2px;
  }
  .stat-num { font-size: 18px; font-weight: 800; color: #fff; }
  .stat-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.7); }

  .float-card {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,0.95); backdrop-filter: blur(12px);
    border-radius: 14px; padding: 12px 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    margin-bottom: 12px;
  }
  .card-emoji { font-size: 24px; }
  .card-title { font-size: 13px; font-weight: 700; color: var(--ink); }
  .card-sub { font-size: 11.5px; font-weight: 500; color: var(--muted); margin-top: 1px; }
  .card-badge {
    margin-left: auto; font-size: 11px; font-weight: 700;
    background: #fff3e0; color: #e65100;
    padding: 3px 8px; border-radius: 50px;
  }
  .card-badge.green { background: var(--green-light); color: var(--green-dark); }

  /* Right Panel */
  .right-panel {
    width: 520px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    padding: 40px 32px;
    background: var(--white);
  }

  .form-card { width: 100%; max-width: 440px; }

  /* Tab Switcher */
  .tab-switch {
    display: flex; background: #f1f5f9; padding: 4px; border-radius: 12px;
    margin-bottom: 24px; border: 1px solid #e2e8f0;
  }
  .tab-btn {
    flex: 1; padding: 10px 14px; font-size: 13.5px; font-weight: 700;
    border: none; background: transparent; color: #64748b; border-radius: 9px;
    cursor: pointer; transition: all 0.2s; font-family: inherit;
  }
  .tab-btn.active {
    background: var(--white); color: var(--ink);
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  .form-top { text-align: left; margin-bottom: 22px; }
  .form-title { font-size: 24px; font-weight: 800; color: var(--ink); margin-bottom: 4px; }
  .form-sub { font-size: 13.5px; font-weight: 500; color: var(--muted); }

  /* Alerts */
  .error-box {
    background: #fff0f1; border: 1.5px solid #ffd5d8;
    border-radius: 10px; padding: 10px 14px;
    font-size: 12.5px; font-weight: 600; color: var(--red);
    display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
  }
  .pending-box {
    background: #fffbeb; border: 1.5px solid #fef3c7;
    border-radius: 10px; padding: 12px 14px;
    font-size: 12.5px; color: #92400e;
    display: flex; gap: 10px; margin-bottom: 16px;
  }
  .pending-box strong { display: block; font-size: 13px; color: #78350f; margin-bottom: 2px; }
  .pending-icon { font-size: 20px; }
  .success-box {
    background: #f0fdf4; border: 1.5px solid #bbf7d0;
    border-radius: 10px; padding: 12px 14px;
    font-size: 13px; font-weight: 700; color: #166534;
  }

  /* Form Elements */
  .form { display: flex; flex-direction: column; gap: 14px; }
  .field-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .field { display: flex; flex-direction: column; gap: 5px; }
  .field-label { font-size: 12.5px; font-weight: 700; color: var(--ink); }
  .field-wrap {
    display: flex; align-items: center;
    border: 1.5px solid var(--border); border-radius: 10px;
    background: #fcfdfd; overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .field-wrap:focus-within {
    border-color: var(--green);
    box-shadow: 0 0 0 3px rgba(26,158,63,0.12);
    background: var(--white);
  }
  .field-icon {
    padding: 0 10px 0 12px; font-size: 15px;
    border-right: 1px solid var(--border);
    height: 44px; display: flex; align-items: center;
  }
  .field-input {
    flex: 1; border: none; background: transparent;
    padding: 0 12px; height: 44px;
    font-family: inherit; font-size: 13.5px; font-weight: 500;
    color: var(--ink); outline: none;
  }
  .field-input::placeholder { color: #94a3b8; }

  .toggle-pwd-btn {
    background: none; border: none; cursor: pointer;
    font-size: 15px; padding: 0 12px; color: var(--muted);
    height: 44px; display: flex; align-items: center;
  }
  .forgot-link {
    background: none; border: none; font-size: 11.5px; font-weight: 700;
    color: var(--green); cursor: pointer; text-decoration: none; padding: 0;
  }
  .forgot-link:hover { text-decoration: underline; }

  /* Submit Button */
  .submit-btn {
    width: 100%; height: 48px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, var(--green) 0%, #22c55e 100%);
    color: #fff; font-family: inherit;
    font-size: 15px; font-weight: 800; cursor: pointer;
    box-shadow: 0 4px 14px rgba(26,158,63,0.3);
    transition: transform 0.2s, box-shadow 0.2s;
    margin-top: 4px;
    display: flex; align-items: center; justify-content: center;
  }
  .submit-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(26,158,63,0.4);
  }
  .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
  .btn-loading { display: flex; align-items: center; gap: 8px; }
  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff; border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Security Footer */
  .security-footer {
    margin-top: 24px; padding-top: 18px;
    border-top: 1px solid var(--border);
  }
  .sec-badge {
    display: flex; align-items: center; gap: 10px;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    padding: 10px 12px; border-radius: 10px;
  }
  .sec-icon { font-size: 18px; }
  .sec-title { font-size: 12px; font-weight: 800; color: #166534; }
  .sec-desc { font-size: 11px; font-weight: 500; color: #15803d; margin-top: 1px; }
  .sec-help {
    font-size: 11.5px; font-weight: 500; color: var(--muted);
    text-align: center; margin-top: 10px;
  }
  .sec-help a { color: var(--green); font-weight: 700; text-decoration: none; }

  /* Modals */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(15,23,42,0.65);
    backdrop-filter: blur(4px); z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }
  .modal-box {
    background: #fff; width: 100%; max-width: 440px;
    border-radius: 18px; padding: 26px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.25);
    animation: popIn 0.25s ease-out;
  }
  @keyframes popIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .modal-header-bar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px;
  }
  .modal-close-btn {
    background: #f1f5f9; border: none; width: 28px; height: 28px;
    border-radius: 50%; font-size: 13px; font-weight: 800; color: #64748b;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
  }
  .success-icon-wrap {
    width: 64px; height: 64px; border-radius: 50%;
    background: #dcfce7; margin: 0 auto; display: flex;
    align-items: center; justify-content: center; font-size: 32px;
  }
  .approval-card {
    background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 12px; padding: 14px; text-align: left;
    display: flex; flex-direction: column; gap: 10px;
  }
  .approval-step { display: flex; gap: 10px; font-size: 12.5px; }
  .approval-step strong { display: block; color: #0f172a; margin-bottom: 1px; }
  .approval-step p { color: #64748b; margin: 0; line-height: 1.4; }

  @media (max-width: 900px) {
    .page { flex-direction: column; }
    .left-panel { padding: 40px 24px; }
    .right-panel { width: 100%; padding: 32px 20px; }
    .float-card { display: none; }
    .stats-row { margin-bottom: 0; }
  }
`;