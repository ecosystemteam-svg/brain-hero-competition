import React, { useState, useEffect, useRef } from 'react';

const API_URL = 'https://script.google.com/macros/s/AKfycbw5Xsl-6-CaCuCVaodK8fIkhfzHwOdIzUZr5xI_owbEX2iOWDfB5j6w8BMPODX1fRmN/exec';

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
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
  };
  useEffect(() => { if (isPlaying) playMusic(); else stopMusic(); return () => stopMusic(); }, [isPlaying]);
  return <button className="music-btn" onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? '🔊 Music ON' : '🔇 Music OFF'}</button>;
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
  return
