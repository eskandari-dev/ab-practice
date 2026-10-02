import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth-context.js'
import { LANGUAGES } from '../languages.js'
import { COUNTRIES, countryName, findPlace } from '../places.js'
import { refreshRegions } from '../regions-data.js'
import { CheckIcon, ExamIcon, LockIcon } from '../components/Icons.jsx'

const ALL_LANGS = LANGUAGES.map((l) => l.code)

function RulesEditor({ regionId, rules, onSaved }) {
  const [form, setForm] = useState(null)
  const [message, setMessage] = useState(null)

  if (!rules) return <div className="admin-card"><p className="muted">Loading rules...</p></div>

  const value = form || {
    questions: rules.questions,
    pass_correct: rules.pass_correct,
    time_limit: rules.time_limit ?? '',
    note: rules.note || '',
    verified: Boolean(rules.verified),
    sections: JSON.stringify(rules.sections, null, 2),
  }

  function change(field, v) {
    setForm({ ...value, [field]: v })
    setMessage(null)
  }

  async function save(e) {
    e.preventDefault()
    try {
      const saved = await api('/admin/rules/' + regionId, {
        method: 'PUT',
        body: {
          questions: Number(value.questions),
          pass_correct: Number(value.pass_correct),
          time_limit: value.time_limit === '' ? null : Number(value.time_limit),
          note: value.note,
          verified: value.verified,
          sections: JSON.parse(value.sections || '[]'),
        },
      })
      setForm(null)
      setMessage({ ok: true, text: 'Saved' })
      onSaved(saved)
    } catch (err) {
      setMessage({ ok: false, text: err instanceof SyntaxError ? 'Sections must be valid JSON' : err.message })
    }
  }

  return (
    <form className="admin-card" onSubmit={save}>
      <div className="admin-card-head">
        <h2>Exam rules</h2>
        <span className={'status' + (value.verified ? ' status-live' : '')}>
          {value.verified ? 'Verified' : 'Not verified'}
        </span>
      </div>
      <div className="admin-grid">
        <label className="field">
          <span>Questions in a full exam</span>
          <input type="number" min="1" value={value.questions} onChange={(e) => change('questions', e.target.value)} />
        </label>
        <label className="field">
          <span>Correct answers to pass</span>
          <input type="number" min="1" value={value.pass_correct} onChange={(e) => change('pass_correct', e.target.value)} />
        </label>
        <label className="field">
          <span>Time limit (minutes, empty = none)</span>
          <input type="number" min="1" value={value.time_limit} onChange={(e) => change('time_limit', e.target.value)} />
        </label>
      </div>
      <label className="field">
        <span>Note</span>
        <input value={value.note} onChange={(e) => change('note', e.target.value)} />
      </label>
      <label className="field">
        <span>Sections (each part has its own pass mark)</span>
        <textarea rows="5" value={value.sections} onChange={(e) => change('sections', e.target.value)} />
      </label>
      <div className="admin-actions">
        <label className="check">
          <input type="checkbox" checked={value.verified} onChange={(e) => change('verified', e.target.checked)} />
          Checked with the official source
        </label>
        {message && <span className={message.ok ? 'admin-ok' : 'admin-error'}>{message.text}</span>}
        <button className="btn-next" type="submit">Save rules</button>
      </div>
    </form>
  )
}

function Generator({ regionId, regionName, onCreated }) {
  const file = useRef(null)
  const [text, setText] = useState('')
  const [count, setCount] = useState(10)
  const [langs, setLangs] = useState(ALL_LANGS)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  function toggle(code) {
    if (code === 'en') return
    setLangs(langs.includes(code) ? langs.filter((l) => l !== code) : [...langs, code])
  }

  async function generate(e) {
    e.preventDefault()
    const body = new FormData()
    body.append('region', regionId)
    body.append('region_name', regionName)
    body.append('count', count)
    body.append('languages', langs.join(','))
    body.append('text', text)
    if (file.current.files[0]) body.append('file', file.current.files[0])
    setBusy(true)
    setMessage(null)
    try {
      const made = await api('/admin/generate', { method: 'POST', body })
      setMessage({ ok: true, text: made.length + ' draft questions created. Check them below, then approve.' })
      onCreated()
    } catch (err) {
      setMessage({ ok: false, text: err.message })
    }
    setBusy(false)
  }

  return (
    <form className="admin-card" onSubmit={generate}>
      <div className="admin-card-head">
        <h2>AI test designer</h2>
        <span className="status">Drafts first</span>
      </div>
      <p className="muted">
        Upload the official handbook (PDF or TXT) or paste text. The AI writes questions only from this resource.
      </p>
      <label className="upload">
        <input type="file" accept=".pdf,.txt" ref={file} />
      </label>
      <label className="field">
        <span>Or paste text</span>
        <textarea rows="5" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a chapter of the handbook..." />
      </label>
      <div className="admin-grid">
        <label className="field">
          <span>Number of questions (1–30)</span>
          <input type="number" min="1" max="30" value={count} onChange={(e) => setCount(e.target.value)} />
        </label>
      </div>
      <div className="field">
        <span>Languages</span>
        <div className="lang-checks">
          {LANGUAGES.map((l) => (
            <button
              type="button"
              key={l.code}
              className={'lang-chip' + (langs.includes(l.code) ? ' lang-chip-active' : '')}
              onClick={() => toggle(l.code)}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>
      <div className="admin-actions">
        {message && <span className={message.ok ? 'admin-ok' : 'admin-error'}>{message.text}</span>}
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'AI is writing questions... (about 1 minute)' : 'Generate questions'}
        </button>
      </div>
    </form>
  )
}

function QuestionCard({ item, onChange }) {
  const [editing, setEditing] = useState(false)
  const [json, setJson] = useState('')
  const [error, setError] = useState('')
  const q = item.question

  async function update(body) {
    setError('')
    try {
      await api('/admin/questions/' + item.id, { method: 'PUT', body })
      setEditing(false)
      onChange()
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove() {
    if (!window.confirm('Delete this question?')) return
    await api('/admin/questions/' + item.id, { method: 'DELETE' })
    onChange()
  }

  function saveEdit() {
    try {
      update({ question: JSON.parse(json) })
    } catch {
      setError('This is not valid JSON')
    }
  }

  return (
    <div className={'q-card' + (item.status === 'approved' ? ' q-approved' : '')}>
      <div className="q-head">
        <span className={'status' + (item.status === 'approved' ? ' status-live' : '')}>{item.status}</span>
        {q.section && <span className="status">{q.section}</span>}
        <span className="muted">{Object.keys(q.options).length === 1 ? '1 language' : Object.keys(q.options).length + ' languages'} · {item.source}</span>
      </div>
      {editing ? (
        <textarea className="q-json" rows="12" value={json} onChange={(e) => setJson(e.target.value)} />
      ) : (
        <>
          <p className="q-text">{q.en}</p>
          <ol className="q-options">
            {q.options.en.map((option, index) => (
              <li key={index} className={index === q.correct ? 'q-correct' : ''}>
                {index === q.correct && <CheckIcon />} {option}
              </li>
            ))}
          </ol>
          {q.explanation?.en && <p className="review-why">{q.explanation.en}</p>}
        </>
      )}
      {error && <p className="form-error">{error}</p>}
      <div className="q-actions">
        {editing ? (
          <>
            <button className="btn-back" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn-next" onClick={saveEdit}>Save</button>
          </>
        ) : (
          <>
            <button className="link-danger" onClick={remove}>Delete</button>
            <button
              className="btn-back"
              onClick={() => {
                setJson(JSON.stringify(q, null, 2))
                setEditing(true)
              }}
            >
              Edit
            </button>
            {item.status === 'approved' ? (
              <button className="btn-back" onClick={() => update({ status: 'draft' })}>Back to draft</button>
            ) : (
              <button className="btn-next" onClick={() => update({ status: 'approved' })}>Approve</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Admin() {
  const { user } = useAuth()
  const [regionId, setRegionId] = useState('ca-ab')
  const [rules, setRules] = useState(null)
  const [items, setItems] = useState([])
  const [tab, setTab] = useState('draft')
  const [reload, setReload] = useState(0)
  const { country, region } = findPlace(regionId)
  const isAdmin = user && user.is_admin

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    api('/regions').then((data) => {
      if (!cancelled) setRules(data[regionId])
    })
    api('/admin/questions?region=' + regionId).then((data) => {
      if (!cancelled) setItems(data)
    })
    return () => {
      cancelled = true
    }
  }, [isAdmin, regionId, reload])

  function refresh() {
    refreshRegions()
    setReload((n) => n + 1)
  }

  if (!isAdmin) {
    return (
      <div className="page auth-page">
        <div className="auth-card">
          <span className="auth-logo"><LockIcon /></span>
          <h1>Admins only</h1>
          <p className="auth-subtitle">Log in with an admin account to open the test designer.</p>
          {!user && <Link to="/login?next=/admin" className="btn-primary">Login</Link>}
        </div>
      </div>
    )
  }

  const drafts = items.filter((i) => i.status === 'draft')
  const approved = items.filter((i) => i.status === 'approved')
  const shown = tab === 'draft' ? drafts : approved

  async function approveAll() {
    await Promise.all(drafts.map((d) => api('/admin/questions/' + d.id, { method: 'PUT', body: { status: 'approved' } })))
    refresh()
  }

  return (
    <div className="page admin">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Test designer</h1>
          <p className="muted">Create exams for every region with AI, check them, and publish them.</p>
        </div>
        <label className="field admin-region">
          <span>Region</span>
          <select value={regionId} onChange={(e) => { setRules(null); setRegionId(e.target.value) }}>
            {COUNTRIES.map((c) => (
              <optgroup key={c.code} label={countryName(c.code, 'en')}>
                {c.regions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-stats">
        <div><strong>{rules ? rules.available : '–'}</strong><span>Questions live in exams</span></div>
        <div><strong>{drafts.length}</strong><span>Drafts to check</span></div>
        <div><strong>{approved.length}</strong><span>AI questions approved</span></div>
      </div>

      <div className="admin-columns">
        <Generator
          regionId={regionId}
          regionName={region.name + ', ' + countryName(country.code, 'en')}
          onCreated={() => { setTab('draft'); refresh() }}
        />
        <RulesEditor key={regionId} regionId={regionId} rules={rules} onSaved={refresh} />
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <div className="tabs">
            <button className={'tab' + (tab === 'draft' ? ' tab-active' : '')} onClick={() => setTab('draft')}>
              Drafts <span className="count-badge">{drafts.length}</span>
            </button>
            <button className={'tab' + (tab === 'approved' ? ' tab-active' : '')} onClick={() => setTab('approved')}>
              Approved <span className="count-badge count-ok">{approved.length}</span>
            </button>
          </div>
          {tab === 'draft' && drafts.length > 0 && (
            <button className="btn-next" onClick={approveAll}>Approve all</button>
          )}
        </div>
        {shown.length === 0 && (
          <div className="empty">
            <span className="icon-box"><ExamIcon /></span>
            <p className="muted">No questions here yet.</p>
          </div>
        )}
        {shown.map((item) => (
          <QuestionCard key={item.id} item={item} onChange={refresh} />
        ))}
      </div>
    </div>
  )
}

export default Admin
