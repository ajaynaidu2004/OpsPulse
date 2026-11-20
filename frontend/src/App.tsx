import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { createDevice, getDevices, getIncidents, login, logout } from './api';
import type { Device, Incident } from './types';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('opspulse_token'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [hostname, setHostname] = useState('');
  const [target, setTarget] = useState('');
  const [checkType, setCheckType] = useState<'http' | 'tcp'>('http');

  const refresh = useCallback(async () => {
    const [deviceRows, incidentRows] = await Promise.all([getDevices(), getIncidents()]);
    setDevices(deviceRows);
    setIncidents(incidentRows);
  }, []);

  useEffect(() => {
    if (!token) return;
    refresh().catch((err: Error) => setError(err.message));
  }, [token, refresh]);

  const counts = useMemo(() => ({
    total: devices.length,
    up: devices.filter((device) => device.last_status === 'up').length,
    down: devices.filter((device) => device.last_status === 'down').length,
    open: incidents.filter((incident) => incident.status !== 'resolved').length,
  }), [devices, incidents]);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await login(email, password);
      localStorage.setItem('opspulse_token', result.data.token);
      setToken(result.data.token);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    try { await logout(); } catch { /* Expired tokens can still be cleared locally. */ }
    localStorage.removeItem('opspulse_token');
    setToken(null);
    setDevices([]);
    setIncidents([]);
  }

  async function handleCreateDevice(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await createDevice({
        name: deviceName,
        hostname,
        target,
        check_type: checkType,
        interval_seconds: 60,
        timeout_seconds: 5,
      });
      setDeviceName('');
      setHostname('');
      setTarget('');
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!token) {
    return (
      <main className="login-shell">
        <form className="login-card" onSubmit={handleLogin}>
          <div className="brand-mark">OP</div>
          <p className="eyebrow">INFRASTRUCTURE OPERATIONS</p>
          <h1>Welcome to OpsPulse</h1>
          <p className="muted">Sign in to monitor devices and manage incidents.</p>
          {error && <div className="error">{error}</div>}
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <button className="primary full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          <p className="hint">New here? Register through <code>POST /api/register</code> first.</p>
        </form>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark small">OP</span><strong>OpsPulse</strong></div>
        <div className="nav-label">WORKSPACE</div>
        <a className="nav-item active" href="#overview">▦ <span>Overview</span></a>
        <a className="nav-item" href="#devices">▣ <span>Devices</span></a>
        <a className="nav-item" href="#incidents">⚑ <span>Incidents</span></a>
        <div className="sidebar-bottom">
          <div className="online-dot" /> API connection active
          <button className="ghost full" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div><p className="eyebrow">WORKSPACE / OVERVIEW</p><h1>Infrastructure overview</h1></div>
          <button className="secondary" onClick={() => refresh().catch((err: Error) => setError(err.message))}>↻ Refresh</button>
        </header>

        {error && <div className="error">{error}</div>}

        <section className="stats-grid" id="overview">
          <Stat label="Total devices" value={counts.total} note="Registered assets" />
          <Stat label="Operational" value={counts.up} note="Passing latest check" />
          <Stat label="Down" value={counts.down} note="Require attention" />
          <Stat label="Open incidents" value={counts.open} note="Not yet resolved" />
        </section>

        <section className="panel" id="devices">
          <div className="panel-heading">
            <div><p className="eyebrow">ASSET INVENTORY</p><h2>Monitored devices</h2></div>
            <button className="primary" onClick={() => setShowForm((value) => !value)}>＋ Add device</button>
          </div>

          {showForm && (
            <form className="device-form" onSubmit={handleCreateDevice}>
              <label>Device name<input value={deviceName} onChange={(e) => setDeviceName(e.target.value)} required /></label>
              <label>Hostname<input value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder="example.com" required /></label>
              <label>Check type<select value={checkType} onChange={(e) => setCheckType(e.target.value as 'http' | 'tcp')}><option value="http">HTTP</option><option value="tcp">TCP</option></select></label>
              <label>Target<input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="https://example.com" required /></label>
              <button className="primary">Save device</button>
            </form>
          )}

          <div className="table-wrap">
            <table>
              <thead><tr><th>DEVICE</th><th>TYPE</th><th>TARGET</th><th>STATUS</th><th>LAST CHECK</th></tr></thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.id}>
                    <td><strong>{device.name}</strong><small>{device.hostname}</small></td>
                    <td><span className="type-pill">{device.check_type.toUpperCase()}</span></td>
                    <td className="target-cell">{device.target}</td>
                    <td><Status status={device.last_status} /></td>
                    <td>{device.last_checked_at ? new Date(device.last_checked_at).toLocaleString() : 'Never'}</td>
                  </tr>
                ))}
                {devices.length === 0 && <tr><td colSpan={5} className="empty">No devices yet. Add a device to begin monitoring.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel" id="incidents">
          <div className="panel-heading"><div><p className="eyebrow">SERVICE HEALTH</p><h2>Recent incidents</h2></div></div>
          <div className="incident-list">
            {incidents.map((incident) => (
              <article className="incident" key={incident.id}>
                <div className={`severity ${incident.severity}`} />
                <div className="incident-main"><strong>{incident.title}</strong><small>{incident.device?.name ?? 'Unknown device'} · {new Date(incident.created_at).toLocaleString()}</small></div>
                <span className={`status-pill ${incident.status}`}>{incident.status.replace('_', ' ')}</span>
              </article>
            ))}
            {incidents.length === 0 && <p className="empty">No incidents recorded. That's good news.</p>}
          </div>
        </section>
      </section>
    </main>
  );
}

function Stat({ label, value, note }: { label: string; value: number; note: string }) {
  return <article className="stat-card"><p>{label}</p><strong>{value}</strong><small>{note}</small></article>;
}

function Status({ status }: { status: string }) {
  return <span className={`status-pill ${status}`}><i />{status}</span>;
}

export default App;
