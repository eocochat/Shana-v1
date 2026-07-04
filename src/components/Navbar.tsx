import React, { useState, useEffect } from 'react';
import { ActiveTab, Language } from '../types';
import { translations } from '../translations';
import { Home, Mic, Video, Clock, User, Sparkles, Compass, Brain } from 'lucide-react';
import { StorageService } from '../lib/storage';

interface NavbarProps {
  activeTab: ActiveTab;
  lang: Language;
  onTabChange: (tab: ActiveTab) => void;
}

export default function Navbar({ activeTab, lang, onTabChange }: NavbarProps) {
  const t = translations[lang];
  
  // Local state to re-trigger rendering if profile picture changes
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const updateAvatar = () => {
    const session = StorageService.getSession();
    setProfilePicture(session?.profile?.avatarUrl || (session?.profile as any)?.profilePicture || null);
  };

  useEffect(() => {
    updateAvatar();
    
    // Listen for progress / profile update triggers
    window.addEventListener('shana_progress_update', updateAvatar);
    return () => {
      window.removeEventListener('shana_progress_update', updateAvatar);
    };
  }, []);

  const session = StorageService.getSession();
  const userRole = session?.user?.role || 'candidate';

  const items: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'home', label: t.nav.home, icon: Home },
    { id: 'candidate-brain', label: lang === 'FR' ? 'Cerveau IA' : 'SHANA Brain', icon: Brain },
    { id: 'train', label: t.nav.train, icon: Mic },
    { id: 'discoveries', label: (t.nav as any).discoveries || 'Discoveries', icon: Compass },
    { id: 'assessment', label: t.nav.assessment, icon: Video },
    { id: 'history', label: t.nav.history, icon: Clock },
    { id: 'purchase', label: lang === 'FR' ? 'Abonnement' : 'Upgrade', icon: Sparkles },
    { id: 'profile', label: t.nav.profile, icon: User }
  ];

  if (userRole === 'admin' || userRole === 'super_admin') {
    items.push({ id: 'admin', label: (t.nav as any).admin || 'Admin', icon: Sparkles });
  }

  return (
    <nav id="app-navbar" className="bg-white border-b-[2.5px] border-stone-950 sticky top-0 z-40 selection:bg-stone-900 selection:text-white">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onTabChange('home')}>
            <div className="w-8 h-8 rounded-xl bg-[#18633F] border-2 border-stone-950 flex items-center justify-center text-white shadow-[2px_2px_0px_0px_#111111]">
              <span className="font-sans font-black text-xs leading-none">S</span>
            </div>
            <div>
              <span className="font-sans font-black text-base tracking-tight text-stone-950 uppercase">{t.brand}</span>
              <span className="font-mono text-[9px] text-stone-500 uppercase tracking-widest block leading-none">SYSTEM // PRO</span>
            </div>
          </div>
 
          {/* Desktop Navigation Items */}
          <div className="hidden md:flex items-center gap-2">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-desktop-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wide transition-all uppercase flex items-center gap-1.5 cursor-pointer ${
                    isActive 
                      ? 'bg-[#A7F3D0] text-stone-950 border-[1.5px] border-stone-950 shadow-[2px_2px_0px_0px_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px]' 
                      : 'text-stone-500 hover:text-stone-950 hover:bg-stone-50 border-[1.5px] border-transparent'
                  }`}
                >
                  {item.id === 'profile' && profilePicture ? (
                    <img 
                      src={profilePicture} 
                      alt="Avatar" 
                      className="w-3.5 h-3.5 rounded-full object-cover border border-stone-950"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-stone-950' : 'text-stone-400'}`} />
                  )}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
 
          {/* Mobile Right Quick Indicator */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] bg-[#EDC154] text-stone-950 px-2.5 py-1 rounded-md border-2 border-stone-950 uppercase font-black tracking-widest shadow-[1.5px_1.5px_0px_0px_#111111]">
              {lang}
            </span>
          </div>
 
        </div>
      </div>
 
      {/* Floating Bottom Nav for Mobile viewports */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t-[2.5px] border-stone-950 py-2 px-3 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-50 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-mobile-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl flex-shrink-0 cursor-pointer min-w-[54px] transition-all ${
                isActive ? 'bg-[#A7F3D0] border border-stone-950 shadow-[1px_1px_0px_0px_#111111]' : 'border border-transparent'
              }`}
            >
              {item.id === 'profile' && profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt="Avatar" 
                  className="w-4.5 h-4.5 rounded-full object-cover border border-stone-950"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-stone-950' : 'text-stone-400'}`} />
              )}
              <span className={`text-[8.5px] mt-1 font-black leading-none uppercase tracking-wider ${
                isActive ? 'text-stone-950' : 'text-stone-500'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
