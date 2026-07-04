export type Language = 'FR' | 'EN';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  role?: 'candidate' | 'admin' | 'super_admin';
  status?: 'enabled' | 'disabled';
}

export interface CVAnalysis {
  userId: string;
  role: string;
  industry: string;
  experienceYears: string | number;
  skills: string[];
  summary: string;
  strengths: string[];
  risks: string[];
  createdAt: string;
}

export interface InterviewBlueprint {
  userId: string;
  behavioralWeight: number; // e.g. 40
  roleWeight: number;       // e.g. 30
  industryWeight: number;   // e.g. 20
  resumeWeight: number;     // e.g. 10
  primaryFocus: string;
  secondaryFocus: string;
  difficulty: 'Junior' | 'Mid' | 'Senior' | 'Executive' | string;
  recommendedSessions: number;
  createdAt: string;
}

export interface Profile {
  userId: string;
  targetRole: string;
  experienceYears: string | number;
  industry: string;
  language: 'French' | 'English';
  onboardingCompleted: boolean;
  avatarUrl?: string;
}

export type ActiveTab = 'home' | 'train' | 'assessment' | 'history' | 'profile' | 'admin' | 'purchase' | 'discoveries' | 'candidate-brain';

export interface QuestionFeedbackItem {
  phaseLabel: string;
  questionText: string;
  score: number;
  pace: string; // e.g. "135 WPM"
  paceRating: 'optimal' | 'rushed' | 'slow' | string;
  clarity: number; // e.g. 88
  keyPositive: string;
  improvementTip: string;
  difficulty?: string;
  isTrickQuestion?: boolean;
  contextAware?: boolean;
}

export interface SessionHistoryItem {
  id: string;
  type: 'TRAIN' | 'ASSESS';
  date: string;
  score: number;
  weakness: string;
  recommendation: string;
  language: Language;
  
  // Specific Fields for Evaluation Protocols (Assess mode)
  blueprintId?: string;
  duration?: string;
  resumeScore?: number;
  industryScore?: number;
  communicationScore?: number;
  adaptabilityScore?: number;
  confidenceScore?: number;
  behavioralScore?: number;
  strengths?: string[];
  questionsFeedback?: QuestionFeedbackItem[];
  createdAt?: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  targetRole: string;
  industry: string;
  experienceLevel: 'junior' | 'mid' | 'senior' | 'executive';
  avatarUrl?: string;
  role?: 'candidate' | 'admin' | 'super_admin';
  status?: 'enabled' | 'disabled';
}

export interface AppState {
  lang: Language;
  user: UserProfile | null;
  onboarded: boolean;
  activeTab: ActiveTab;
}

export interface UserPreferences {
  userId: string;
  language: 'FR' | 'EN';
  cookieConsent: {
    essential: boolean;
    preferences: boolean;
  };
  preferencesEnabled: boolean;
  updatedAt: string;
}

