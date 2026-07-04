import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, CheckCircle, Info, X, Award, Flame, Star } from 'lucide-react';
import { StorageService } from '../lib/storage';

export type ToastType = 'success' | 'info' | 'milestone' | 'warning';

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  show: (message: string, type?: ToastType | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function useMilestoneTracker(userId: string | null) {
  const { addToast } = useToast();

  const checkMilestones = useCallback((options?: { score?: number; isDownload?: boolean; isNewSession?: boolean }) => {
    if (!userId) return;

    const milestoneKey = `shana_unlocked_milestones_${userId}`;
    let unlocked: string[] = [];
    try {
      const saved = localStorage.getItem(milestoneKey);
      if (saved) unlocked = JSON.parse(saved);
    } catch (e) {
      console.warn('Error load milestones:', e);
    }

    const isFr = StorageService.getProfile(userId)?.language === 'French';

    const unlock = (id: string, frTitle: string, frDesc: string, enTitle: string, enDesc: string) => {
      if (unlocked.includes(id)) return;
      unlocked.push(id);
      localStorage.setItem(milestoneKey, JSON.stringify(unlocked));
      
      addToast({
        title: isFr ? frTitle : enTitle,
        description: isFr ? frDesc : enDesc,
        type: 'milestone',
        duration: 8000,
      });
    };

    // 1. Fetch practice sessions
    const baseHistory = StorageService.getHistory(userId) || [];
    let voiceSessionsCount = 0;
    try {
      const saved = localStorage.getItem(`shana_voice_sessions_${userId}`);
      if (saved) {
        voiceSessionsCount = JSON.parse(saved).length;
      }
    } catch (e) {}

    const totalSessions = baseHistory.length + voiceSessionsCount;

    // First Practice Completed Milestone
    if (totalSessions >= 1) {
      unlock(
        'first_session',
        '🏆 Premier Pas Franchi !',
        'Vous avez terminé votre premier entraînement vocal avec SHANA. Votre parcours d\'excellence commence !',
        '🏆 First Steps Taken!',
        'You have completed your very first practice session with SHANA. Your journey to eloquence begins!'
      );
    }

    // Five Practice Sessions Completed Milestone
    if (totalSessions >= 5) {
      unlock(
        'five_sessions',
        '🔥 Légende de l\'Entraînement !',
        'Incroyable ! Vous avez complété 5 sessions d\'entraînement. Votre aisance verbale se perfectionne !',
        '🔥 Practice Master!',
        'Incredible! You have completed 5 practice sessions. Your communication chemistry is getting sharper!'
      );
    }

    // High Confidence Score Milestone (85%+)
    if (options?.score && options.score >= 85) {
      unlock(
        'high_confidence',
        '⭐ Étoile de l\'Élocution !',
        `Performance hors pair avec un score de ${options.score}% ! Clarté, ton et rythme d'expert.`,
        '⭐ Speech Masterclass!',
        `Outstanding voice confidence level of ${options.score}%! Your delivery was super clear, impactful, and professional.`
      );
    } else {
      // Check if any existing history item was high score
      const hasHighScore = baseHistory.some(s => s.score >= 85);
      if (hasHighScore) {
        unlock(
          'high_confidence',
          '⭐ Étoile de l\'Élocution !',
          'Performance vocale hors pair enregistrée ! Votre clarté et assurance sont excellentes.',
          '⭐ Speech Masterclass!',
          'Outstanding confidence score recorded! Your articulation and vocal flow are top tier.'
        );
      }
    }

    // PDF Download Milestone
    if (options?.isDownload) {
      unlock(
        'pdf_report_archived',
        '📄 Rapport Exporté',
        'Votre rapport complet de compétences vocales a été compilé et téléchargé au format PDF.',
        '📄 Report Archived',
        'Your comprehensive vocal competencies report has been compiled and downloaded as a PDF.'
      );
    }
  }, [userId, addToast]);

  // Run automatically when the hook loads or userId changes
  useEffect(() => {
    if (userId) {
      // Small timeout to not bombard the user right at initial load
      const timer = setTimeout(() => {
        checkMilestones();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [userId, checkMilestones]);

  return { checkMilestones };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast_' + Math.random().toString(36).substring(3, 11);
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration || 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const show = useCallback((message: string, type?: ToastType | 'error') => {
    let resolvedType: ToastType = 'info';
    if (type === 'error') resolvedType = 'warning';
    else if (type) resolvedType = type as ToastType;

    addToast({
      title: resolvedType === 'warning' ? 'Alert' : resolvedType === 'success' ? 'Success' : 'Notification',
      description: message,
      type: resolvedType,
    });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, show }}>
      {children}
      <div id="shana-toast-portal" className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-[380px] pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              layout
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className="pointer-events-auto"
            >
              <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const { title, description, type, duration = 5000 } = toast;

  // Let's style each type of toast elegantly
  const getStyle = () => {
    switch (type) {
      case 'milestone':
        return {
          bg: 'bg-[#1A2B3C] border border-slate-700 shadow-[0_10px_30px_rgba(26,43,60,0.25)]',
          titleColor: 'text-[#F3F4F6]',
          descColor: 'text-[#9CA3AF]',
          icon: <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />,
          accentBar: 'bg-gradient-to-r from-amber-400 to-[#10B981]'
        };
      case 'success':
        return {
          bg: 'bg-white border border-[#E5E7EB] shadow-[0_10px_25px_rgba(0,0,0,0.05)]',
          titleColor: 'text-[#1F2937]',
          descColor: 'text-[#4B5563]',
          icon: <CheckCircle className="w-5 h-5 text-[#10B981]" />,
          accentBar: 'bg-[#10B981]'
        };
      case 'warning':
        return {
          bg: 'bg-white border border-rose-150 shadow-[0_10px_25px_rgba(220,38,38,0.05)]',
          titleColor: 'text-[#1F2937]',
          descColor: 'text-[#4B5563]',
          icon: <Award className="w-5 h-5 text-rose-500" />,
          accentBar: 'bg-rose-500'
        };
      case 'info':
      default:
        return {
          bg: 'bg-white border border-[#E5E7EB] shadow-[0_10px_25px_rgba(0,0,0,0.05)]',
          titleColor: 'text-[#1F2937]',
          descColor: 'text-[#4B5563]',
          icon: <Info className="w-5 h-5 text-indigo-500" />,
          accentBar: 'bg-indigo-500'
        };
    }
  };

  const style = getStyle();

  return (
    <div id={`toast-item-${toast.id}`} className={`relative overflow-hidden w-full rounded-2xl flex p-4 gap-3 ${style.bg}`}>
      
      {/* Accent strip */}
      <span className={`absolute top-0 left-0 w-1.5 h-full ${style.accentBar}`} />

      {/* Toast Content Area */}
      <div className="pl-1 flex-1 flex gap-3 text-left">
        <div className="mt-0.5 flex-shrink-0">
          {style.icon}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-start">
            <h4 className={`text-xs font-black tracking-wide uppercase font-sans ${style.titleColor}`}>
              {title}
            </h4>
            <button
              onClick={onClose}
              className={`p-0.5 rounded-lg transition-colors cursor-pointer ${
                type === 'milestone' 
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className={`text-[10.5px] font-semibold leading-relaxed ${style.descColor}`}>
            {description}
          </p>
        </div>
      </div>

      {/* Countdown timer visual bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-0.5 ${style.accentBar}`}
      />

    </div>
  );
}
