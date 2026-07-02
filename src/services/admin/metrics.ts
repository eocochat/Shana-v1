import { User } from '../../types';
import { StorageService } from '../../lib/storage';

export interface AdminNote {
  id: string;
  text: string;
  timestamp: string;
  author: string;
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  language: 'FR' | 'EN';
  mode: 'TRAIN' | 'ASSESSMENT';
  duration: string; // e.g., "12:15"
  progress: number; // 0 to 100
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  timeline: {
    phase: string;
    timestamp: string;
    completed: boolean;
  }[];
  currentPhase: string;
  started: string; // ISO date
  completedAt?: string | null;
  notes?: AdminNote[];
}

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  activeInterviews: number;
  completedInterviews: number;
  completionRate: number; // percentage
  averageDuration: string; // format "mm:ss"
  languageDistribution: {
    FR: number;
    EN: number;
  };
  dailyActivity: {
    date: string;
    usersCount: number;
    interviewsCount: number;
    completionCount: number;
  }[];
}

const SESSIONS_KEY = 'shana_admin_sessions';

export const StatsRepository = {
  getSessions(): InterviewSession[] {
    try {
      const saved = localStorage.getItem(SESSIONS_KEY);
      if (!saved) {
        const seeded = this.seedDefaultSessions();
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(seeded));
        return seeded;
      }
      const parsed = JSON.parse(saved) as InterviewSession[];
      // Keep running live simulation timer to show real updates
      let changed = false;
      const updated = parsed.map(sess => {
        if (sess.status === 'active' && sess.id === 'sess_active_1') {
          // Add 10 seconds to duration
          const parts = sess.duration.split(':');
          if (parts.length === 2) {
            let m = parseInt(parts[0], 10);
            let s = parseInt(parts[1], 10);
            s += 10;
            if (s >= 60) {
              m += 1;
              s -= 60;
            }
            sess.duration = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            if (sess.progress < 95) {
              sess.progress += 1;
            }
            changed = true;
          }
        }
        return sess;
      });
      if (changed) {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      return [];
    }
  },

  saveSessions(sessions: InterviewSession[]): void {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  },

  getSessionById(id: string): InterviewSession | null {
    return this.getSessions().find(s => s.id === id) || null;
  },

  saveSession(session: InterviewSession): void {
    const sessions = this.getSessions();
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx !== -1) {
      sessions[idx] = session;
    } else {
      sessions.unshift(session);
    }
    this.saveSessions(sessions);
    
    // Also dispatch event for live listeners
    try {
      window.dispatchEvent(new Event('shana_sessions_updated'));
    } catch (e) {}
  },

  addNoteToUserOrSession(sessionId: string, text: string, author: string): void {
    const sessions = this.getSessions();
    const sess = sessions.find(s => s.id === sessionId);
    if (sess) {
      if (!sess.notes) sess.notes = [];
      sess.notes.push({
        id: 'note_' + Math.random().toString(36).substring(2, 11),
        text,
        timestamp: new Date().toISOString(),
        author
      });
      this.saveSession(sess);
    }
  },

  seedDefaultSessions(): InterviewSession[] {
    const now = new Date();
    return [
      {
        id: 'sess_active_1',
        candidateId: 'usr_candidate',
        candidateName: 'Jean Candidat',
        candidateEmail: 'candidate@shana.com',
        language: 'FR',
        mode: 'TRAIN',
        duration: '08:42',
        progress: 60,
        status: 'active',
        currentPhase: 'Questions Techniques',
        started: new Date(now.getTime() - 9 * 60 * 1000).toISOString(),
        timeline: [
          { phase: 'Présentation', timestamp: new Date(now.getTime() - 9 * 60 * 1000).toISOString(), completed: true },
          { phase: 'Expérience passée', timestamp: new Date(now.getTime() - 6 * 60 * 1000).toISOString(), completed: true },
          { phase: 'Questions Techniques', timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(), completed: false },
          { phase: 'Clôture & Feedback', timestamp: '', completed: false }
        ],
        notes: [
          { id: 'n_seed_1', text: 'Excellente introduction, très structurée.', timestamp: new Date(now.getTime() - 8 * 60 * 1000).toISOString(), author: 'Alice Admin' }
        ]
      },
      {
        id: 'sess_paused_1',
        candidateId: 'usr_disabled',
        candidateName: 'René Désactivé',
        candidateEmail: 'disabled@shana.com',
        language: 'FR',
        mode: 'ASSESSMENT',
        duration: '05:15',
        progress: 40,
        status: 'paused',
        currentPhase: 'System Design',
        started: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        timeline: [
          { phase: 'Icebreaker', timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), completed: true },
          { phase: 'System Design', timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(), completed: false },
          { phase: 'Coding Exercise', timestamp: '', completed: false },
          { phase: 'Wrap-up', timestamp: '', completed: false }
        ],
        notes: []
      },
      {
        id: 'sess_comp_1',
        candidateId: 'usr_candidate',
        candidateName: 'Jean Candidat',
        candidateEmail: 'candidate@shana.com',
        language: 'FR',
        mode: 'ASSESSMENT',
        duration: '15:20',
        progress: 100,
        status: 'completed',
        currentPhase: 'Completed',
        started: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000 - 45 * 60 * 1000).toISOString(),
        timeline: [
          { phase: 'Icebreaker', timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), completed: true },
          { phase: 'Architecture', timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000 - 45 * 60 * 1000).toISOString(), completed: true },
          { phase: 'Coding', timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000 - 45 * 60 * 1000).toISOString(), completed: true },
          { phase: 'Wrap-up', timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000 - 45 * 60 * 1000).toISOString(), completed: true }
        ],
        notes: [
          { id: 'n_seed_2', text: 'Score global de 84%. Recommandation embauche solide.', timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), author: 'Marc Super' }
        ]
      },
      {
        id: 'sess_canc_1',
        candidateId: 'usr_disabled',
        candidateName: 'Marie Curie',
        candidateEmail: 'marie.curie@radium.fr',
        language: 'EN',
        mode: 'TRAIN',
        duration: '02:10',
        progress: 25,
        status: 'cancelled',
        currentPhase: 'Introduction',
        started: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        timeline: [
          { phase: 'Introduction', timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), completed: true },
          { phase: 'Deep Dive', timestamp: '', completed: false }
        ],
        notes: [
          { id: 'n_seed_3', text: 'Microphone disconnect, candidate cancelled manually.', timestamp: new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString(), author: 'System' }
        ]
      }
    ];
  }
};

export const MetricsService = {
  getRawStats() {
    const users = StorageService.getUsers();
    const sessions = StatsRepository.getSessions();
    const profiles = StorageService.getProfiles();

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'enabled').length;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsers = users.filter(u => new Date(u.createdAt) >= sevenDaysAgo).length;

    const activeInterviews = sessions.filter(s => s.status === 'active').length;
    const completedInterviews = sessions.filter(s => s.status === 'completed').length;

    const totalConducted = sessions.length;
    const completionRate = totalConducted > 0 
      ? Math.round((completedInterviews / totalConducted) * 100) 
      : 100;

    let totalSecs = 0;
    let counts = 0;
    sessions.forEach(s => {
      const parts = s.duration.split(':');
      if (parts.length === 2) {
        const m = parseInt(parts[0], 10);
        const sVal = parseInt(parts[1], 10);
        totalSecs += (m * 60 + sVal);
        counts++;
      }
    });
    const avgSecs = counts > 0 ? Math.round(totalSecs / counts) : 0;
    const avgM = Math.floor(avgSecs / 60);
    const avgS = avgSecs % 60;
    const averageDuration = `${avgM.toString().padStart(2, '0')}:${avgS.toString().padStart(2, '0')}`;

    let FR = 0;
    let EN = 0;
    profiles.forEach(p => {
      if (p.language === 'French') {
        FR++;
      } else {
        EN++;
      }
    });
    if (FR === 0 && EN === 0) {
      FR = 3;
      EN = 1;
    }

    const dailyActivity = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      
      const userSeedOffset = [3, 2, 4, 1, 2];
      const interviewSeedOffset = [2, 3, 1, 4, 3];
      const completedSeedOffset = [1, 2, 1, 3, 2];
      
      dailyActivity.push({
        date: dateStr,
        usersCount: Math.max(1, users.length - userSeedOffset[i]),
        interviewsCount: Math.max(1, sessions.length - interviewSeedOffset[i]),
        completionCount: Math.max(1, completedInterviews - completedSeedOffset[i])
      });
    }

    return {
      totalUsers,
      activeUsers,
      newUsers,
      activeInterviews,
      completedInterviews,
      completionRate,
      averageDuration,
      languageDistribution: { FR, EN },
      dailyActivity
    };
  }
};

export const DashboardAggregator = {
  getDashboardData(): DashboardMetrics {
    return MetricsService.getRawStats();
  }
};

export const LiveSessionTracker = {
  startSession(user: any, profile: any, mode: 'TRAIN' | 'ASSESSMENT'): string {
    const sessionId = 'sess_' + Math.random().toString(36).substring(2, 11);
    const session: InterviewSession = {
      id: sessionId,
      candidateId: user.id,
      candidateName: `${user.firstName} ${user.lastName}`.trim(),
      candidateEmail: user.email,
      language: profile.language === 'French' ? 'FR' : 'EN',
      mode,
      duration: '00:00',
      progress: 5,
      status: 'active',
      currentPhase: mode === 'TRAIN' ? 'Introduction' : 'Icebreaker',
      started: new Date().toISOString(),
      timeline: [
        { phase: mode === 'TRAIN' ? 'Introduction' : 'Icebreaker', timestamp: new Date().toISOString(), completed: false },
        { phase: mode === 'TRAIN' ? 'Questions Techniques' : 'Architecture', timestamp: '', completed: false },
        { phase: mode === 'TRAIN' ? 'Clôture & Feedback' : 'Coding', timestamp: '', completed: false }
      ],
      notes: []
    };
    StatsRepository.saveSession(session);
    return sessionId;
  },

  updateSessionProgress(sessionId: string, seconds: number, currentPhase?: string, progress?: number): void {
    const sessions = StatsRepository.getSessions();
    const sess = sessions.find(s => s.id === sessionId);
    if (sess) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      sess.duration = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      if (currentPhase) {
        sess.currentPhase = currentPhase;
        const phaseIndex = sess.timeline.findIndex(t => t.phase === currentPhase);
        if (phaseIndex !== -1) {
          for (let i = 0; i < phaseIndex; i++) {
            sess.timeline[i].completed = true;
            if (!sess.timeline[i].timestamp) {
              sess.timeline[i].timestamp = new Date().toISOString();
            }
          }
        }
      }
      if (progress !== undefined) {
        sess.progress = progress;
      } else {
        sess.progress = Math.min(95, sess.progress + 1);
      }
      StatsRepository.saveSession(sess);
    }
  },

  completeSession(sessionId: string, status: 'completed' | 'cancelled' = 'completed'): void {
    const sessions = StatsRepository.getSessions();
    const sess = sessions.find(s => s.id === sessionId);
    if (sess) {
      sess.status = status;
      sess.progress = status === 'completed' ? 100 : sess.progress;
      sess.completedAt = new Date().toISOString();
      sess.timeline.forEach(t => {
        if (status === 'completed') {
          t.completed = true;
          if (!t.timestamp) t.timestamp = new Date().toISOString();
        }
      });
      StatsRepository.saveSession(sess);
    }
  }
};
