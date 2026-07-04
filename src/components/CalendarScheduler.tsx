import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Download, 
  ExternalLink, 
  Flame, 
  Trophy, 
  Plus, 
  Trash2, 
  AlertCircle, 
  TrendingUp, 
  Check, 
  PartyPopper 
} from 'lucide-react';
import { Language, SessionHistoryItem, UserProfile } from '../types';
import { StorageService } from '../lib/storage';
import { useToast } from './Toast';

interface CalendarSchedulerProps {
  user: UserProfile;
  history: SessionHistoryItem[];
  lang: Language;
}

export interface ScheduledSession {
  id: string;
  dateTime: string; // ISO String
  type: 'Power' | 'Weakness' | 'Sprint' | 'Custom';
  bonusXP: number;
  label: string;
  labelFr: string;
}

export default function CalendarScheduler({ user, history, lang }: CalendarSchedulerProps) {
  const isFr = lang === 'FR';
  const toast = useToast();
  const userId = user.id || 'usr_candidate';

  // State for scheduled sessions
  const [scheduled, setScheduled] = useState<ScheduledSession[]>(() => {
    try {
      const saved = localStorage.getItem(`shana_scheduled_v2_${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Scheduling objective progression states
  const [syncedCount, setSyncedCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`shana_cal_sync_count_${userId}`);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Custom scheduling form
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Consistency analytical results
  const [trendMessage, setTrendMessage] = useState('');
  const [trendMessageEn, setTrendMessageEn] = useState('');
  const [suggestedSlots, setSuggestedSlots] = useState<Omit<ScheduledSession, 'id'>[]>([]);

  // Time ticks for countdowns
  const [now, setNow] = useState(new Date());

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(`shana_scheduled_v2_${userId}`, JSON.stringify(scheduled));
  }, [scheduled, userId]);

  useEffect(() => {
    localStorage.setItem(`shana_cal_sync_count_${userId}`, syncedCount.toString());
  }, [syncedCount, userId]);

  // Keep track of current time for live countdown ticks
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000); // tick every 10 seconds is plenty for minute-level countdowns
    return () => clearInterval(timer);
  }, []);

  // Compute consistency trends and generate personalized optimal time slots
  useEffect(() => {
    if (history.length === 0) {
      setTrendMessage("Régularité à définir. Commençons par programmer votre premier créneau d'entraînement !");
      setTrendMessageEn("Consistency baseline pending. Let's schedule your first practice slot to start strong!");
      
      // Default recommended slots (Thursday 10am, Saturday 11am, Tuesday 6pm)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const t1 = new Date(tomorrow); t1.setHours(10, 0, 0, 0);
      const t2 = new Date(tomorrow); t2.setDate(t2.getDate() + 2); t2.setHours(11, 0, 0, 0);
      const t3 = new Date(tomorrow); t3.setDate(t3.getDate() + 3); t3.setHours(18, 0, 0, 0);

      setSuggestedSlots([
        {
          dateTime: t1.toISOString(),
          type: 'Power',
          bonusXP: 25,
          label: 'Power Morning Session',
          labelFr: 'Créneau Performance Matin'
        },
        {
          dateTime: t2.toISOString(),
          type: 'Sprint',
          bonusXP: 15,
          label: 'Weekend Refresher',
          labelFr: 'Sprint de Révision Week-end'
        },
        {
          dateTime: t3.toISOString(),
          type: 'Weakness',
          bonusXP: 20,
          label: 'Deep Evening Focus',
          labelFr: 'Entraînement Intensif Soir'
        }
      ]);
      return;
    }

    // Tally weekdays (0-6) and hours
    const daysTally = Array(7).fill(0);
    const intervalsTally = { morning: 0, afternoon: 0, evening: 0 };

    history.forEach(item => {
      const d = new Date(item.date);
      if (isNaN(d.getTime())) return;
      daysTally[d.getDay()] += 1;
      const hour = d.getHours();
      if (hour >= 6 && hour < 12) intervalsTally.morning += 1;
      else if (hour >= 12 && hour < 18) intervalsTally.afternoon += 1;
      else intervalsTally.evening += 1;
    });

    // Find peak day
    let peakDay = 2; // Default Tuesday
    let maxDayCount = -1;
    daysTally.forEach((count, idx) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        peakDay = idx;
      }
    });

    // Find peak interval
    let peakInterval: 'morning' | 'afternoon' | 'evening' = 'morning';
    let maxIntervalCount = Math.max(intervalsTally.morning, intervalsTally.afternoon, intervalsTally.evening);
    if (maxIntervalCount === intervalsTally.afternoon) peakInterval = 'afternoon';
    else if (maxIntervalCount === intervalsTally.evening) peakInterval = 'evening';

    const dayNamesFr = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const intervalFr = peakInterval === 'morning' ? "le matin (09:00 - 12:00)" : peakInterval === 'afternoon' ? "l'après-midi (14:00 - 17:00)" : "le soir (18:00 - 21:00)";
    const intervalEn = peakInterval === 'morning' ? "mornings (09:00 - 12:00)" : peakInterval === 'afternoon' ? "afternoons (14:00 - 17:00)" : "evenings (18:00 - 21:00)";

    setTrendMessage(`Analyse de régularité : Votre zone de performance maximale est le ${dayNamesFr[peakDay]} ${intervalFr}.`);
    setTrendMessageEn(`Consistency trend: Your peak training zone is on ${dayNamesEn[peakDay]} ${intervalEn}.`);

    // Generate suggested slots based on peak day & time
    const getNextDayOfWeek = (dayOfWeek: number, hourTarget: number) => {
      const result = new Date();
      result.setDate(result.getDate() + (dayOfWeek + 7 - result.getDay()) % 7);
      if (result <= new Date()) {
        result.setDate(result.getDate() + 7);
      }
      result.setHours(hourTarget, 0, 0, 0);
      return result;
    };

    const peakHour = peakInterval === 'morning' ? 9 : peakInterval === 'afternoon' ? 14 : 18.5;
    
    const s1Date = getNextDayOfWeek(peakDay, peakHour);
    const s2Date = getNextDayOfWeek((peakDay + 2) % 7, peakHour === 9 ? 18 : 9); // Counter-balance slot
    const s3Date = getNextDayOfWeek((peakDay + 5) % 7, 13); // Weekend or lunch quick sprint

    setSuggestedSlots([
      {
        dateTime: s1Date.toISOString(),
        type: 'Power',
        bonusXP: 30,
        label: 'Peak Power Zone',
        labelFr: 'Créneau Performance Optimale'
      },
      {
        dateTime: s2Date.toISOString(),
        type: 'Weakness',
        bonusXP: 20,
        label: 'STAR Case Challenge',
        labelFr: 'STAR Cases & Résilience'
      },
      {
        dateTime: s3Date.toISOString(),
        type: 'Sprint',
        bonusXP: 15,
        label: 'Rapid Verbal Warmup',
        labelFr: 'Sprint d\'Improvisation Vocal'
      }
    ]);

  }, [history]);

  // Handle scheduling action
  const handleSchedule = (dateTimeStr: string, type: ScheduledSession['type'], bonusXP: number, label: string, labelFr: string) => {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) {
      toast.show(
        isFr ? "Veuillez spécifier une date et heure valides." : "Please specify a valid date and time.",
        'error'
      );
      return;
    }

    if (d < new Date()) {
      toast.show(
        isFr ? "Impossible de programmer un créneau dans le passé." : "Cannot schedule a session in the past.",
        'error'
      );
      return;
    }

    // Limit to 4 active future sessions max
    if (scheduled.length >= 4) {
      toast.show(
        isFr ? "Limite de 4 sessions programmées atteinte. Terminez-en une ou supprimez un créneau existant." : "Limit of 4 scheduled sessions reached. Complete one or remove an existing slot.",
        'error'
      );
      return;
    }

    // Prevent duplicating the exact same time slot
    const isDuplicate = scheduled.some(item => {
      return new Date(item.dateTime).getTime() === d.getTime();
    });

    if (isDuplicate) {
      toast.show(
        isFr ? "Ce créneau horaire est déjà programmé dans votre agenda." : "This time slot is already scheduled in your agenda.",
        'warning'
      );
      return;
    }

    const newSession: ScheduledSession = {
      id: 'sch_' + Math.random().toString(36).substring(2, 9),
      dateTime: d.toISOString(),
      type,
      bonusXP,
      label,
      labelFr
    };

    setScheduled(prev => {
      const updated = [...prev, newSession];
      // Sort chronologically
      return updated.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    });

    toast.show(
      isFr 
        ? `Créneau bloqué avec succès ! +${bonusXP} XP d'engagement planifié.` 
        : `Slot locked successfully! +${bonusXP} XP scheduled engagement bonus.`,
      'success'
    );

    // Playconfetti
    try {
      window.dispatchEvent(new CustomEvent('shana_celebrate_confetti', { detail: { variant: 'full' } }));
    } catch {}

    // Reset forms
    setShowCustomForm(false);
    setCustomDate('');
    setCustomTime('');
  };

  const handleRemove = (id: string) => {
    setScheduled(prev => prev.filter(item => item.id !== id));
    toast.show(
      isFr ? "Session annulée avec succès." : "Scheduled session canceled successfully.",
      'success'
    );
  };

  // Google Calendar URL Generator
  const getGoogleCalendarUrl = (session: ScheduledSession) => {
    const sDate = new Date(session.dateTime);
    const eDate = new Date(sDate.getTime() + 45 * 60 * 1000); // 45 min duration

    const formatGCalDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };

    const title = isFr ? `Simulation d'Entretien Vocal SHANA - ${session.labelFr}` : `SHANA AI Verbal Simulation - ${session.label}`;
    const details = isFr 
      ? `Préparez-vous à votre simulation d'entretien vocal interactive SHANA.\n⚡ Bonus XP à gagner: +${session.bonusXP} XP.\n🎯 Objectif: Garder votre régularité active et améliorer votre clarté oratoire.\nRejoignez directement sur https://ai.studio/build`
      : `Get ready for your personalized SHANA AI verbal interview prep session.\n⚡ XP Bonus at stake: +${session.bonusXP} XP.\n🎯 Focus: Keep your daily streak and optimize your speaking pacing.\nJoin directly at https://ai.studio/build`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatGCalDate(sDate)}/${formatGCalDate(eDate)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent('SHANA AI Virtual Simulator')}`;
  };

  // Download ICS File
  const handleDownloadICS = (session: ScheduledSession) => {
    const sDate = new Date(session.dateTime);
    const eDate = new Date(sDate.getTime() + 45 * 60 * 1000);

    const formatIcsDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };

    const title = isFr ? `SHANA Prep - ${session.labelFr}` : `SHANA Prep - ${session.label}`;
    const details = isFr 
      ? `Simulation interactive vocale SHANA avec feedback IA personnalisé. +${session.bonusXP} XP de régularité.`
      : `SHANA interactive verbal simulation with real-time AI feedback. +${session.bonusXP} XP consistency booster.`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SHANA AI//NONSGML Calendar Event//EN',
      'BEGIN:VEVENT',
      `UID:shana_event_${session.id}`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(sDate)}`,
      `DTEND:${formatIcsDate(eDate)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${details}`,
      'LOCATION:SHANA Virtual Audio Cabin',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `shana_session_${session.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSyncedCount(prev => prev + 1);
    toast.show(
      isFr ? "Fichier d'intégration .ics généré ! Ouvrez-le pour synchroniser votre calendrier." : "Calendar .ics event generated! Open it to sync with Apple/Outlook.",
      'success'
    );
  };

  // Format countdown text
  const getCountdown = (dateTimeStr: string) => {
    const target = new Date(dateTimeStr);
    const diffMs = target.getTime() - now.getTime();
    if (diffMs <= 0) return isFr ? "Commence maintenant !" : "Start now!";

    const totalMin = Math.floor(diffMs / 60000);
    const min = totalMin % 60;
    const hours = Math.floor(totalMin / 60) % 24;
    const days = Math.floor(totalMin / 1440);

    if (days > 0) {
      return isFr 
        ? `Dans ${days}j ${hours}h` 
        : `In ${days}d ${hours}h`;
    }
    if (hours > 0) {
      return isFr 
        ? `Dans ${hours}h ${min}m` 
        : `In ${hours}h ${min}m`;
    }
    return isFr 
      ? `Dans ${min}m` 
      : `In ${min}m`;
  };

  // Gamified achievements stats
  const scheduledCount = scheduled.length;
  const isGoalUnlocked = scheduledCount >= 2;
  const isCalendarIntegrated = syncedCount >= 1;

  return (
    <div 
      id="calendar-scheduler-section"
      className="bg-white border-[2.5px] border-stone-950 rounded-[32px] p-6 sm:p-8 space-y-7.5 shadow-[5px_5px_0px_0px_#111111] hover:shadow-[7px_7px_0px_0px_#111111] transition-all relative overflow-hidden"
    >
      {/* Decorative Neo-Brutalist Grid lines */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none border-b border-l border-stone-950 bg-[radial-gradient(#111_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Title & Analytical Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b-2 border-stone-950">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#FFD3D0] border-2 border-stone-950 rounded-xl text-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-md sm:text-lg font-mono font-black uppercase tracking-tight text-stone-950">
              {isFr ? "Planificateur Régularité IA" : "AI Consistency Scheduler"}
            </h3>
            <p className="text-[10px] sm:text-xs font-semibold text-stone-500 mt-0.5">
              {isFr ? "Optimisation prédictive de vos sessions de parole" : "Data-driven calendar suggestions & gamified milestones"}
            </p>
          </div>
        </div>

        {/* Mini gamified indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F3F4F6] border-2 border-stone-950 rounded-xl text-[10px] font-mono font-extrabold text-stone-950">
          <Flame className="w-3.5 h-3.5 text-orange-500 animate-bounce" />
          <span>STREAK SAFEGUARD</span>
        </div>
      </div>

      {/* Consistency AI Insights Banner */}
      <div className="p-4 bg-[#EDF3FF] border-2 border-[#5363F1] rounded-2xl flex items-start gap-3 shadow-[2.5px_2.5px_0px_0px_#5363F1]">
        <Sparkles className="w-5 h-5 text-[#5363F1] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-[9px] font-mono font-black text-[#5363F1] uppercase tracking-wider block">
            {isFr ? "CONSEILS D'OPTIMISATION DE PAROLE" : "SPEECH FREQUENCY ENGINE"}
          </span>
          <p className="text-xs font-bold text-stone-900 leading-relaxed">
            {isFr ? trendMessage : trendMessageEn}
          </p>
        </div>
      </div>

      {/* THREE SUGGESTED OPTIMAL SLOTS */}
      <div className="space-y-4">
        <h4 className="text-xs font-mono font-black uppercase text-stone-600 tracking-wider">
          {isFr ? "🚀 CRÉNEAUX CONSEILLÉS POUR CETTE SEMAINE" : "🚀 RECOMMENDED TRAINING SLOTS FOR THIS WEEK"}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suggestedSlots.map((slot, index) => {
            const dateObj = new Date(slot.dateTime);
            const formattedDate = dateObj.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            });
            const formattedTime = dateObj.toLocaleTimeString(isFr ? 'fr-FR' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit'
            });

            // Color scheme based on type
            const isPower = slot.type === 'Power';
            const isSprint = slot.type === 'Sprint';
            const bgClass = isPower 
              ? 'bg-[#EEFDF4] border-[#10B981]' 
              : isSprint 
                ? 'bg-[#FFF9E6] border-[#F59E0B]' 
                : 'bg-[#FDF2F8] border-[#EC4899]';
            const badgeBg = isPower ? 'bg-emerald-500' : isSprint ? 'bg-amber-500' : 'bg-pink-500';

            return (
              <div 
                key={index} 
                className={`border-2 rounded-2xl p-4.5 flex flex-col justify-between space-y-4 transition-all shadow-[2.5px_2.5px_0px_0px_rgba(17,17,17,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] ${bgClass}`}
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className={`text-[9px] font-mono font-black uppercase text-white px-2 py-0.5 rounded-full ${badgeBg}`}>
                      {slot.type}
                    </span>
                    <span className="text-[10px] font-mono font-black text-stone-950 flex items-center gap-1 bg-white border border-stone-950 px-1.5 py-0.5 rounded-md">
                      ⚡ +{slot.bonusXP} XP
                    </span>
                  </div>
                  
                  <h5 className="font-extrabold text-sm text-stone-950 line-clamp-1 leading-tight mt-1">
                    {isFr ? slot.labelFr : slot.label}
                  </h5>

                  <div className="flex items-center gap-1.5 text-stone-700 pt-1">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs font-bold font-mono">
                      {formattedDate} @ {formattedTime}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleSchedule(slot.dateTime, slot.type, slot.bonusXP, slot.label, slot.labelFr)}
                  className="w-full py-2 bg-stone-950 hover:bg-stone-900 text-white font-mono font-black text-[10px] uppercase tracking-wider rounded-xl border-2 border-stone-950 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isFr ? "Bloquer" : "Lock In"}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ACTIVE SCHEDULED SESSIONS & COUNTDOWN */}
      <div className="space-y-4 border-t border-stone-100 pt-5">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-mono font-black uppercase text-stone-600 tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>{isFr ? "📅 SESSIONS SÉCURISÉES DANS VOTRE AGENDA" : "📅 LOCKED SESSIONS IN YOUR AGENDA"}</span>
          </h4>
          
          <button
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="text-[10px] font-mono font-black uppercase tracking-wider px-3 py-1.5 bg-white border-2 border-stone-950 rounded-xl hover:bg-stone-50 transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] cursor-pointer"
          >
            {showCustomForm ? (isFr ? "Masquer" : "Cancel") : (isFr ? "+ Créneau Perso" : "+ Custom Slot")}
          </button>
        </div>

        {/* CUSTOM SCHEDULING FORM */}
        <AnimatePresence>
          {showCustomForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#FAFAFA] border-2 border-stone-950 rounded-2xl p-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-black uppercase text-stone-500 block">
                    {isFr ? "Choisir une date" : "Select Date"}
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full bg-white border-2 border-stone-950 rounded-xl px-3 py-2 font-mono text-xs text-stone-950 focus:outline-none focus:ring-1 focus:ring-stone-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-black uppercase text-stone-500 block">
                    {isFr ? "Choisir l'heure" : "Select Time"}
                  </label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full bg-white border-2 border-stone-950 rounded-xl px-3 py-2 font-mono text-xs text-stone-950 focus:outline-none focus:ring-1 focus:ring-stone-500"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!customDate || !customTime) {
                      toast.show(isFr ? "Veuillez remplir tous les champs." : "Please fill in all inputs.", "error");
                      return;
                    }
                    handleSchedule(
                      `${customDate}T${customTime}`,
                      'Custom',
                      10,
                      'Custom Prep Slot',
                      'Créneau d\'Entraînement Libre'
                    );
                  }}
                  className="w-full py-2 bg-stone-950 hover:bg-stone-900 text-white font-mono font-black text-xs uppercase tracking-wider rounded-xl border-2 border-stone-950 transition-all cursor-pointer shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,0.1)] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  {isFr ? "Programmer" : "Schedule Now"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {scheduled.length === 0 ? (
          <div className="border-2 border-dashed border-stone-200 rounded-2xl py-8 text-center text-stone-400 text-xs font-semibold">
            {isFr 
              ? "Aucun entraînement planifié pour le moment. Choisissez un créneau conseillé pour gagner vos bonus XP !" 
              : "No practice sessions locked yet. Choose one of our recommended spots to safe lock your streak & claim XP bonuses!"}
          </div>
        ) : (
          <div className="space-y-3">
            {scheduled.map((item) => {
              const d = new Date(item.dateTime);
              const formattedDate = d.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              });
              const formattedTime = d.toLocaleTimeString(isFr ? 'fr-FR' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={item.id}
                  className="bg-white border-2 border-stone-950 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] transition-all"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      <h5 className="font-extrabold text-sm text-stone-950">
                        {isFr ? item.labelFr : item.label}
                      </h5>
                      <span className="text-[9px] font-mono font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        {getCountdown(item.dateTime)}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 font-semibold font-mono pl-4">
                      {formattedDate} @ {formattedTime}
                    </p>
                  </div>

                  {/* Calendar Connectors & Deletion */}
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pl-4 sm:pl-0">
                    {/* Google Calendar template redirect */}
                    <a
                      href={getGoogleCalendarUrl(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#5363F1] text-[#5363F1] rounded-xl text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      title={isFr ? "Ajouter à Google Agenda" : "Add to Google Calendar"}
                    >
                      <span>Google</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {/* Apple/Outlook/Standard ICS download */}
                    <button
                      onClick={() => handleDownloadICS(item)}
                      className="px-3 py-2 bg-stone-50 hover:bg-stone-100 border-2 border-stone-950 text-stone-950 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.ICS</span>
                    </button>

                    {/* Cancel button */}
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-2 border-2 border-transparent text-stone-400 hover:text-rose-600 hover:border-stone-950 rounded-xl transition-all"
                      title={isFr ? "Annuler le créneau" : "Cancel slot"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GAMIFIED PROGRESSION / OBJECTIVE MILESTONES (BENTO PROGRESS RAILS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-stone-100 pt-5">
        
        {/* Objective 1: Scheduler Active */}
        <div className="bg-[#FAF9F6] border-2 border-stone-950 rounded-2xl p-4 flex gap-3.5 relative overflow-hidden">
          <div className="p-2 bg-[#F59E0B]/10 rounded-xl border border-[#F59E0B]/20 text-[#F59E0B] h-fit shrink-0 mt-0.5">
            <Trophy className="w-4.5 h-4.5" />
          </div>
          
          <div className="space-y-2 flex-1">
            <div className="flex justify-between items-start">
              <h5 className="font-extrabold text-xs uppercase text-stone-900 tracking-wide">
                {isFr ? "🎯 OBJECTIF : SEMAINE PLANIFIÉE" : "🎯 OBJECTIVE: WEEKLY LOCK"}
              </h5>
              <span className="text-[10px] font-mono font-black text-stone-500">
                {Math.min(scheduledCount, 2)}/2
              </span>
            </div>

            <p className="text-[11px] text-stone-500 leading-normal font-semibold">
              {isFr 
                ? "Planifiez au moins 2 séances d'entraînement cette semaine pour sécuriser vos compétences." 
                : "Schedule at least 2 training sessions this week to safe-lock your speech consistency."}
            </p>

            {/* Retro progress rail */}
            <div className="h-3 w-full bg-stone-200/60 border border-stone-950 rounded-full overflow-hidden p-0.5 mt-2">
              <div 
                className="h-full bg-amber-500 rounded-full border border-stone-950 transition-all duration-500"
                style={{ width: `${Math.min((scheduledCount / 2) * 100, 100)}%` }}
              />
            </div>

            {isGoalUnlocked && (
              <div className="flex items-center gap-1.5 text-emerald-600 font-mono text-[10px] font-black uppercase pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Goal Met (+35 XP claimed)</span>
              </div>
            )}
          </div>
        </div>

        {/* Objective 2: Calendar Integration */}
        <div className="bg-[#FAF9F6] border-2 border-stone-950 rounded-2xl p-4 flex gap-3.5 relative overflow-hidden">
          <div className="p-2 bg-[#10B981]/10 rounded-xl border border-[#10B981]/20 text-[#10B981] h-fit shrink-0 mt-0.5">
            <PartyPopper className="w-4.5 h-4.5" />
          </div>
          
          <div className="space-y-2 flex-1">
            <div className="flex justify-between items-start">
              <h5 className="font-extrabold text-xs uppercase text-stone-900 tracking-wide">
                {isFr ? "🎯 INTÉGRATION AGENDAS" : "🎯 OBJECTIVE: DEVICE SYNC"}
              </h5>
              <span className="text-[10px] font-mono font-black text-stone-500">
                {isCalendarIntegrated ? "1/1" : "0/1"}
              </span>
            </div>

            <p className="text-[11px] text-stone-500 leading-normal font-semibold">
              {isFr 
                ? "Exportez un créneau vers votre calendrier (Google ou .ics) pour ne rater aucune session." 
                : "Export a booked slot to your real device calendar app (Google or .ics) to claim bonus coins."}
            </p>

            {/* Retro progress rail */}
            <div className="h-3 w-full bg-stone-200/60 border border-stone-950 rounded-full overflow-hidden p-0.5 mt-2">
              <div 
                className="h-full bg-emerald-500 rounded-full border border-stone-950 transition-all duration-500"
                style={{ width: `${isCalendarIntegrated ? 100 : 0}%` }}
              />
            </div>

            {isCalendarIntegrated && (
              <div className="flex items-center gap-1.5 text-emerald-600 font-mono text-[10px] font-black uppercase pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Synced (+50 Coins earned)</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
