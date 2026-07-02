export type MaintenanceMode = 'normal' | 'maintenance' | 'read-only';

export interface FeatureFlags {
  interviewEngine: boolean;
  mirrorRoom: boolean;
  trainingSystem: boolean;
  voiceMode: boolean;
  videoMode: boolean;
  assessmentPlan: boolean;
  adminDashboard: boolean;
  betaFeatures: boolean;
}

export type AIProvider = 'gemini' | 'openai' | 'mock';
export type ResponseMode = 'friendly' | 'neutral' | 'strict' | 'stress' | 'executive';
export type AIDifficulty = 'Junior' | 'Mid' | 'Senior' | 'Executive';

export interface AIConfiguration {
  enableAI: boolean;
  activeProvider: AIProvider;
  responseMode: ResponseMode;
  difficulty: AIDifficulty;
  timeout: number; // in seconds
}

export type LanguageAvailability = 'both' | 'french_only' | 'english_only';
export type DefaultLanguage = 'FR' | 'EN';
export type PausePolicy = 'allowed' | 'forbidden';

export interface InterviewConfiguration {
  maxDuration: number; // in minutes
  languageAvailability: LanguageAvailability;
  defaultLanguage: DefaultLanguage;
  questionCount: number;
  pausePolicy: PausePolicy;
  cameraRequired: boolean;
  microphoneRequired: boolean;
}

export interface ContentTexts {
  title: string;
  subtitle: string;
}

export interface ContentStateTexts {
  text: string;
}

export interface ContentMessages {
  welcome: string;
  closing: string;
}

export interface ContentButtons {
  start: string;
  cancel: string;
}

export interface PlatformContent {
  homeTexts: {
    FR: ContentTexts;
    EN: ContentTexts;
  };
  emptyStates: {
    FR: ContentStateTexts;
    EN: ContentStateTexts;
  };
  interviewMessages: {
    FR: ContentMessages;
    EN: ContentMessages;
  };
  buttonLabels: {
    FR: ContentButtons;
    EN: ContentButtons;
  };
  systemBanners: {
    FR: string;
    EN: string;
    enabled: boolean;
  };
}

export interface PlatformConfig {
  version: string;
  featureFlags: FeatureFlags;
  aiConfig: AIConfiguration;
  interviewConfig: InterviewConfiguration;
  content: PlatformContent;
  maintenanceMode: MaintenanceMode;
}

export interface ConfigHistoryEntry {
  id: string;
  timestamp: string;
  performedBy: {
    id: string;
    email: string;
    role: string;
  };
  description: string;
  before: PlatformConfig;
  after: PlatformConfig;
  canRollback: boolean;
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  version: '1.4.0-release',
  featureFlags: {
    interviewEngine: true,
    mirrorRoom: true,
    trainingSystem: true,
    voiceMode: true,
    videoMode: true,
    assessmentPlan: true,
    adminDashboard: true,
    betaFeatures: false,
  },
  aiConfig: {
    enableAI: true,
    activeProvider: 'gemini',
    responseMode: 'friendly',
    difficulty: 'Mid',
    timeout: 35,
  },
  interviewConfig: {
    maxDuration: 45,
    languageAvailability: 'both',
    defaultLanguage: 'FR',
    questionCount: 5,
    pausePolicy: 'allowed',
    cameraRequired: true,
    microphoneRequired: true,
  },
  content: {
    homeTexts: {
      FR: {
        title: 'Préparez vos entretiens avec l’IA de SHANA',
        subtitle: 'Une évaluation immersive en conditions réelles avec détection comportementale et vocale.',
      },
      EN: {
        title: 'Prepare for your interviews with SHANA AI',
        subtitle: 'An immersive real-condition evaluation with vocal and behavioral analytics.',
      }
    },
    emptyStates: {
      FR: {
        text: 'Aucun historique disponible pour le moment. Lancez votre premier entraînement !',
      },
      EN: {
        text: 'No history found. Launch your first training session to get started!',
      }
    },
    interviewMessages: {
      FR: {
        welcome: 'Bonjour, bienvenue dans votre espace d’évaluation SHANA. Commençons dès que vous êtes prêt.',
        closing: 'Nous avons terminé notre entretien. Merci pour vos réponses. Votre évaluation est en cours de traitement.',
      },
      EN: {
        welcome: 'Hello, welcome to your SHANA assessment session. Let us start whenever you are ready.',
        closing: 'We have finished our interview. Thank you for your responses. Your evaluation is being processed.',
      }
    },
    buttonLabels: {
      FR: {
        start: 'Commencer l’entretien',
        cancel: 'Annuler',
      },
      EN: {
        start: 'Start Interview',
        cancel: 'Cancel',
      }
    },
    systemBanners: {
      FR: 'Maintenance prévue ce dimanche à 22h.',
      EN: 'Scheduled maintenance this Sunday at 10 PM UTC.',
      enabled: false,
    }
  },
  maintenanceMode: 'normal'
};
