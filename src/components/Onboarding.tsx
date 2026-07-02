import React, { useState } from 'react';
import { Language, UserProfile } from '../types';
import { translations } from '../translations';
import { Sparkles, Globe, ShieldCheck, Mail, Briefcase, Award, Building } from 'lucide-react';
import { motion } from 'motion/react';
import { getBrowserLanguage } from '../utils';

interface OnboardingProps {
  onComplete: (lang: Language, profile: UserProfile) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [selectedLang, setSelectedLang] = useState<Language>(getBrowserLanguage);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'junior' | 'mid' | 'senior' | 'executive'>('mid');
  const [error, setError] = useState('');

  // Load auto-saved draft on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('shana_draft_onboarding_form');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.targetRole) setTargetRole(parsed.targetRole);
        if (parsed.industry) setIndustry(parsed.industry);
        if (parsed.experienceLevel) setExperienceLevel(parsed.experienceLevel);
        if (parsed.selectedLang) setSelectedLang(parsed.selectedLang);
      }
    } catch (e) {
      console.warn("Failed to load onboarding form draft", e);
    }
  }, []);

  // Save draft whenever form values change
  React.useEffect(() => {
    try {
      // Only save if at least one field has content to avoid overwriting with empty on initial render
      if (name || email || targetRole || industry) {
        localStorage.setItem('shana_draft_onboarding_form', JSON.stringify({
          name,
          email,
          targetRole,
          industry,
          experienceLevel,
          selectedLang
        }));
      }
    } catch (e) {
      console.warn("Failed to save onboarding form draft", e);
    }
  }, [name, email, targetRole, industry, experienceLevel, selectedLang]);

  const t = translations[selectedLang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(t.onboarding.errorName);
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError(t.onboarding.errorEmail);
      return;
    }
    if (!targetRole.trim()) {
      setError(t.onboarding.errorRole);
      return;
    }
    if (!industry.trim()) {
      setError(t.onboarding.errorIndustry);
      return;
    }

    onComplete(selectedLang, {
      name: name.trim(),
      email: email.trim(),
      targetRole: targetRole.trim(),
      industry: industry.trim(),
      experienceLevel,
    });
    try {
      localStorage.removeItem('shana_draft_onboarding_form');
    } catch (e) {}
  };

  return (
    <div id="onboarding-container" className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-center p-4 md:p-8 selection:bg-[#1A2B3C] selection:text-white">
      <div className="w-full max-w-xl bg-white border border-[#E5E7EB] shadow-xl rounded-[32px] p-6 md:p-10 transition-all">
        
        {/* Language Selection Header Toggle */}
        <div className="flex justify-between items-center mb-10 border-b border-[#F3F4F6] pb-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#9CA3AF] uppercase tracking-widest">SHANA SYSTEM // PRO</span>
          </div>
          <div className="flex items-center bg-[#F3F4F6] p-0.5 rounded-full border border-[#E5E7EB]">
            <button
              id="lang-toggle-en"
              type="button"
              onClick={() => setSelectedLang('EN')}
              className={`px-3 py-1 text-[11px] font-bold rounded-full cursor-pointer transition-all ${
                selectedLang === 'EN'
                  ? 'bg-white text-[#1A2B3C] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#1A2B3C]'
              }`}
            >
              EN
            </button>
            <button
              id="lang-toggle-fr"
              type="button"
              onClick={() => setSelectedLang('FR')}
              className={`px-3 py-1 text-[11px] font-bold rounded-full cursor-pointer transition-all ${
                selectedLang === 'FR'
                  ? 'bg-white text-[#1A2B3C] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#1A2B3C]'
              }`}
            >
              FR
            </button>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-block px-3 py-1 bg-[#F3F4F6] text-[#1A2B3C] font-mono text-[10px] font-bold tracking-wider rounded-full uppercase mb-4"
          >
            ✦ {t.brand} INTUITIVE ✦
          </motion.div>
          <h1 id="onboarding-title" className="text-2xl md:text-3xl font-sans font-bold tracking-tight text-[#1A2B3C]">
            {t.onboarding.welcome}
          </h1>
          <p id="onboarding-subtitle" className="text-[#6B7280] text-sm mt-2 max-w-md mx-auto leading-relaxed">
            {t.onboarding.subtitle}
          </p>
        </div>

        {error && (
          <div id="onboarding-error" className="mb-6 p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-100 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            {error}
          </div>
        )}

        {/* Onboarding Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] uppercase tracking-widest font-bold text-[#9CA3AF] mb-2">
              {t.onboarding.nameLabel}
            </label>
            <input
              id="input-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.onboarding.namePlaceholder}
              className="w-full border-b-2 border-[#E5E7EB] py-2 focus:border-[#1A2B3C] outline-none text-[#111827] transition-colors text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest font-bold text-[#9CA3AF] mb-2">
              {t.onboarding.emailLabel}
            </label>
            <input
              id="input-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.onboarding.emailPlaceholder}
              className="w-full border-b-2 border-[#E5E7EB] py-2 focus:border-[#1A2B3C] outline-none text-[#111827] transition-colors text-sm font-medium"
            />
            <p className="text-[10px] text-[#6B7280] mt-1 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span>Secure isolated storage active. No credit card required.</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold text-[#9CA3AF] mb-2">
                {t.onboarding.roleLabel}
              </label>
              <input
                id="input-role"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder={t.onboarding.rolePlaceholder}
                className="w-full border-b-2 border-[#E5E7EB] py-2 focus:border-[#1A2B3C] outline-none text-[#111827] transition-colors text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold text-[#9CA3AF] mb-2">
                {t.onboarding.industryLabel}
              </label>
              <input
                id="input-industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder={t.onboarding.industryPlaceholder}
                className="w-full border-b-2 border-[#E5E7EB] py-2 focus:border-[#1A2B3C] outline-none text-[#111827] transition-colors text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest font-bold text-[#9CA3AF] mb-2">
              {t.onboarding.expLabel}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'junior', label: t.onboarding.expJunior },
                { key: 'mid', label: t.onboarding.expMid },
                { key: 'senior', label: t.onboarding.expSenior },
                { key: 'executive', label: t.onboarding.expExec }
              ].map((item) => (
                <button
                  key={item.key}
                  id={`exp-btn-${item.key}`}
                  type="button"
                  onClick={() => setExperienceLevel(item.key as any)}
                  className={`px-3 py-2.5 rounded-xl border text-[11px] font-bold cursor-pointer text-left transition-all ${
                    experienceLevel === item.key
                      ? 'border-[#1A2B3C] bg-[#1A2B3C]/5 text-[#1A2B3C] font-extrabold ring-1 ring-[#1A2B3C]'
                      : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#1A2B3C]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button
            id="onboarding-submit-btn"
            type="submit"
            className="w-full mt-6 bg-[#1A2B3C] hover:bg-[#2C3E50] text-white font-bold py-4 px-6 rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-between"
          >
            <span>{t.onboarding.startBtn}</span>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
