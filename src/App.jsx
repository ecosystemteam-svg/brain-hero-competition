import React, { useState, useEffect, useRef } from 'react';

const scoreToGrade = (score) => {
  if (score >= 20) return 'A';
  if (score >= 15) return 'B';
  return 'C';
};

const calculateBPI = (attentionScore, memoryScore, realAge, brainAge) => {
  const aScore = Number(attentionScore) || 0;
  const mScore = Number(memoryScore) || 0;
  const rAge = Number(realAge) || 0;
  const bAge = Number(brainAge) || 0;
  const attentionGrade = scoreToGrade(aScore);
  const memoryGrade = scoreToGrade(mScore);
  const attentionPoints = attentionGrade === 'A' ? 25 : attentionGrade === 'B' ? 18 : 10;
  const memoryPoints = memoryGrade === 'A' ? 25 : memoryGrade === 'B' ? 18 : 10;
  const brainGap = rAge - bAge;
  let brainGapPoints = 0;
  if (brainGap >= 15) brainGapPoints = 50;
  else if (brainGap >= 10) brainGapPoints = 45;
  else if (brainGap >= 5) brainGapPoints = 40;
  else if (brainGap >= 0) brainGapPoints = 30;
  else if (brainGap >= -5) brainGapPoints = 20;
  else if (brainGap >= -10) brainGapPoints = 10;
  else brainGapPoints = 5;
  const total = attentionPoints + memoryPoints + brainGapPoints;
  let tier = 'keep-fighting';
  if (total >= 90 && attentionGrade === 'A' && memoryGrade === 'A' && brainGap >= 10) tier = 'gold';
  else if (total >= 76 && (attentionGrade === 'A' || attentionGrade === 'B') && (memoryGrade === 'A' || memoryGrade === 'B') && brainGap >= 5) tier = 'silver';
  else if (total >= 66 && (attentionGrade === 'A' || attentionGrade === 'B') && (memoryGrade === 'A' || memoryGrade === 'B') && brainGap >= 0) tier = 'bronze';
  else if (total >= 50) tier = 'warrior';
  return { attentionGrade, memoryGrade, attentionPoints, memoryPoints, brainGapPoints, brainGap, total, tier };
};

const tierConfig = {
  'gold': { name: 'Gold Hero', color: '#FFD700', bgGradient: 'linear-gradient(135deg, #FFD700, #FFA500)', emoji: '👑' },
  'silver': { name: 'Silver Hero', color: '#C0C0C0', bgGradient: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)', emoji: '⚡' },
  'bronze': { name: 'Bronze Hero', color: '#CD7F32', bgGradient: 'linear-gradient(135deg, #CD7F32, #8B4513)', emoji: '🌟' },
  'warrior': { name: 'Brain Warrior', color: '#4ECDC4', bgGradient: 'linear-gradient(135deg, #4ECDC4, #45B7D1)', emoji: '💪' },
  'keep-fighting': { name: 'Keep Fighting', color: '#FF6B6B', bgGradient: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)', emoji: '🔥' }
};

const chronotypeConfig = {
  'lion': { name: 'Lion', emoji: '🦁', desc: 'Early Bird' },
  'bear': { name: 'Bear', emoji: '🐻', desc: 'ปกติ' },
  'wolf': { name: 'Wolf', emoji: '🐺', desc: 'Night Owl' },
  'dolphin': { name: 'Dolphin', emoji: '🐬', desc: 'นอนน้อย' }
};

const BackgroundMusic = ({ isPlaying, setIsPlaying }) => {
  const audioContextRef = useRef(null);
  const isPlayingRef = useRef(false);
  const playMusic = () => {
    if (isPlayingRef.current) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    audioContextRef.current = ctx;
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.15;
    gainNode.connect(ctx.destination);
    const melody = [
      { note: 523.25, duration: 0.2 },{ note: 587.33, duration: 0.2 },{ note: 659.25, duration: 0.2 },
      { note: 698.46, duration: 0.2 },{ note: 783.99, duration: 0.4 },{ note: 659.25, duration: 0.2 },
      { note: 783.99, duration: 0.4 },{ note: 880.00, duration: 0.4 },{ note: 783.99, duration: 0.2 },
      { note: 659.25, duration: 0.2 },{ note: 587.33, duration: 0.2 },{ note: 523.25, duration: 0.4 },
    ];
    let melodyTime = ctx.currentTime;
    const playLoop = () => {
      if (!isPlayingRef.current) return;
      melody.forEach(({ note, duration }) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = note;
        noteGain.gain.setValueAtTime(0.3, melodyTime);
        noteGain.gain.exponentialRampToValueAtTime(0.01, melodyTime + duration * 0.9);
        osc.connect(noteGain);
        noteGain.connect(gainNode);
        osc.start(melodyTime);
        osc.stop(melodyTime + duration);
        melodyTime += duration;
      });
      const loopDuration = melody.reduce((sum, m) => sum + m.duration, 0);
      setTimeout(playLoop, loopDuration * 1000);
    };
    isPlayingRef.current = true;
    playLoop();
  };
  const stopMusic = () => {
    isPlayingRef.current = false;
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };
  useEffect(() => {
    if (isPlaying) playMusic();
    else stopMusic();
    return () => stopMusic();
  }, [isPlaying]);
  return (
    <button className="music-btn" onClick={() => setIsPlaying(!isPlaying)}>
      {isPlaying ? '🔊 Music ON' : '🔇 Music OFF'}
    </button>
  );
};

const FloatingScore = ({ participant, index }) => {
  const score = calculateBPI(participant.attentionScore, participant.memoryScore, participant.realAge, participant.brainAge);
  const tier = tierConfig[score.tier];
  const chronotype = chronotypeConfig[participant.chronotype];
  const seed = participant.id % 1000;
  const randomX = 5 + (seed % 75);
  const randomY = 5 + ((seed * 7) % 65);
  const randomDuration = 12 + (seed % 8);
  const randomDelay = (index % 8) * 0.6;
  return (
    <div className="floating-score" style={{ '--start-x': `${randomX}%`, '--start-y': `${randomY}%`, '--duration': `${randomDuration}s`, '--delay': `${randomDelay}s`, background: tier.bgGradient }}>
      <div className="score-bubble">
        <div className="score-top">
          <span className="score-emoji">{tier.emoji}</span>
          <span className="chrono-emoji">{chronotype?.emoji || '🧠'}</span>
        </div>
        <span className="score-name">{participant.name}</span>
        <span className="score-value">{score.total}</span>
        <span className="score-tier">{tier.name}</span>
      </div>
    </div>
  );
};

const InputFormView = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({ name: '', attentionScore: '', memoryScore: '', realAge: '', brainAge: '', chronotype: 'bear' });
  const preview = calculateBPI(formData.attentionScore, formData.memoryScore, formData.realAge, formData.brainAge);
  const brainGap = (Number(formData.realAge) || 0) - (Number(formData.brainAge) || 0);
  const hasScores = formData.attentionScore !== '' && formData.memoryScore !== '';
  const hasAges = formData.realAge !== '' && formData.brainAge !== '';
  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    onSubmit({ ...formData, attentionScore: Number(formData.attentionScore) || 0, memoryScore: Number(formData.memoryScore) || 0, realAge: Number(formData.realAge) || 0, brainAge: Number(formData.brainAge) || 0, id: Date.now(), timestamp: Date.now() });
    setFormData({ name: '', attentionScore: '', memoryScore: '', realAge: '', brainAge: '', chronotype: 'bear' });
  };
  return (
    <div className="form-view">
      <div className="form-container">
        <div className="form-header">
          <div className="brain-icon animate-bounce">🧠</div>
          <h2>ลงทะเบียน Brain Hero</h2>
          <p>กรอกผล CogMate ของคุณ</p>
        </div>
        <div className="form-content">
          <div className="form-group">
            <label>ชื่อผู้เข้าแข่งขัน</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="ใส่ชื่อของคุณ" className="input-field" />
          </div>
          <div className="form-group">
            <label>Brain Health Chronotype</label>
            <div className="chronotype-grid">
              {Object.entries(chronotypeConfig).map(([key, value]) => (
                <button key={key} type="button" className={`chronotype-btn ${formData.chronotype === key ? 'active' : ''}`} onClick={() => setFormData({...formData, chronotype: key})}>
                  <span className="chrono-emoji">{value.emoji}</span>
                  <span className="chrono-name">{value.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="form-group cogmate-section">
            <label className="cogmate-label">Your CogMate<sup>TM</sup> Score</label>
            <div className="cogmate-scores">
              <div className="score-input-group">
                <span className="score-type">Attention</span>
                <div className="score-input-row">
                  <input type="text" inputMode="decimal" value={formData.attentionScore} onChange={(e) => setFormData({...formData, attentionScore: e.target.value.replace(/[^0-9.]/g, '')})} onFocus={(e) => e.target.select()} className="input-field score-input" placeholder="0-50" />
                  {formData.attentionScore !== '' && <span className={`grade-badge grade-${scoreToGrade(Number(formData.attentionScore)).toLowerCase()}`}>{scoreToGrade(Number(formData.attentionScore))}</span>}
                </div>
              </div>
              <div className="score-input-group">
                <span className="score-type">Memory</span>
                <div className="score-input-row">
                  <input type="text" inputMode="decimal" value={formData.memoryScore} onChange={(e) => setFormData({...formData, memoryScore: e.target.value.replace(/[^0-9.]/g, '')})} onFocus={(e) => e.target.select()} className="input-field score-input" placeholder="0-50" />
                  {formData.memoryScore !== '' && <span className={`grade-badge grade-${scoreToGrade(Number(formData.memoryScore)).toLowerCase()}`}>{scoreToGrade(Number(formData.memoryScore))}</span>}
                </div>
              </div>
            </div>
            <div className="score-legend">A: ≥20 | B: 15-19.9 | C: &lt;15</div>
          </div>
          <div className="form-group age-section">
            <label className="cogmate-label">Age & Brain Age</label>
            <div className="age-inputs">
              <div className="age-input-group">
                <span className="score-type">อายุจริง</span>
                <input type="text" inputMode="numeric" value={formData.realAge} onChange={(e) => setFormData({...formData, realAge: e.target.value.replace(/[^0-9]/g, '')})} onFocus={(e) => e.target.select()} className="input-field" placeholder="ปี" />
              </div>
              <div className="age-input-group">
                <span className="score-type">อายุสมอง</span>
                <input type="text" inputMode="numeric" value={formData.brainAge} onChange={(e) => setFormData({...formData, brainAge: e.target.value.replace(/[^0-9]/g, '')})} onFocus={(e) => e.target.select()} className="input-field" placeholder="ปี" />
              </div>
            </div>
            {hasAges && (
              <div className={`brain-gap-display ${brainGap >= 0 ? 'positive' : 'negative'}`}>
                <span className="gap-icon">{brainGap >= 10 ? '🌟' : brainGap >= 5 ? '👍' : brainGap >= 0 ? '✓' : '⚠️'}</span>
                <span className="gap-label">Brain Gap:</span>
                <span className="gap-value">{brainGap >= 0 ? '+' : ''}{brainGap} ปี</span>
                <span className="gap-points">→ {preview.brainGapPoints} คะแนน</span>
              </div>
            )}
          </div>
          {hasScores && (
            <div className="preview-card" style={{ background: tierConfig[preview.tier].bgGradient }}>
              <div className="preview-header">
                <span className="preview-emoji">{tierConfig[preview.tier].emoji}</span>
                <span className="preview-tier">{tierConfig[preview.tier].name}</span>
                <span className="preview-chrono">{chronotypeConfig[formData.chronotype].emoji}</span>
              </div>
              <div className="preview-score">{preview.total} คะแนน</div>
              <div className="preview-breakdown">
                <div className="breakdown-item"><span>Attention ({preview.attentionGrade})</span><span>{preview.attentionPoints}</span></div>
                <div className="breakdown-item"><span>Memory ({preview.memoryGrade})</span><span>{preview.memoryPoints}</span></div>
                <div className="breakdown-item"><span>Brain Gap</span><span>{preview.brainGapPoints}</span></div>
              </div>
            </div>
          )}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>ยกเลิก</button>
            <button type="button" className="btn-primary" disabled={!formData.name.trim()} onClick={handleSubmit}>ส่งคะแนน 🚀</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TierFilter = ({ selectedTier, onSelectTier, counts }) => {
  const tiers = [
    { key: 'all', name: 'All', emoji: '🎯', color: '#667eea' },
    { key: 'gold', name: 'Gold', emoji: '👑', color: '#FFD700' },
    { key: 'silver', name: 'Silver', emoji: '⚡', color: '#C0C0C0' },
    { key: 'bronze', name: 'Bronze', emoji: '🌟', color: '#CD7F32' },
    { key: 'warrior', name: 'Warrior', emoji: '💪', color: '#4ECDC4' },
    { key: 'keep-fighting', name: 'Fighting', emoji: '🔥', color: '#FF6B6B' },
  ];
  return (
    <div className="tier-filter">
      {tiers.map(tier => (
        <button key={tier.key} className={`filter-btn ${selectedTier === tier.key ? 'active' : ''}`} onClick={() => onSelectTier(tier.key)} style={{ '--tier-color': tier.color }}>
          <span className="filter-emoji">{tier.emoji}</span>
          <span className="filter-name">{tier.name}</span>
          <span className="filter-count">{counts[tier.key] || 0}</span>
        </button>
      ))}
    </div>
  );
};

const Leaderboard = ({ participants, filterTier }) => {
  const sorted = participants.map(p => ({ ...p, score: calculateBPI(p.attentionScore, p.memoryScore, p.realAge, p.brainAge) })).filter(p => filterTier === 'all' || p.score.tier === filterTier).sort((a, b) => b.score.total - a.score.total).slice(0, 10);
  return (
    <div className="leaderboard">
      <div className="leaderboard-header"><h3>🏆 Top 10 {filterTier !== 'all' ? tierConfig[filterTier]?.name : 'Heroes'}</h3></div>
      <div className="leaderboard-list">
        {sorted.map((p, i) => {
          const tier = tierConfig[p.score.tier];
          return (
            <div key={p.id} className={`leaderboard-item rank-${i + 1}`}>
              <div className="rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</div>
              <div className="participant-info">
                <span className="participant-name">{p.name} {chronotypeConfig[p.chronotype]?.emoji}</span>
                <span className="participant-tier" style={{ color: tier.color }}>{tier.emoji} {tier.name}</span>
              </div>
              <div className="participant-score" style={{ color: tier.color }}>{p.score.total}</div>
            </div>
          );
        })}
        {sorted.length === 0 && <div className="no-participants">{filterTier === 'all' ? 'รอผู้เข้าแข่งขัน...' : `ยังไม่มี ${tierConfig[filterTier]?.name}`}</div>}
      </div>
    </div>
  );
};

const StatsSummary = ({ participants }) => (
  <div className="stats-summary">
    <div className="stat-item total"><span className="stat-value">{participants.length}</span><span className="stat-label">คน</span></div>
    {Object.entries(chronotypeConfig).map(([key, value]) => (
      <div key={key} className="stat-item"><span className="stat-emoji">{value.emoji}</span><span className="stat-value">{participants.filter(p => p.chronotype === key).length}</span></div>
    ))}
  </div>
);

const ScoreboardView = ({ participants, onAddDemo, onClearAll, filterTier, setFilterTier, musicPlaying, setMusicPlaying }) => {
  const tierCounts = { all: participants.length };
  participants.forEach(p => { const score = calculateBPI(p.attentionScore, p.memoryScore, p.realAge, p.brainAge); tierCounts[score.tier] = (tierCounts[score.tier] || 0) + 1; });
  const filteredForFloat = participants.map(p => ({ ...p, score: calculateBPI(p.attentionScore, p.memoryScore, p.realAge, p.brainAge) })).filter(p => filterTier === 'all' || p.score.tier === filterTier).sort((a, b) => b.timestamp - a.timestamp).slice(0, 15);
  return (
    <div className="scoreboard-view">
      <div className="scoreboard-header">
        <div className="logo-section"><span className="brain-logo">🧠</span><div><h1>Brain Performance Hero</h1><p>CogMate™ Competition</p></div></div>
        <StatsSummary participants={participants} />
        <div className="event-info"><span>31 Mar 2026</span><span>Samitivej × Eisai</span></div>
      </div>
      <TierFilter selectedTier={filterTier} onSelectTier={setFilterTier} counts={tierCounts} />
      <div className="scoreboard-main">
        <div className="floating-area" key={`float-${filterTier}`}>
          {filteredForFloat.map((p, i) => <FloatingScore key={`${p.id}-${filterTier}`} participant={p} index={i} />)}
          {filteredForFloat.length === 0 && (
            <div className="waiting-message">
              <span className="waiting-emoji">{filterTier !== 'all' ? tierConfig[filterTier]?.emoji : '🎯'}</span>
              <span>{filterTier === 'all' ? 'รอผู้เข้าแข่งขัน...' : `ยังไม่มี ${tierConfig[filterTier]?.name}`}</span>
              {filterTier !== 'all' && <span style={{fontSize: '0.8rem', opacity: 0.6}}>กดปุ่ม "🎯 All" เพื่อดูทั้งหมด</span>}
            </div>
          )}
        </div>
        <Leaderboard participants={participants} filterTier={filterTier} />
      </div>
      <div className="scoreboard-footer">
        <div className="tier-legend">
          {Object.entries(tierConfig).map(([key, value]) => (
            <button key={key} className={`tier-badge ${filterTier === key ? 'active' : ''}`} style={{ background: value.bgGradient }} onClick={() => setFilterTier(filterTier === key ? 'all' : key)}>{value.emoji} {value.name}</button>
          ))}
        </div>
      </div>
      <div className="control-buttons">
        <BackgroundMusic isPlaying={musicPlaying} setIsPlaying={setMusicPlaying} />
        <button className="demo-btn" onClick={onAddDemo}>➕ เพิ่ม Demo</button>
        <button className="clear-btn" onClick={onClearAll}>🗑️ ล้างข้อมูล</button>
      </div>
    </div>
  );
};

const STORAGE_KEY = 'brain-hero-v4';
const saveToStorage = (data) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {} };
const loadFromStorage = () => { try { const d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : null; } catch(e) { return null; } };

export default function App() {
  const [view, setView] = useState('scoreboard');
  const [participants, setParticipants] = useState([]);
  const [filterTier, setFilterTier] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [musicPlaying, setMusicPlaying] = useState(false);

  useEffect(() => { const stored = loadFromStorage(); if (stored?.length > 0) setParticipants(stored); setIsLoading(false); }, []);
  useEffect(() => { if (!isLoading) saveToStorage(participants); }, [participants, isLoading]);

  const addParticipant = (data) => { setParticipants(prev => [...prev, data]); setView('scoreboard'); };
  const addDemoParticipant = () => {
    const names = ['มานะ', 'มานี', 'ปิติ', 'ชูใจ', 'วิริยะ', 'สมชาย', 'สมหญิง', 'วิชัย', 'นภา', 'ธนา', 'กานต์', 'แก้ว', 'เพชร', 'ทอง'];
    const chronotypes = ['lion', 'bear', 'wolf', 'dolphin'];
    const scoreProfiles = [
      { att: 38, mem: 35, rAge: 60, bAge: 42 },{ att: 40, mem: 38, rAge: 55, bAge: 40 },
      { att: 25, mem: 22, rAge: 52, bAge: 44 },{ att: 22, mem: 20, rAge: 48, bAge: 42 },
      { att: 20, mem: 20, rAge: 45, bAge: 43 },{ att: 18, mem: 20, rAge: 42, bAge: 40 },
      { att: 17, mem: 16, rAge: 40, bAge: 38 },{ att: 15, mem: 15, rAge: 38, bAge: 40 },
      { att: 12, mem: 10, rAge: 35, bAge: 42 },{ att: 8, mem: 12, rAge: 30, bAge: 45 },
    ];
    const profile = scoreProfiles[Math.floor(Math.random() * scoreProfiles.length)];
    setParticipants(prev => [...prev, { id: Date.now(), name: names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 100), attentionScore: profile.att, memoryScore: profile.mem, realAge: profile.rAge, brainAge: profile.bAge, chronotype: chronotypes[Math.floor(Math.random() * chronotypes.length)], timestamp: Date.now() }]);
  };
  const clearAll = () => { if (confirm('ล้างข้อมูลทั้งหมด?')) { setParticipants([]); localStorage.removeItem(STORAGE_KEY); } };

  if (isLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', color: 'white', fontFamily: 'Prompt, sans-serif' }}><div style={{ textAlign: 'center' }}><span style={{ fontSize: '80px', display: 'block', animation: 'pulse 1s infinite' }}>🧠</span><p>Loading...</p></div></div>;

  return (
    <div className="app-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .app-container { font-family: 'Prompt', sans-serif; min-height: 100vh; background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460); color: white; overflow-x: hidden; }
        .nav-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; justify-content: center; gap: 10px; padding: 12px; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); }
        .nav-btn { padding: 10px 24px; border: none; border-radius: 25px; font-family: inherit; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.3s; background: rgba(255,255,255,0.1); color: white; }
        .nav-btn:hover { background: rgba(255,255,255,0.2); transform: translateY(-2px); }
        .nav-btn.active { background: linear-gradient(135deg, #FF6B9D, #C44569); box-shadow: 0 4px 15px rgba(255,107,157,0.4); }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .form-view { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 80px 20px 20px; }
        .form-container { background: rgba(255,255,255,0.05); border-radius: 25px; padding: 30px; width: 100%; max-width: 480px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
        .form-header { text-align: center; margin-bottom: 20px; }
        .form-header .brain-icon { font-size: 50px; display: block; margin-bottom: 10px; }
        .animate-bounce { animation: bounce 1s infinite; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .form-header h2 { font-size: 1.5rem; font-weight: 700; background: linear-gradient(135deg, #FF6B9D, #4ECDC4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .form-header p { color: rgba(255,255,255,0.6); font-size: 0.85rem; }
        .form-group { margin-bottom: 16px; }
        .form-group > label { display: block; margin-bottom: 6px; font-weight: 500; color: rgba(255,255,255,0.8); font-size: 0.9rem; }
        .input-field { width: 100%; padding: 12px; border: 2px solid rgba(255,255,255,0.1); border-radius: 10px; background: rgba(255,255,255,0.05); color: white; font-family: inherit; font-size: 1rem; transition: all 0.3s; }
        .input-field:focus { outline: none; border-color: #4ECDC4; background: rgba(78,205,196,0.1); }
        .input-field::placeholder { color: rgba(255,255,255,0.3); }
        .chronotype-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .chronotype-btn { display: flex; flex-direction: column; align-items: center; padding: 10px 5px; border: 2px solid rgba(255,255,255,0.15); border-radius: 12px; background: rgba(255,255,255,0.03); color: white; font-family: inherit; cursor: pointer; transition: all 0.3s; }
        .chronotype-btn:hover { border-color: rgba(255,255,255,0.3); transform: translateY(-2px); }
        .chronotype-btn.active { border-color: #4ECDC4; background: rgba(78,205,196,0.15); }
        .chronotype-btn .chrono-emoji { font-size: 1.5rem; }
        .chronotype-btn .chrono-name { font-weight: 600; font-size: 0.75rem; }
        .cogmate-section { margin-top: 16px; }
        .cogmate-label { display: block; margin-bottom: 10px; font-weight: 600; font-size: 1rem; color: white !important; }
        .cogmate-label sup { font-size: 0.6em; }
        .cogmate-scores { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .score-input-group { display: flex; flex-direction: column; gap: 4px; }
        .score-type { font-size: 0.8rem; color: rgba(255,255,255,0.7); font-weight: 500; }
        .score-input-row { display: flex; gap: 8px; align-items: center; }
        .score-input { flex: 1; }
        .score-legend { text-align: center; font-size: 0.7rem; color: rgba(255,255,255,0.5); margin-top: 8px; }
        .grade-badge { padding: 8px 12px; border-radius: 8px; font-weight: 700; font-size: 0.9rem; min-width: 40px; text-align: center; }
        .grade-a { background: linear-gradient(135deg, #4ECDC4, #45B7D1); color: white; }
        .grade-b { background: linear-gradient(135deg, #FFD93D, #FF9F1C); color: #333; }
        .grade-c { background: linear-gradient(135deg, #FF6B6B, #ee5a5a); color: white; }
        .age-section { margin-top: 16px; }
        .age-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .age-input-group { display: flex; flex-direction: column; gap: 4px; }
        .brain-gap-display { margin-top: 10px; padding: 10px 12px; border-radius: 10px; display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9rem; }
        .brain-gap-display.positive { background: rgba(78,205,196,0.15); border: 1px solid rgba(78,205,196,0.3); }
        .brain-gap-display.negative { background: rgba(255,107,107,0.15); border: 1px solid rgba(255,107,107,0.3); }
        .gap-icon { font-size: 1rem; }
        .gap-label { color: rgba(255,255,255,0.7); }
        .gap-value { font-weight: 700; }
        .gap-points { margin-left: auto; color: rgba(255,255,255,0.6); font-size: 0.85rem; }
        .preview-card { border-radius: 16px; padding: 16px; margin: 16px 0; text-align: center; animation: slideUp 0.3s; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .preview-header { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 6px; }
        .preview-emoji { font-size: 1.5rem; }
        .preview-tier { font-size: 1rem; font-weight: 700; }
        .preview-chrono { font-size: 1.2rem; }
        .preview-score { font-size: 2.2rem; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
        .preview-breakdown { display: flex; justify-content: center; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
        .breakdown-item { display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.2); padding: 6px 10px; border-radius: 8px; font-size: 0.75rem; }
        .form-actions { display: flex; gap: 12px; margin-top: 16px; }
        .btn-primary, .btn-secondary { flex: 1; padding: 12px; border: none; border-radius: 10px; font-family: inherit; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; }
        .btn-primary { background: linear-gradient(135deg, #FF6B9D, #C44569); color: white; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(255,107,157,0.4); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary { background: rgba(255,255,255,0.1); color: white; }
        .btn-secondary:hover { background: rgba(255,255,255,0.2); }
        .scoreboard-view { min-height: 100vh; display: flex; flex-direction: column; padding-top: 65px; }
        .scoreboard-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 25px; background: rgba(0,0,0,0.3); flex-wrap: wrap; gap: 12px; }
        .logo-section { display: flex; align-items: center; gap: 12px; }
        .brain-logo { font-size: 40px; animation: pulse 2s infinite; }
        .logo-section h1 { font-size: 1.4rem; font-weight: 800; background: linear-gradient(135deg, #FF6B9D, #4ECDC4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .logo-section p { font-size: 0.75rem; color: rgba(255,255,255,0.6); }
        .stats-summary { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05); padding: 8px 16px; border-radius: 12px; }
        .stat-item { display: flex; flex-direction: column; align-items: center; gap: 1px; }
        .stat-item.total { padding-right: 12px; border-right: 1px solid rgba(255,255,255,0.2); }
        .stat-emoji { font-size: 1rem; }
        .stat-value { font-size: 1.1rem; font-weight: 700; }
        .stat-label { font-size: 0.65rem; opacity: 0.7; }
        .event-info { display: flex; gap: 15px; color: rgba(255,255,255,0.7); font-size: 0.8rem; }
        .tier-filter { display: flex; justify-content: center; gap: 8px; padding: 15px 20px; background: rgba(0,0,0,0.3); flex-wrap: wrap; }
        .filter-btn { display: flex; align-items: center; gap: 8px; padding: 12px 18px; border: 3px solid rgba(255,255,255,0.2); border-radius: 25px; background: rgba(255,255,255,0.08); color: white; font-family: inherit; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.3s; }
        .filter-btn:hover { border-color: var(--tier-color); background: rgba(255,255,255,0.15); transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
        .filter-btn.active { background: var(--tier-color); border-color: var(--tier-color); box-shadow: 0 5px 20px rgba(0,0,0,0.4); transform: scale(1.05); }
        .filter-emoji { font-size: 1.2rem; }
        .filter-name { font-size: 0.9rem; }
        .filter-count { background: rgba(0,0,0,0.4); padding: 3px 10px; border-radius: 10px; font-size: 0.8rem; font-weight: 700; }
        .scoreboard-main { flex: 1; display: grid; grid-template-columns: 1fr 300px; gap: 12px; padding: 12px; }
        .floating-area { position: relative; background: rgba(255,255,255,0.02); border-radius: 16px; overflow: hidden; min-height: 320px; }
        .waiting-message { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 12px; color: rgba(255,255,255,0.4); font-size: 1.2rem; text-align: center; }
        .waiting-emoji { font-size: 3.5rem; animation: pulse 2s infinite; }
        .floating-score { position: absolute; left: var(--start-x); top: var(--start-y); animation: float var(--duration) ease-in-out infinite; animation-delay: var(--delay); z-index: 10; }
        @keyframes float { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 25% { transform: translate(20px, -30px) rotate(3deg); } 50% { transform: translate(-10px, -45px) rotate(-2deg); } 75% { transform: translate(30px, -20px) rotate(2deg); } }
        .score-bubble { padding: 10px 16px; border-radius: 14px; display: flex; flex-direction: column; align-items: center; gap: 2px; box-shadow: 0 6px 20px rgba(0,0,0,0.3); min-width: 90px; animation: glow 2s ease-in-out infinite alternate; }
        @keyframes glow { from { box-shadow: 0 6px 20px rgba(0,0,0,0.3); } to { box-shadow: 0 6px 30px rgba(255,255,255,0.15); } }
        .score-top { display: flex; gap: 4px; }
        .score-emoji { font-size: 1.1rem; }
        .score-bubble .chrono-emoji { font-size: 0.9rem; }
        .score-name { font-weight: 600; font-size: 0.85rem; }
        .score-value { font-size: 1.5rem; font-weight: 800; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
        .score-tier { font-size: 0.65rem; opacity: 0.9; }
        .leaderboard { background: rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; }
        .leaderboard-header { text-align: center; margin-bottom: 12px; }
        .leaderboard-header h3 { font-size: 1.1rem; font-weight: 700; background: linear-gradient(135deg, #FFD700, #FFA500); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .leaderboard-list { flex: 1; overflow-y: auto; }
        .leaderboard-item { display: flex; align-items: center; padding: 10px; border-radius: 10px; margin-bottom: 6px; background: rgba(255,255,255,0.03); transition: all 0.3s; }
        .leaderboard-item:hover { background: rgba(255,255,255,0.08); transform: translateX(4px); }
        .leaderboard-item.rank-1 { background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,165,0,0.1)); border: 1px solid rgba(255,215,0,0.3); }
        .leaderboard-item.rank-2 { background: linear-gradient(135deg, rgba(192,192,192,0.2), rgba(168,168,168,0.1)); border: 1px solid rgba(192,192,192,0.3); }
        .leaderboard-item.rank-3 { background: linear-gradient(135deg, rgba(205,127,50,0.2), rgba(139,69,19,0.1)); border: 1px solid rgba(205,127,50,0.3); }
        .rank { width: 32px; font-size: 1.1rem; font-weight: 700; }
        .participant-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
        .participant-name { font-weight: 600; font-size: 0.85rem; }
        .participant-tier { font-size: 0.7rem; }
        .participant-score { font-size: 1.4rem; font-weight: 800; }
        .no-participants { text-align: center; color: rgba(255,255,255,0.4); padding: 25px; }
        .scoreboard-footer { padding: 12px 25px; background: rgba(0,0,0,0.3); }
        .tier-legend { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; }
        .tier-badge { padding: 8px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; border: 3px solid transparent; cursor: pointer; transition: all 0.3s; font-family: inherit; color: white; }
        .tier-badge:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.4); border-color: white; }
        .tier-badge.active { border-color: white; transform: scale(1.1); box-shadow: 0 5px 20px rgba(255,255,255,0.3); }
        .control-buttons { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 100; }
        .demo-btn, .clear-btn, .music-btn { padding: 14px 20px; border: none; border-radius: 25px; color: white; font-family: inherit; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.3); min-width: 120px; text-align: center; }
        .demo-btn { background: linear-gradient(135deg, #667eea, #764ba2); }
        .clear-btn { background: linear-gradient(135deg, #FF6B6B, #ee5a5a); }
        .music-btn { background: linear-gradient(135deg, #4ECDC4, #45B7D1); }
        .demo-btn:hover, .clear-btn:hover, .music-btn:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.4); }
        @media (max-width: 900px) { .scoreboard-main { grid-template-columns: 1fr; } .floating-area { min-height: 250px; } .scoreboard-header { justify-content: center; text-align: center; } .stats-summary { order: 3; width: 100%; justify-content: center; } }
        @media (max-width: 600px) { .nav-bar { padding: 8px; gap: 5px; } .nav-btn { padding: 8px 14px; font-size: 12px; } .chronotype-grid { grid-template-columns: repeat(4, 1fr); } .cogmate-scores { grid-template-columns: 1fr; } .age-inputs { grid-template-columns: 1fr 1fr; } .tier-filter { gap: 6px; padding: 10px; } .filter-btn { padding: 10px 14px; font-size: 0.85rem; } .filter-name { display: none; } .filter-emoji { font-size: 1.3rem; } .control-buttons { bottom: 15px; right: 15px; gap: 8px; } .demo-btn, .clear-btn, .music-btn { padding: 12px 16px; font-size: 0.8rem; min-width: 100px; } }
      `}</style>
      <nav className="nav-bar">
        <button className={`nav-btn ${view === 'form' ? 'active' : ''}`} onClick={() => setView('form')}>✏️ กรอกข้อมูล</button>
        <button className={`nav-btn ${view === 'scoreboard' ? 'active' : ''}`} onClick={() => setView('scoreboard')}>🏆 Scoreboard</button>
      </nav>
      {view === 'form' && <InputFormView onSubmit={addParticipant} onCancel={() => setView('scoreboard')} />}
      {view === 'scoreboard' && <ScoreboardView participants={participants} onAddDemo={addDemoParticipant} onClearAll={clearAll} filterTier={filterTier} setFilterTier={setFilterTier} musicPlaying={musicPlaying} setMusicPlaying={setMusicPlaying} />}
    </div>
  );
}
