import { useState, useEffect } from "react";

const DAYS = [“ראשון”, “שני”, “שלישי”, “רביעי”, “חמישי”];
const DUTY_TYPES = [“רסר”, “מטבח”];
const MAX_POINTS = 2;

function getDutyPoints(day, duty) {
if (duty === “רסר” && (day === “ראשון” || day === “חמישי”)) return 0.5;
if (duty === “מטבח” && day === “חמישי”) return 0.5;
return 1;
}

function getTotalPoints(dutyLog, name) {
return (dutyLog[name] || []).reduce((sum, d) => sum + getDutyPoints(d.day, d.duty), 0);
}

function getMonthKey() {
const now = new Date();
return `${now.getFullYear()}-${now.getMonth()}`;
}

// All storage is namespaced by username
function storageKey(user, key) { return `user:${user}:${key}`; }

function loadUserState(user) {
try {
const soldiers = JSON.parse(localStorage.getItem(storageKey(user, “soldiers”)) || “[]”);
const dutyLog = JSON.parse(localStorage.getItem(storageKey(user, “dutyLog”)) || “{}”);
const monthKey = localStorage.getItem(storageKey(user, “monthKey”)) || “”;
const slots = JSON.parse(localStorage.getItem(storageKey(user, “slots”)) || “null”);
const schedule = JSON.parse(localStorage.getItem(storageKey(user, “schedule”)) || “null”);
const manualLog = JSON.parse(localStorage.getItem(storageKey(user, “manualLog”)) || “{}”);
const currentMonth = getMonthKey();
if (monthKey !== currentMonth) {
return { soldiers, dutyLog: {}, slots: slots || DAYS.map(() => ({ רסר: 1, מטבח: 1 })), schedule: null, monthKey: currentMonth, manualLog: {} };
}
return { soldiers, dutyLog, slots: slots || DAYS.map(() => ({ רסר: 1, מטבח: 1 })), schedule, monthKey: currentMonth, manualLog };
} catch {
return { soldiers: [], dutyLog: {}, slots: DAYS.map(() => ({ רסר: 1, מטבח: 1 })), schedule: null, monthKey: getMonthKey(), manualLog: {} };
}
}

function saveUserState(user, state, manualLog) {
localStorage.setItem(storageKey(user, “soldiers”), JSON.stringify(state.soldiers));
localStorage.setItem(storageKey(user, “dutyLog”), JSON.stringify(state.dutyLog));
localStorage.setItem(storageKey(user, “monthKey”), state.monthKey);
localStorage.setItem(storageKey(user, “slots”), JSON.stringify(state.slots));
localStorage.setItem(storageKey(user, “schedule”), JSON.stringify(state.schedule));
localStorage.setItem(storageKey(user, “manualLog”), JSON.stringify(manualLog));
}

function getKnownUsers() {
try { return JSON.parse(localStorage.getItem(“knownUsers”) || “[]”); } catch { return []; }
}
function addKnownUser(name) {
const users = getKnownUsers();
if (!users.includes(name)) { users.push(name); localStorage.setItem(“knownUsers”, JSON.stringify(users)); }
}

function generateSchedule(soldiers, slots, existingLog) {
const tempLog = {};
soldiers.forEach((s) => { tempLog[s] = […(existingLog[s] || [])]; });
const schedule = DAYS.map(() => ({ רסר: [], מטבח: [] }));
const warnings = [];
for (let dayIdx = 0; dayIdx < DAYS.length; dayIdx++) {
const assignedToday = new Set();
for (const duty of DUTY_TYPES) {
const count = slots[dayIdx][duty];
for (let i = 0; i < count; i++) {
const pts = getDutyPoints(DAYS[dayIdx], duty);
const eligible = soldiers.filter(s => !assignedToday.has(s) && getTotalPoints(tempLog, s) + pts <= MAX_POINTS);
if (eligible.length === 0) { warnings.push(`אין מספיק חיילים ביום ${DAYS[dayIdx]} לתורנות ${duty}`); break; }
eligible.sort((a, b) => { const d = getTotalPoints(tempLog, a) - getTotalPoints(tempLog, b); return d !== 0 ? d : Math.random() - 0.5; });
const chosen = eligible[0];
schedule[dayIdx][duty].push(chosen);
assignedToday.add(chosen);
tempLog[chosen].push({ day: DAYS[dayIdx], duty });
}
}
}
return { schedule, warnings, newLog: tempLog };
}

function recomputeLog(soldiers, schedule, manualLog) {
const newLog = {};
soldiers.forEach((s) => { newLog[s] = […(manualLog[s] || [])]; });
schedule.forEach((day, di) => {
DUTY_TYPES.forEach((dt) => {
(day[dt] || []).forEach((sol) => {
if (!newLog[sol]) newLog[sol] = [];
newLog[sol].push({ day: DAYS[di], duty: dt });
});
});
});
return newLog;
}

const pointColor = (pts) => pts === 0 ? “#22c55e” : pts < MAX_POINTS ? “#f59e0b” : “#ef4444”;

// ─── LOGIN SCREEN ───────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
const [name, setName] = useState(””);
const [users, setUsers] = useState(getKnownUsers());

const login = (n) => {
const trimmed = n.trim();
if (!trimmed) return;
addKnownUser(trimmed);
setUsers(getKnownUsers());
onLogin(trimmed);
};

return (
<div dir="rtl" style={L.root}>
<div style={L.bg} />
<div style={L.card}>
<div style={L.icon}>⚡</div>
<div style={L.title}>מנהל תורנויות</div>
<div style={L.sub}>מערכת ניהול שבועית</div>

```
    <div style={L.section}>
      <div style={L.label}>כניסה עם שם</div>
      <div style={L.row}>
        <input
          style={L.input}
          placeholder="הכנס שם..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login(name)}
          autoFocus
        />
        <button style={L.btn} onClick={() => login(name)}>כניסה</button>
      </div>
    </div>

    {users.length > 0 && (
      <div style={L.section}>
        <div style={L.label}>משתמשים קיימים</div>
        <div style={L.userList}>
          {users.map((u) => (
            <button key={u} style={L.userChip} onClick={() => login(u)}>
              <span style={L.userAvatar}>{u[0]}</span>
              <span>{u}</span>
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
</div>
```

);
}

const L = {
root: { minHeight: “100vh”, background: “#0a0f1a”, display: “flex”, alignItems: “center”, justifyContent: “center”, padding: 20, fontFamily: “‘Segoe UI’,‘Arial Hebrew’,sans-serif” },
bg: { position: “fixed”, inset: 0, background: “radial-gradient(ellipse at 30% 40%, #0d2137 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, #0d2a1a 0%, transparent 50%)”, pointerEvents: “none” },
card: { position: “relative”, background: “#111827”, border: “1px solid #1e293b”, borderRadius: 20, padding: “40px 32px”, maxWidth: 400, width: “100%”, textAlign: “center” },
icon: { fontSize: 48, marginBottom: 12, filter: “drop-shadow(0 0 16px #fbbf24)” },
title: { fontSize: 26, fontWeight: 800, color: “#f1f5f9”, marginBottom: 4 },
sub: { fontSize: 13, color: “#475569”, marginBottom: 32, letterSpacing: 1 },
section: { textAlign: “right”, marginBottom: 24 },
label: { fontSize: 12, fontWeight: 700, color: “#64748b”, marginBottom: 10, letterSpacing: 0.5 },
row: { display: “flex”, gap: 8 },
input: { flex: 1, background: “#1e293b”, border: “1px solid #334155”, borderRadius: 10, padding: “12px 14px”, color: “#f1f5f9”, fontSize: 15, outline: “none”, fontFamily: “inherit”, textAlign: “right” },
btn: { background: “linear-gradient(135deg,#2563eb,#1d4ed8)”, color: “#fff”, border: “none”, borderRadius: 10, padding: “12px 20px”, fontSize: 14, fontWeight: 700, cursor: “pointer”, fontFamily: “inherit”, whiteSpace: “nowrap” },
userList: { display: “flex”, flexDirection: “column”, gap: 8 },
userChip: { display: “flex”, alignItems: “center”, gap: 12, background: “#1e293b”, border: “1px solid #334155”, borderRadius: 12, padding: “10px 14px”, cursor: “pointer”, fontFamily: “inherit”, color: “#e2e8f0”, fontSize: 14, fontWeight: 600, textAlign: “right”, transition: “border-color 0.2s” },
userAvatar: { width: 32, height: 32, borderRadius: “50%”, background: “linear-gradient(135deg,#2563eb,#7c3aed)”, color: “#fff”, display: “flex”, alignItems: “center”, justifyContent: “center”, fontSize: 15, fontWeight: 800, flexShrink: 0 },
};

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
const [currentUser, setCurrentUser] = useState(() => localStorage.getItem(“lastUser”) || null);
const [state, setState] = useState(null);
const [manualLog, setManualLog] = useState({});
const [newName, setNewName] = useState(””);
const [activeTab, setActiveTab] = useState(“soldiers”);
const [warnings, setWarnings] = useState([]);
const [swapTarget, setSwapTarget] = useState(null);
const [confirmRemove, setConfirmRemove] = useState(null);
const [confirmReset, setConfirmReset] = useState(false);
const [flash, setFlash] = useState(””);
const [manualModal, setManualModal] = useState(null);
const [manualForm, setManualForm] = useState({ day: “ראשון”, duty: “רסר” });

// Load user state on login
useEffect(() => {
if (!currentUser) return;
localStorage.setItem(“lastUser”, currentUser);
const loaded = loadUserState(currentUser);
setManualLog(loaded.manualLog);
setState(loaded);
setActiveTab(“soldiers”);
}, [currentUser]);

// Save on every state change
useEffect(() => {
if (!currentUser || !state) return;
saveUserState(currentUser, state, manualLog);
}, [state, manualLog, currentUser]);

const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(””), 2500); };

const logout = () => { setCurrentUser(null); setState(null); setManualLog({}); };

const resetAllDuties = () => {
setState((s) => ({ …s, dutyLog: {}, schedule: null }));
setManualLog({});
setWarnings([]);
setConfirmReset(false);
showFlash(“כל התורנויות אופסו ✓”);
};

if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;
if (!state) return <div style={{ background: “#0a0f1a”, minHeight: “100vh” }} />;

const addSoldier = () => {
const name = newName.trim();
if (!name || state.soldiers.includes(name)) return;
setState((s) => ({ …s, soldiers: […s.soldiers, name] }));
setNewName(””); showFlash(`${name} נוסף בהצלחה`);
};

const removeSoldier = (name) => {
setState((s) => {
const newLog = { …s.dutyLog }; delete newLog[name];
return { …s, soldiers: s.soldiers.filter((x) => x !== name), dutyLog: newLog,
schedule: s.schedule ? s.schedule.map((day) => ({ רסר: day[“רסר”].filter((x) => x !== name), מטבח: day[“מטבח”].filter((x) => x !== name) })) : null };
});
setManualLog((ml) => { const n = { …ml }; delete n[name]; return n; });
setConfirmRemove(null); showFlash(`${name} הוסר`);
};

const updateSlot = (dayIdx, duty, val) =>
setState((s) => ({ …s, slots: s.slots.map((d, i) => i === dayIdx ? { …d, [duty]: Math.max(0, Number(val)) } : d) }));

const generate = () => {
const effectiveLog = {};
state.soldiers.forEach((s) => { effectiveLog[s] = […(manualLog[s] || [])]; });
const { schedule, warnings: w, newLog } = generateSchedule(state.soldiers, state.slots, effectiveLog);
setState((s) => ({ …s, schedule, dutyLog: newLog }));
setWarnings(w); setActiveTab(“schedule”); showFlash(“סדר תורנויות הופק בהצלחה ✓”);
};

const doSwap = (dayIdx, duty, soldierIdx, newSoldier) => {
setState((s) => {
const schedule = s.schedule.map((day, di) => {
if (di !== dayIdx) return day;
const arr = […day[duty]]; arr[soldierIdx] = newSoldier;
return { …day, [duty]: arr };
});
return { …s, schedule, dutyLog: recomputeLog(s.soldiers, schedule, manualLog) };
});
setSwapTarget(null); showFlash(“ההחלפה בוצעה ✓”);
};

const addManualDuty = () => {
const name = manualModal; const { day, duty } = manualForm;
const pts = getDutyPoints(day, duty);
if (getTotalPoints(state.dutyLog, name) + pts > MAX_POINTS) { showFlash(`${name} כבר הגיע למכסה החודשית`); setManualModal(null); return; }
const entry = { day, duty, manual: true };
setManualLog((ml) => ({ …ml, [name]: […(ml[name] || []), entry] }));
setState((s) => ({ …s, dutyLog: { …s.dutyLog, [name]: […(s.dutyLog[name] || []), entry] } }));
setManualModal(null); showFlash(`תורנות ${duty} ביום ${day} נוספה ל${name}`);
};

const removeManualDuty = (name, mIdx) => {
const removed = (manualLog[name] || [])[mIdx];
setManualLog((ml) => ({ …ml, [name]: (ml[name] || []).filter((_, i) => i !== mIdx) }));
setState((s) => {
let found = false;
const filtered = (s.dutyLog[name] || []).filter((d) => {
if (!found && d.manual && d.day === removed.day && d.duty === removed.duty) { found = true; return false; }
return true;
});
return { …s, dutyLog: { …s.dutyLog, [name]: filtered } };
});
showFlash(“תורנות ידנית הוסרה”);
};

return (
<div dir="rtl" style={S.root}>
<div style={S.bg} />
{flash && <div style={S.flash}>{flash}</div>}

```
  {/* Header */}
  <header style={S.header}>
    <div style={S.headerInner}>
      <div style={S.logoArea}>
        <span style={S.logoIcon}>⚡</span>
        <div>
          <div style={S.logoTitle}>מנהל תורנויות</div>
          <div style={S.logoSub}>{new Date().toLocaleDateString("he-IL", { month: "long", year: "numeric" })}</div>
        </div>
      </div>
      <div style={S.headerRight}>
        {/* Reset button */}
        <button style={S.btnReset} onClick={() => setConfirmReset(true)} title="איפוס כל התורנויות">
          🔄 איפוס
        </button>
        {/* User badge */}
        <div style={S.userBadge} onClick={logout} title="לחץ לניתוק">
          <div style={S.userAvatar}>{currentUser[0]}</div>
          <span style={S.userName}>{currentUser}</span>
          <span style={S.logoutIcon}>↩</span>
        </div>
      </div>
    </div>
  </header>

  {/* Tabs */}
  <nav style={S.tabs}>
    {[{ key: "soldiers", label: "חיילים", icon: "👤" }, { key: "config", label: "הגדרת שבוע", icon: "⚙️" }, { key: "schedule", label: "סדר תורנויות", icon: "📋" }].map((t) => (
      <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ ...S.tab, ...(activeTab === t.key ? S.tabActive : {}) }}>
        <span>{t.icon}</span><span>{t.label}</span>
        {t.key === "soldiers" && <span style={S.tabBadge}>{state.soldiers.length}</span>}
      </button>
    ))}
  </nav>

  <main style={S.main}>

    {/* ── SOLDIERS ── */}
    {activeTab === "soldiers" && (
      <div>
        <div style={S.sectionHeader}>
          <h2 style={S.sectionTitle}>רשימת חיילים</h2>
          <span style={S.sectionCount}>{state.soldiers.length} חיילים</span>
        </div>
        <div style={S.addRow}>
          <input style={S.input} placeholder="שם מלא..." value={newName}
            onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSoldier()} />
          <button style={S.btnPrimary} onClick={addSoldier}>+ הוסף</button>
        </div>

        <div style={S.soldierList}>
          {state.soldiers.length === 0 && <div style={S.empty}>אין חיילים ברשימה. הוסף חייל כדי להתחיל.</div>}
          {state.soldiers.map((name) => {
            const pts = getTotalPoints(state.dutyLog, name);
            const duties = state.dutyLog[name] || [];
            const manuals = manualLog[name] || [];
            return (
              <div key={name} style={S.soldierCard}>
                <div style={S.soldierTop}>
                  <div style={S.soldierLeft}>
                    <div style={{ ...S.dot, background: pointColor(pts), boxShadow: `0 0 8px ${pointColor(pts)}66` }} />
                    <div style={S.soldierName}>{name}</div>
                  </div>
                  <div style={S.soldierRight}>
                    <div style={{ ...S.countBadge, background: pointColor(pts) }}>
                      {pts % 1 === 0 ? pts : pts.toFixed(1)}/{MAX_POINTS}
                    </div>
                    <button style={S.btnAddDuty} onClick={() => { setManualModal(name); setManualForm({ day: "ראשון", duty: "רסר" }); }}>+ תורנות</button>
                    <button style={S.btnRemove} onClick={() => setConfirmRemove(name)}>✕</button>
                  </div>
                </div>
                <div style={S.dutyRow}>
                  {duties.length === 0
                    ? <span style={{ color: "#475569", fontSize: 12 }}>אין תורנויות החודש</span>
                    : duties.map((d, i) => {
                        const half = getDutyPoints(d.day, d.duty) === 0.5;
                        const isManual = !!d.manual;
                        let manualMatchIdx = -1;
                        if (isManual) {
                          let skip = duties.slice(0, i).filter(x => x.manual && x.day === d.day && x.duty === d.duty).length;
                          let count = 0;
                          manualMatchIdx = manuals.findIndex(m => {
                            if (m.day === d.day && m.duty === d.duty) { if (count === skip) return true; count++; }
                            return false;
                          });
                        }
                        return (
                          <span key={i} style={{ ...S.dutyTag, background: isManual ? "#1e1040" : "#1e293b", borderColor: isManual ? "#7c3aed55" : "#334155" }}>
                            {d.duty} · {d.day}
                            {half && <span style={S.halfBadge}>½</span>}
                            {isManual && <button style={S.tagX} onClick={() => removeManualDuty(name, manualMatchIdx >= 0 ? manualMatchIdx : 0)}>×</button>}
                          </span>
                        );
                      })
                  }
                </div>
              </div>
            );
          })}
        </div>
        <div style={S.legend}>
          {[{ c: "#22c55e", l: "0 נקודות" }, { c: "#f59e0b", l: "0.5–1.5" }, { c: "#ef4444", l: "מקסימום (2)" }].map(({ c, l }) => (
            <div key={l} style={S.legendItem}><div style={{ width: 10, height: 10, borderRadius: "50%", background: c }} /><span style={{ color: "#94a3b8", fontSize: 12 }}>{l}</span></div>
          ))}
        </div>
        <div style={S.halfNote}>💡 <strong>חצי הקצאה (0.5):</strong> רסר בראשון/חמישי · מטבח בחמישי</div>
      </div>
    )}

    {/* ── CONFIG ── */}
    {activeTab === "config" && (
      <div>
        <div style={S.sectionHeader}><h2 style={S.sectionTitle}>הגדרת הקצאות שבועיות</h2></div>
        <div style={S.halfNote}>💡 רסר בראשון/חמישי ומטבח בחמישי = חצי הקצאה (0.5 נקודות)</div>
        <div style={S.configGrid}>
          {DAYS.map((day, di) => (
            <div key={day} style={S.configCard}>
              <div style={S.configDay}>{day}</div>
              {DUTY_TYPES.map((duty) => {
                const half = getDutyPoints(day, duty) === 0.5;
                return (
                  <div key={duty} style={S.configRow}>
                    <span style={{ ...S.dutyLabel, background: duty === "רסר" ? "#1e3a5f" : "#1a3a2a", color: duty === "רסר" ? "#60a5fa" : "#4ade80" }}>
                      {duty}{half && <span style={{ opacity: 0.7, fontSize: 9 }}> ½</span>}
                    </span>
                    <div style={S.counter}>
                      <button style={S.counterBtn} onClick={() => updateSlot(di, duty, state.slots[di][duty] - 1)}>−</button>
                      <span style={S.counterVal}>{state.slots[di][duty]}</span>
                      <button style={S.counterBtn} onClick={() => updateSlot(di, duty, state.slots[di][duty] + 1)}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <button style={S.btnGenerate} onClick={generate}>⚡ הפק סדר תורנויות</button>
      </div>
    )}

    {/* ── SCHEDULE ── */}
    {activeTab === "schedule" && (
      <div>
        <div style={S.sectionHeader}>
          <h2 style={S.sectionTitle}>סדר תורנויות שבועי</h2>
          <button style={S.btnSecondary} onClick={generate}>🔄 הפק מחדש</button>
        </div>
        {warnings.length > 0 && (
          <div style={S.warningBox}>{warnings.map((w, i) => <div key={i} style={S.warningLine}>⚠️ {w}</div>)}</div>
        )}
        {!state.schedule
          ? <div style={S.empty}>לא הופק סדר תורנויות.<button style={{ ...S.btnPrimary, marginTop: 12 }} onClick={() => setActiveTab("config")}>עבור להגדרות</button></div>
          : (
            <div style={S.scheduleGrid}>
              {DAYS.map((day, di) => (
                <div key={day} style={S.dayCard}>
                  <div style={S.dayTitle}>{day}</div>
                  {DUTY_TYPES.map((duty) => {
                    const half = getDutyPoints(day, duty) === 0.5;
                    return (
                      <div key={duty} style={S.dutyBlock}>
                        <div style={{ ...S.dutyBlockLabel, color: duty === "רסר" ? "#60a5fa" : "#4ade80", borderRight: `3px solid ${duty === "רסר" ? "#60a5fa" : "#4ade80"}` }}>
                          {duty}{half && <span style={{ opacity: 0.6, fontSize: 10 }}> (½)</span>}
                        </div>
                        {(state.schedule[di][duty] || []).length === 0
                          ? <div style={S.noAssign}>— לא הוקצה —</div>
                          : (state.schedule[di][duty] || []).map((sol, si) => (
                            <div key={si} style={S.assignedRow}>
                              <span style={S.assignedName}>{sol}</span>
                              <button style={S.swapBtn} onClick={() => setSwapTarget({ dayIdx: di, duty, soldierIdx: si })}>החלף</button>
                            </div>
                          ))
                        }
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )
        }
      </div>
    )}
  </main>

  {/* ── RESET CONFIRM ── */}
  {confirmReset && (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.modalTitle}>⚠️ איפוס תורנויות</div>
        <div style={S.modalBody}>
          פעולה זו תמחק את <strong>כל התורנויות</strong> של כל החיילים ותאפס את הספירה לאפס.<br /><br />
          <span style={{ color: "#ef4444" }}>לא ניתן לבטל פעולה זו.</span>
        </div>
        <div style={S.modalActions}>
          <button style={S.btnDanger} onClick={resetAllDuties}>אפס הכל</button>
          <button style={S.btnSecondary} onClick={() => setConfirmReset(false)}>ביטול</button>
        </div>
      </div>
    </div>
  )}

  {/* ── MANUAL DUTY MODAL ── */}
  {manualModal && (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.modalTitle}>הוספת תורנות ידנית</div>
        <div style={S.modalBody}>הוסף תורנות עבור <strong>{manualModal}</strong></div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>יום</label>
          <div style={S.toggleGroup}>
            {DAYS.map((d) => (
              <button key={d} style={{ ...S.toggleBtn, ...(manualForm.day === d ? S.toggleActive : {}) }}
                onClick={() => setManualForm((f) => ({ ...f, day: d }))}>{d}</button>
            ))}
          </div>
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>סוג תורנות</label>
          <div style={S.toggleGroup}>
            {DUTY_TYPES.map((dt) => (
              <button key={dt} style={{ ...S.toggleBtn, ...(manualForm.duty === dt ? S.toggleActive : {}) }}
                onClick={() => setManualForm((f) => ({ ...f, duty: dt }))}>{dt}</button>
            ))}
          </div>
        </div>
        {(() => {
          const pts = getDutyPoints(manualForm.day, manualForm.duty);
          const curPts = getTotalPoints(state.dutyLog, manualModal);
          const after = curPts + pts; const over = after > MAX_POINTS;
          return (
            <div style={{ ...S.pointsPreview, borderColor: over ? "#b91c1c55" : "#1e293b" }}>
              <span>ערך: <strong style={{ color: pts === 0.5 ? "#f59e0b" : "#60a5fa" }}>{pts === 0.5 ? "½ נקודה" : "נקודה שלמה"}</strong></span>
              <span>סה״כ: <strong style={{ color: over ? "#ef4444" : pointColor(after) }}>{after.toFixed(1)}/{MAX_POINTS}{over ? " ⚠️" : ""}</strong></span>
            </div>
          );
        })()}
        <div style={{ ...S.modalActions, marginTop: 20 }}>
          <button style={S.btnPrimary} onClick={addManualDuty}>הוסף</button>
          <button style={S.btnSecondary} onClick={() => setManualModal(null)}>ביטול</button>
        </div>
      </div>
    </div>
  )}

  {/* ── CONFIRM REMOVE ── */}
  {confirmRemove && (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.modalTitle}>הסרת חייל</div>
        <div style={S.modalBody}>האם להסיר את <strong>{confirmRemove}</strong> מהרשימה?</div>
        <div style={S.modalActions}>
          <button style={S.btnDanger} onClick={() => removeSoldier(confirmRemove)}>הסר</button>
          <button style={S.btnSecondary} onClick={() => setConfirmRemove(null)}>ביטול</button>
        </div>
      </div>
    </div>
  )}

  {/* ── SWAP MODAL ── */}
  {swapTarget && (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.modalTitle}>החלפת חייל</div>
        <div style={S.modalBody}>בחר חלופי ליום <strong>{DAYS[swapTarget.dayIdx]}</strong> — <strong>{swapTarget.duty}</strong></div>
        <div style={S.swapList}>
          {(() => {
            const assignedToday = new Set(DUTY_TYPES.flatMap((dt) => state.schedule[swapTarget.dayIdx][dt] || []));
            const current = state.schedule[swapTarget.dayIdx][swapTarget.duty][swapTarget.soldierIdx];
            const pts = getDutyPoints(DAYS[swapTarget.dayIdx], swapTarget.duty);
            const eligible = state.soldiers.filter((s) => s !== current && !assignedToday.has(s) && getTotalPoints(state.dutyLog, s) + pts <= MAX_POINTS);
            if (eligible.length === 0) return <div style={S.empty}>אין חיילים זמינים להחלפה</div>;
            return eligible.map((s) => {
              const p = getTotalPoints(state.dutyLog, s);
              return (
                <button key={s} style={S.swapOption} onClick={() => doSwap(swapTarget.dayIdx, swapTarget.duty, swapTarget.soldierIdx, s)}>
                  <span>{s}</span>
                  <span style={{ color: pointColor(p), fontSize: 12 }}>{p % 1 === 0 ? p : p.toFixed(1)}/{MAX_POINTS}</span>
                </button>
              );
            });
          })()}
        </div>
        <button style={S.btnSecondary} onClick={() => setSwapTarget(null)}>ביטול</button>
      </div>
    </div>
  )}
</div>
```

);
}

const S = {
root: { minHeight: “100vh”, background: “#0a0f1a”, color: “#e2e8f0”, fontFamily: “‘Segoe UI’,‘Arial Hebrew’,sans-serif”, position: “relative”, overflowX: “hidden” },
bg: { position: “fixed”, inset: 0, background: “radial-gradient(ellipse at 20% 50%,#0d2137 0%,transparent 60%),radial-gradient(ellipse at 80% 10%,#0d2a1a 0%,transparent 50%)”, pointerEvents: “none”, zIndex: 0 },
flash: { position: “fixed”, top: 20, left: “50%”, transform: “translateX(-50%)”, background: “#166534”, color: “#bbf7d0”, padding: “10px 24px”, borderRadius: 30, fontSize: 14, fontWeight: 600, zIndex: 1000, boxShadow: “0 4px 20px #00000088”, border: “1px solid #4ade8044”, whiteSpace: “nowrap” },
header: { position: “relative”, zIndex: 10, background: “linear-gradient(135deg,#0f172a,#1e293b)”, borderBottom: “1px solid #1e3a5f”, padding: “0 20px” },
headerInner: { maxWidth: 900, margin: “0 auto”, display: “flex”, alignItems: “center”, justifyContent: “space-between”, padding: “14px 0”, gap: 12, flexWrap: “wrap” },
logoArea: { display: “flex”, alignItems: “center”, gap: 12 },
logoIcon: { fontSize: 26, filter: “drop-shadow(0 0 8px #fbbf24)” },
logoTitle: { fontSize: 18, fontWeight: 800, color: “#f1f5f9” },
logoSub: { fontSize: 11, color: “#475569” },
headerRight: { display: “flex”, alignItems: “center”, gap: 10 },
btnReset: { background: “#1a0a0a”, color: “#f87171”, border: “1px solid #b91c1c44”, borderRadius: 10, padding: “8px 14px”, fontSize: 13, fontWeight: 700, cursor: “pointer”, fontFamily: “inherit”, whiteSpace: “nowrap” },
userBadge: { display: “flex”, alignItems: “center”, gap: 8, background: “#1e293b”, border: “1px solid #334155”, borderRadius: 20, padding: “6px 12px 6px 8px”, cursor: “pointer” },
userAvatar: { width: 28, height: 28, borderRadius: “50%”, background: “linear-gradient(135deg,#2563eb,#7c3aed)”, color: “#fff”, display: “flex”, alignItems: “center”, justifyContent: “center”, fontSize: 13, fontWeight: 800 },
userName: { fontSize: 13, fontWeight: 700, color: “#e2e8f0” },
logoutIcon: { fontSize: 13, color: “#475569” },
tabs: { position: “relative”, zIndex: 10, display: “flex”, background: “#0f172a”, borderBottom: “1px solid #1e293b”, padding: “0 20px”, gap: 4, overflowX: “auto” },
tab: { display: “flex”, alignItems: “center”, gap: 6, padding: “14px 18px”, background: “none”, border: “none”, color: “#64748b”, fontSize: 14, fontWeight: 600, cursor: “pointer”, borderBottom: “2px solid transparent”, whiteSpace: “nowrap”, fontFamily: “inherit” },
tabActive: { color: “#60a5fa”, borderBottom: “2px solid #3b82f6” },
tabBadge: { background: “#1e3a5f”, color: “#60a5fa”, borderRadius: 10, padding: “1px 7px”, fontSize: 11, fontWeight: 700 },
main: { position: “relative”, zIndex: 10, maxWidth: 900, margin: “0 auto”, padding: “24px 16px 60px” },
sectionHeader: { display: “flex”, alignItems: “center”, justifyContent: “space-between”, marginBottom: 20 },
sectionTitle: { fontSize: 22, fontWeight: 800, color: “#f1f5f9”, margin: 0 },
sectionCount: { background: “#1e293b”, color: “#94a3b8”, padding: “4px 12px”, borderRadius: 20, fontSize: 13 },
halfNote: { background: “#1e1a0a”, border: “1px solid #854d0e44”, borderRadius: 10, padding: “10px 14px”, fontSize: 13, color: “#fcd34d”, marginBottom: 20 },
addRow: { display: “flex”, gap: 10, marginBottom: 20 },
input: { flex: 1, background: “#1e293b”, border: “1px solid #334155”, borderRadius: 10, padding: “12px 16px”, color: “#f1f5f9”, fontSize: 15, outline: “none”, fontFamily: “inherit”, textAlign: “right” },
btnPrimary: { background: “linear-gradient(135deg,#2563eb,#1d4ed8)”, color: “#fff”, border: “none”, borderRadius: 10, padding: “12px 20px”, fontSize: 14, fontWeight: 700, cursor: “pointer”, fontFamily: “inherit”, whiteSpace: “nowrap”, boxShadow: “0 4px 12px #2563eb44” },
btnSecondary: { background: “#1e293b”, color: “#94a3b8”, border: “1px solid #334155”, borderRadius: 10, padding: “10px 18px”, fontSize: 13, fontWeight: 600, cursor: “pointer”, fontFamily: “inherit” },
btnDanger: { background: “#7f1d1d”, color: “#fca5a5”, border: “1px solid #b91c1c44”, borderRadius: 10, padding: “10px 20px”, fontSize: 14, fontWeight: 700, cursor: “pointer”, fontFamily: “inherit” },
btnRemove: { background: “none”, border: “1px solid #334155”, color: “#64748b”, borderRadius: 6, width: 30, height: 30, cursor: “pointer”, fontSize: 12, display: “flex”, alignItems: “center”, justifyContent: “center”, fontFamily: “inherit” },
btnAddDuty: { background: “#1e1040”, color: “#a78bfa”, border: “1px solid #7c3aed44”, borderRadius: 8, padding: “5px 11px”, fontSize: 12, fontWeight: 700, cursor: “pointer”, fontFamily: “inherit”, whiteSpace: “nowrap” },
soldierList: { display: “flex”, flexDirection: “column”, gap: 10 },
soldierCard: { background: “#111827”, border: “1px solid #1e293b”, borderRadius: 12, padding: “14px 16px” },
soldierTop: { display: “flex”, alignItems: “center”, justifyContent: “space-between”, marginBottom: 10 },
soldierLeft: { display: “flex”, alignItems: “center”, gap: 12 },
soldierRight: { display: “flex”, alignItems: “center”, gap: 8 },
dot: { width: 12, height: 12, borderRadius: “50%”, flexShrink: 0 },
soldierName: { fontSize: 15, fontWeight: 700, color: “#e2e8f0” },
dutyRow: { display: “flex”, gap: 6, flexWrap: “wrap” },
dutyTag: { fontSize: 11, padding: “3px 8px”, borderRadius: 6, border: “1px solid #334155”, display: “inline-flex”, alignItems: “center”, gap: 4, color: “#94a3b8” },
halfBadge: { background: “#854d0e”, color: “#fcd34d”, borderRadius: 4, padding: “0 4px”, fontSize: 9, fontWeight: 800 },
tagX: { background: “none”, border: “none”, color: “#a78bfa”, cursor: “pointer”, fontSize: 14, padding: 0, lineHeight: 1, fontFamily: “inherit” },
countBadge: { color: “#000”, fontWeight: 800, fontSize: 12, padding: “3px 10px”, borderRadius: 20 },
legend: { display: “flex”, gap: 16, marginTop: 20, flexWrap: “wrap”, alignItems: “center” },
legendItem: { display: “flex”, alignItems: “center”, gap: 6 },
configGrid: { display: “grid”, gridTemplateColumns: “repeat(auto-fill,minmax(160px,1fr))”, gap: 14, marginBottom: 28 },
configCard: { background: “#111827”, border: “1px solid #1e293b”, borderRadius: 14, padding: 16 },
configDay: { fontSize: 16, fontWeight: 800, color: “#e2e8f0”, marginBottom: 14, textAlign: “center” },
configRow: { display: “flex”, alignItems: “center”, justifyContent: “space-between”, marginBottom: 10, gap: 8 },
dutyLabel: { fontSize: 12, fontWeight: 700, padding: “3px 10px”, borderRadius: 6 },
counter: { display: “flex”, alignItems: “center”, gap: 8 },
counterBtn: { background: “#1e293b”, border: “1px solid #334155”, color: “#94a3b8”, width: 28, height: 28, borderRadius: 6, cursor: “pointer”, fontSize: 16, fontFamily: “inherit”, display: “flex”, alignItems: “center”, justifyContent: “center” },
counterVal: { fontSize: 16, fontWeight: 700, color: “#f1f5f9”, minWidth: 20, textAlign: “center” },
btnGenerate: { width: “100%”, background: “linear-gradient(135deg,#059669,#047857)”, color: “#fff”, border: “none”, borderRadius: 12, padding: 16, fontSize: 17, fontWeight: 800, cursor: “pointer”, fontFamily: “inherit”, boxShadow: “0 4px 20px #05966944” },
scheduleGrid: { display: “grid”, gridTemplateColumns: “repeat(auto-fill,minmax(160px,1fr))”, gap: 14 },
dayCard: { background: “#111827”, border: “1px solid #1e293b”, borderRadius: 14, overflow: “hidden” },
dayTitle: { background: “#1e293b”, padding: “10px 14px”, fontSize: 15, fontWeight: 800, color: “#e2e8f0”, borderBottom: “1px solid #334155” },
dutyBlock: { padding: “12px 14px”, borderBottom: “1px solid #0f172a” },
dutyBlockLabel: { fontSize: 11, fontWeight: 800, paddingRight: 8, marginBottom: 8, letterSpacing: 0.5 },
noAssign: { fontSize: 12, color: “#475569”, fontStyle: “italic” },
assignedRow: { display: “flex”, alignItems: “center”, justifyContent: “space-between”, marginBottom: 6 },
assignedName: { fontSize: 13, fontWeight: 600, color: “#cbd5e1” },
swapBtn: { background: “#1e293b”, border: “1px solid #334155”, color: “#60a5fa”, borderRadius: 6, padding: “2px 8px”, fontSize: 11, fontWeight: 700, cursor: “pointer”, fontFamily: “inherit” },
warningBox: { background: “#451a03”, border: “1px solid #92400e”, borderRadius: 10, padding: “12px 16px”, marginBottom: 16 },
warningLine: { color: “#fcd34d”, fontSize: 13, marginBottom: 4 },
empty: { textAlign: “center”, color: “#475569”, padding: “40px 20px”, fontSize: 15, display: “flex”, flexDirection: “column”, alignItems: “center”, gap: 12 },
overlay: { position: “fixed”, inset: 0, background: “#00000099”, display: “flex”, alignItems: “center”, justifyContent: “center”, zIndex: 100, padding: 20 },
modal: { background: “#1e293b”, border: “1px solid #334155”, borderRadius: 16, padding: 24, maxWidth: 420, width: “100%”, maxHeight: “85vh”, overflowY: “auto” },
modalTitle: { fontSize: 18, fontWeight: 800, color: “#f1f5f9”, marginBottom: 12 },
modalBody: { fontSize: 14, color: “#94a3b8”, marginBottom: 20, lineHeight: 1.7 },
modalActions: { display: “flex”, gap: 10, justifyContent: “flex-end” },
formGroup: { marginBottom: 18 },
formLabel: { fontSize: 13, fontWeight: 700, color: “#94a3b8”, display: “block”, marginBottom: 8 },
toggleGroup: { display: “flex”, flexWrap: “wrap”, gap: 6 },
toggleBtn: { background: “#111827”, border: “1px solid #334155”, color: “#94a3b8”, borderRadius: 8, padding: “7px 12px”, fontSize: 13, cursor: “pointer”, fontFamily: “inherit”, fontWeight: 600 },
toggleActive: { background: “#1e3a5f”, border: “1px solid #3b82f6”, color: “#60a5fa” },
pointsPreview: { background: “#111827”, border: “1px solid #1e293b”, borderRadius: 10, padding: “12px 16px”, display: “flex”, justifyContent: “space-between”, fontSize: 13, color: “#94a3b8” },
swapList: { display: “flex”, flexDirection: “column”, gap: 8, marginBottom: 16 },
swapOption: { background: “#111827”, border: “1px solid #334155”, borderRadius: 10, padding: “12px 16px”, color: “#e2e8f0”, cursor: “pointer”, fontFamily: “inherit”, fontSize: 14, fontWeight: 600, textAlign: “right”, display: “flex”, justifyContent: “space-between”, alignItems: “center” },
};
