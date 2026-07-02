import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  AlertCircle, 
  Check, 
  ChevronRight, 
  ArrowLeft, 
  RefreshCw, 
  Lock, 
  Activity, 
  TrendingUp, 
  Award,
  AlertTriangle,
  Lightbulb,
  PieChart as PieIcon,
  Layers,
  Clock,
  Gauge,
  Trash2,
  History,
  Download,
  RotateCcw
} from 'lucide-react';
import { CVAnalysis, InterviewBlueprint, User } from '../types';
import { StorageService } from '../lib/storage';

interface CVPrepareFlowProps {
  currentUser: User;
  onBackToHome: () => void;
  onComplete: (analysis: CVAnalysis, blueprint: InterviewBlueprint) => void;
}

export default function CVPrepareFlow({ currentUser, onBackToHome, onComplete }: CVPrepareFlowProps) {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'blueprint'>(() => {
    const hasAna = !!StorageService.getAnalysis(currentUser.id);
    const hasBp = !!StorageService.getBlueprint(currentUser.id);
    return (hasAna && hasBp) ? 'blueprint' : 'upload';
  });
  const [isPasting, setIsPasting] = useState(false);
  const [pastedText, setPastedText] = useState('');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [base64File, setBase64File] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  
  // Real-time analysis status (staggered states)
  const profile = StorageService.getSession()?.profile;
  const isFrench = profile?.language === 'French';

  const loadingStates = isFrench ? [
    "Lecture de l'expérience et de la trajectoire professionnelle...",
    "Extraction des compétences et capacités clés...",
    "Identification des réalisations et étapes marquantes...",
    "Mise en valeur des points forts et des indicateurs de croissance...",
    "Détection des risques du CV et des lacunes structurelles...",
    "Équilibrage de vos axes d'entretien personnalisés...",
    "Compilation des coefficients finaux du plan de préparation..."
  ] : [
    "Reading experience and career trajectory...",
    "Extracting critical skills and capabilities...",
    "Identifying achievements and key milestones...",
    "Highlighting structured strengths and growth indicators...",
    "Detecting resume risks and structural gaps...",
    "Calibrating your customized interview areas...",
    "Compiling final interview blueprint weightings..."
  ];

  const cvTranslations = {
    EN: {
      homeDashboard: "Home Dashboard",
      curriculumIngestion: "CURRICULUM INGESTION",
      uploadTitle: "Upload your CV",
      uploadDesc: "SHANA will personalize your preparation. Upload your CV or paste its textual content to calibrate a highly tailored voice training roadmap.",
      executionError: "Execution Error",
      selectDoc: "Select Document",
      formatsDesc: "Supported formats: PDF, DOCX, TXT. Max 5MB",
      chooseFile: "Choose File",
      pasteInstead: "Paste Text Instead",
      specLocked: "Spec Locked",
      pasteTitle: "Paste Resume Text Content",
      returnToUpload: "Return to File Upload",
      pastePlaceholder: "Paste your CV content here directly...",
      analyzeBtn: "Analyze Experience",
      analyzingTitle: "Analyzing your experience",
      preparingDesc: "Preparing your interview blueprint",
      secureMappingDesc: "SHANA is securely mapping core technical nodes and experience matrices. This procedure compiles specific voice simulation weights based on industry difficulty.",
      blueprintCalibrated: "BLUEPRINT CALIBRATED",
      planReady: "Your interview plan is ready",
      adaptedDesc: "Preparation weights have adapted based on your experience metrics and career level.",
      difficultyRank: "DIFFICULTY RANK",
      recommended: "RECOMMENDED",
      sessionsSuffix: "Sessions",
      extractedBlueprint: "Extracted Career Blueprint",
      targetRole: "TARGET ROLE",
      industryDomain: "INDUSTRY DOMAIN",
      careerSummary: "CAREER SUMMARY",
      demonstratedSkills: "DEMONSTRATED SKILLS",
      calibrationFocus: "Calibration Focus Parameters",
      primaryFocus: "Primary Focus",
      secondaryFocus: "Secondary Focus",
      interviewAreaBalance: "Interview Area Balance Weightings",
      behavioral: "Behavioral",
      roleSpecific: "Role Specific",
      industryFocus: "Industry Focus",
      resumeDeepDive: "Resume Deep Dive",
      coreStrengths: "Core Strengths",
      potentialRisks: "Potential Risks",
      regenerateBtn: "Regenerate Blueprint",
      changeCvBtn: "Change / Upload New CV",
      continueBtn: "Continue"
    },
    FR: {
      homeDashboard: "Tableau de bord",
      curriculumIngestion: "ANALYSE DE COMPÉTENCES",
      uploadTitle: "Télécharger votre CV",
      uploadDesc: "SHANA va personnaliser votre préparation. Téléchargez votre CV ou collez son contenu textuel pour calibrer votre plan d'entraînement vocal.",
      executionError: "Erreur d'Exécution",
      selectDoc: "Sélectionner le Document",
      formatsDesc: "Formats acceptés : PDF, DOCX, TXT. Max 5Mo",
      chooseFile: "Choisir un fichier",
      pasteInstead: "Coller du texte à la place",
      specLocked: "Vérifié",
      pasteTitle: "Coller le contenu de mon CV",
      returnToUpload: "Retour au chargement de fichier",
      pastePlaceholder: "Collez le contenu de votre CV directement ici...",
      analyzeBtn: "Analyser le parcours",
      analyzingTitle: "Analyse de votre parcours",
      preparingDesc: "Préparation de votre plan d'entretien",
      secureMappingDesc: "SHANA cartographie vos compétences clés et votre parcours. Cette procédure génère des coefficients de simulation vocale spécifiques basés sur la difficulté du secteur.",
      blueprintCalibrated: "PLAN D'ENTRETIEN CALIBRÉ",
      planReady: "Votre plan d'entretien est prêt",
      adaptedDesc: "Les coefficients de préparation ont été calculés en fonction de votre parcours et de votre niveau de carrière.",
      difficultyRank: "NIVEAU DE DIFFICULTÉ",
      recommended: "RECOMMANDATION",
      sessionsSuffix: "Sessions",
      extractedBlueprint: "Profil Professionnel Extrait",
      targetRole: "POSTE VISÉ",
      industryDomain: "SECTEUR D'ACTIVITÉ",
      careerSummary: "RÉSUMÉ DU PROFIL",
      demonstratedSkills: "COMPÉTENCES CLÉS",
      calibrationFocus: "Axes Clés d'Entretien Calibrés",
      primaryFocus: "Axe Principal",
      secondaryFocus: "Axe Secondaire",
      interviewAreaBalance: "Distribution des Coefficients de l'Entretien",
      behavioral: "Comportemental",
      roleSpecific: "Spécifique au Poste",
      industryFocus: "Domaine d'Activité",
      resumeDeepDive: "Analyse du Parcours",
      coreStrengths: "Points Forts Clés",
      potentialRisks: "Zones d'Attention",
      regenerateBtn: "Recalibrer le Plan",
      changeCvBtn: "Changer / Téléverser un nouveau CV",
      continueBtn: "Continuer"
    }
  };

  const t = isFrench ? cvTranslations.FR : cvTranslations.EN;

  const [loadingStateIndex, setLoadingStateIndex] = useState(0);

  // Output data results
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(() => StorageService.getAnalysis(currentUser.id));
  const [blueprint, setBlueprint] = useState<InterviewBlueprint | null>(() => StorageService.getBlueprint(currentUser.id));
  const [apiError, setApiError] = useState<string | null>(null);

  // Document version control & pipeline state logs
  const [versions, setVersions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Map backend NormalizedCvData format to UI data models
  const mapCvVersionToAnalysisAndBlueprint = (version: any, userId: string) => {
    const parsedData = version.parsedOutput || {};
    
    const experiences = parsedData.workExperience || [];
    const primaryRole = experiences[0]?.role || parsedData.personalInformation?.fullName || "Software Engineer";
    
    // Extract all achievements across work experiences
    const extractedAchievements: string[] = [];
    experiences.forEach((exp: any) => {
      if (exp.achievements && Array.isArray(exp.achievements)) {
        extractedAchievements.push(...exp.achievements);
      }
    });

    const skillsList = parsedData.technicalSkills || ["Engineering"];

    const cvAnalysis: CVAnalysis = {
      userId: userId,
      role: primaryRole,
      industry: parsedData.industry || "Technology",
      experienceYears: String(experiences.length || 3),
      skills: skillsList.length > 0 ? skillsList : ["Software Engineering"],
      summary: parsedData.summary || `Extracted profile for ${parsedData.personalInformation?.fullName || 'Candidate'}.`,
      strengths: extractedAchievements.length > 0 ? extractedAchievements.slice(0, 3) : ["Strong individual contributor with proven technical capabilities."],
      risks: ["Resume quantification can be further expanded."],
      createdAt: new Date().toISOString()
    };

    const interviewBlueprint: InterviewBlueprint = {
      userId: userId,
      behavioralWeight: 35,
      roleWeight: 35,
      industryWeight: 20,
      resumeWeight: 10,
      primaryFocus: "Core Technical Competency",
      secondaryFocus: "STAR Method Mastery",
      difficulty: experiences.length > 8 ? "Senior" : experiences.length > 5 ? "Mid" : "Junior",
      recommendedSessions: experiences.length > 5 ? 8 : 6,
      createdAt: new Date().toISOString()
    };

    return { cvAnalysis, interviewBlueprint };
  };

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch('/api/v1/cv/versions', {
        headers: { 'Authorization': `Bearer ${currentUser.id}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.data || data || [];
        setVersions(list);
      }
      
      const resEvents = await fetch('/api/v1/cv/events', {
        headers: { 'Authorization': `Bearer ${currentUser.id}` }
      });
      if (resEvents.ok) {
        const dataEvents = await resEvents.json();
        const eventList = dataEvents.data || dataEvents || [];
        setEvents(eventList);
      }
    } catch (e) {
      console.error("Failed to load CV versions/events:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      loadHistory();
    }
  }, [currentUser]);

  // Auto-advance loading states during 'analyzing' step
  useEffect(() => {
    if (step !== 'analyzing') return;

    const interval = setInterval(() => {
      setLoadingStateIndex((prev) => {
        if (prev < loadingStates.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [step]);

  // Handle manual file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'pdf' && fileExt !== 'docx' && fileExt !== 'txt') {
      setFileError('Supported specifications direct: Please choose a valid PDF, DOCX, or TXT document.');
      return;
    }

    setSelectedFile(file);
    setIsPasting(false);
    setBase64File(null);
    setPastedText('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        if (fileExt === 'txt') {
          setPastedText(result);
        } else {
          // Extract the pure base64 database string
          const split = result.split(',');
          const base64Data = split[1];
          const mimeType = file.type || (fileExt === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
          if (base64Data) {
            setBase64File({
              data: base64Data,
              mimeType,
              name: file.name
            });
          }
        }
      }
    };

    if (fileExt === 'txt') {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  // Trigger Backend Analysis
  const triggerAnalysis = async (
    inputText: string | null,
    inputFile: { data: string; mimeType: string; name: string } | null
  ) => {
    setApiError(null);
    setStep('analyzing');
    setLoadingStateIndex(0);

    try {
      const payloadText = inputFile ? inputFile.data : (inputText || "");
      const payloadName = inputFile ? inputFile.name : "pasted_text_resume.txt";
      const payloadMime = inputFile ? inputFile.mimeType : "text/plain";
      const payloadSize = payloadText.length;

      // 1. Submit CV to the secure storage and text extraction pipeline
      const uploadResponse = await fetch('/api/v1/cv/upload', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          text: payloadText,
          name: payloadName,
          mimeType: payloadMime,
          size: payloadMime.includes("text") ? payloadText.length : payloadSize
        })
      });

      if (!uploadResponse.ok) {
        const errJson = await uploadResponse.json();
        throw new Error(errJson.message || errJson.error || "Upload pipeline initialization failed.");
      }

      const uploadResult = await uploadResponse.json();
      const initialVersion = uploadResult.data || uploadResult;
      const cvId = initialVersion.id;

      // 2. Poll the server for parsing events and status updates in real-time!
      let parsedVersion: any = null;
      const startTime = Date.now();
      const timeoutMs = 45000; // 45 seconds max polling
      
      while (Date.now() - startTime < timeoutMs) {
        // Fetch events to keep the ticker updated!
        try {
          const resEvents = await fetch('/api/v1/cv/events', {
            headers: { 'Authorization': `Bearer ${currentUser.id}` }
          });
          if (resEvents.ok) {
            const dataEvents = await resEvents.json();
            const eventList = dataEvents.data || dataEvents || [];
            setEvents(eventList);
          }
        } catch (e) {}

        // Fetch versions to see if status has changed!
        const versionsRes = await fetch('/api/v1/cv/versions', {
          headers: { 'Authorization': `Bearer ${currentUser.id}` }
        });
        if (versionsRes.ok) {
          const versionsData = await versionsRes.json();
          const list = versionsData.data || versionsData || [];
          setVersions(list);
          
          const current = list.find((v: any) => v.id === cvId);
          if (current) {
            if (current.status === 'parsed') {
              parsedVersion = current;
              break;
            } else if (current.status === 'failed') {
              throw new Error(current.errorLog || "Asynchronous document parsing pipeline failed.");
            }
          }
        }

        // Wait 1.5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      if (!parsedVersion) {
        throw new Error("Processing timed out. The pipeline is running in the background, please check version history below.");
      }

      // Map parsed output to native state models
      const mapped = mapCvVersionToAnalysisAndBlueprint(parsedVersion, currentUser.id);

      // Persist in local storage for navigation & caching
      StorageService.saveAnalysis(mapped.cvAnalysis);
      StorageService.saveBlueprint(mapped.interviewBlueprint);

      setAnalysis(mapped.cvAnalysis);
      setBlueprint(mapped.interviewBlueprint);

      // Transition to blueprint page
      setTimeout(() => {
        setStep('blueprint');
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'Document processing pipeline encountered a validation or parsing fault.');
      setStep('upload');
      await loadHistory();
    }
  };

  const handleRollback = async (versionId: string) => {
    try {
      setIsRollingBack(true);
      const res = await fetch('/api/v1/cv/rollback', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ versionId })
      });
      if (res.ok) {
        const responseData = await res.json();
        const activeVersion = responseData.data || responseData;
        const mapped = mapCvVersionToAnalysisAndBlueprint(activeVersion, currentUser.id);
        
        StorageService.saveAnalysis(mapped.cvAnalysis);
        StorageService.saveBlueprint(mapped.interviewBlueprint);
        setAnalysis(mapped.cvAnalysis);
        setBlueprint(mapped.interviewBlueprint);
        setStep('blueprint');
        await loadHistory();
      } else {
        throw new Error("Rollback failed");
      }
    } catch (e: any) {
      setFileError(e.message || "Failed to complete rollback.");
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!window.confirm("Are you sure you want to securely delete and shred this document version permanently? This action is irreversible.")) {
      return;
    }
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/v1/cv/versions/${versionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${currentUser.id}` }
      });
      if (res.ok) {
        await loadHistory();
      } else {
        throw new Error("Deletion failed");
      }
    } catch (e: any) {
      setFileError(e.message || "Failed to securely delete document version.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    const textToAnalyze = pastedText.trim();

    if (!textToAnalyze && !base64File && selectedFile) {
      setFileError('Wait for document processing or try re-selecting it.');
      return;
    }

    if (!textToAnalyze && !base64File) {
      setFileError('Input content required: Paste your CV text or select a valid document first.');
      return;
    }

    triggerAnalysis(textToAnalyze || null, base64File);
  };

  const handleRegenerate = () => {
    if (selectedFile || pastedText) {
      triggerAnalysis(pastedText || null, base64File);
    } else {
      setStep('upload');
    }
  };

  const handleChangeCV = () => {
    setSelectedFile(null);
    setBase64File(null);
    setPastedText('');
    setStep('upload');
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#111827] flex flex-col font-sans select-none py-12 px-4 sm:px-6 lg:px-8">
      
      {/* HEADER CONTROLLER */}
      <div className="max-w-4xl mx-auto w-full mb-6 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6B7280] hover:text-[#1A2B3C] uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>{t.homeDashboard}</span>
        </button>

        <div className="flex items-center gap-1.5 bg-[#1A2B3C]/5 px-3 py-1.5 rounded-full border border-[#1A2B3C]/10">
          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
          <span className="font-mono text-[9px] uppercase font-bold text-[#1A2B3C] tracking-widest">PHASE 3 ACTIVE</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white min-h-[500px] border border-[#E5E7EB] rounded-[32px] shadow-sm relative overflow-hidden p-6 sm:p-10 flex flex-col justify-between">
          
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle_at_top_right,rgba(26,43,60,0.03)_0%,transparent_70%)] pointer-events-none" />

          {/* ==============================================
              STEP 1: CV UPLOAD VIEW
             ============================================== */}
          {step === 'upload' && (
            <div id="cv-upload-step" className="space-y-8 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A2B3C] font-bold bg-[#1A2B3C]/5 px-2.5 py-1 rounded border border-[#1A2B3C]/10 inline-block">
                  {t.curriculumIngestion}
                </span>
                <h3 className="text-3xl font-black text-[#1A2B3C] tracking-tight">{t.uploadTitle}</h3>
                <p className="text-sm text-[#6B7280] font-medium max-w-xl">
                  {t.uploadDesc}
                </p>
              </div>

              {/* Error warning banner */}
              {(fileError || apiError) && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-xs font-semibold animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <div>
                    <p className="font-bold">{t.executionError}</p>
                    <p className="mt-0.5 text-red-600 font-medium">{fileError || apiError}</p>
                  </div>
                </div>
              )}

              {/* INPUT MATRIX CONTAINER */}
              <div className="grid grid-cols-1 gap-6 my-4">
                
                {!isPasting ? (
                  /* FILE INGEST ZONE */
                  <div className="border-2 border-dashed border-[#E5E7EB] hover:border-[#1A2B3C]/40 bg-zinc-50/50 rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center min-h-[220px] relative">
                    <div className="w-12 h-12 bg-white text-[#1A2B3C] rounded-2xl flex items-center justify-center border border-[#E5E7EB] shadow-sm mb-4">
                      <Upload className="w-5 h-5 stroke-[2]" />
                    </div>
                    
                    <h4 className="text-sm font-bold text-[#1A2B3C] mb-1">{t.selectDoc}</h4>
                    <p className="text-xs text-[#9CA3AF] mb-5 font-medium">{t.formatsDesc}</p>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <label className="px-5 py-2.5 bg-[#1A2B3C] hover:bg-[#2C3E50] text-[#FFFFFF] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer">
                        <span>{t.chooseFile}</span>
                        <input
                          type="file"
                          accept=".pdf,.docx,.txt"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setIsPasting(true);
                          setSelectedFile(null);
                        }}
                        className="px-5 py-2.5 bg-white border border-[#E5E7EB] hover:border-[#1A2B3C]/30 text-[#1A2B3C] font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        {t.pasteInstead}
                      </button>
                    </div>

                    {selectedFile && (
                      <div className="mt-6 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 max-w-sm">
                        <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-emerald-950 truncate max-w-[200px]">{selectedFile.name}</p>
                          <p className="text-[10px] text-emerald-600 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB — {t.specLocked}</p>
                        </div>
                        <Check className="w-4 h-4 text-emerald-600 ml-auto shrink-0" />
                      </div>
                    )}
                  </div>
                ) : (
                  /* TEXT PASTE CONTAINER */
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF]">{t.pasteTitle}</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPasting(false);
                          setPastedText('');
                        }}
                        className="text-[10px] font-bold text-[#6B7280] hover:text-[#1A2B3C] cursor-pointer inline-flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{t.returnToUpload}</span>
                      </button>
                    </div>
                    
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder={t.pastePlaceholder}
                      rows={10}
                      className="w-full bg-[#F3F4F6]/50 border border-[#E5E7EB] p-4 rounded-2xl text-xs outline-none focus:border-[#1A2B3C] text-[#111827] font-medium resize-none leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* ACTION MATRIX */}
              <div className="pt-6 border-t border-[#F3F4F6] flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-xs text-[#9CA3AF] font-bold uppercase tracking-wider select-none font-mono">
                  SHANA CORE SYSTEM v3
                </span>
                
                <button
                  onClick={handleStartAnalysis}
                  disabled={!selectedFile && !pastedText.trim()}
                  className={`w-full sm:w-auto px-8 py-4 font-bold text-xs uppercase tracking-widest rounded-xl shadow transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
                    selectedFile || pastedText.trim()
                      ? 'bg-[#1A2B3C] hover:bg-[#2C3E50] text-[#FFFFFF]'
                      : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-[#E5E7EB] shadow-none'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t.analyzeBtn}</span>
                </button>
              </div>

              {/* DOCUMENT MANAGEMENT & EVENT PIPELINE HISTORY */}
              {versions.length > 0 && (
                <div className="pt-8 border-t border-[#F3F4F6] space-y-6">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-[#1A2B3C]" />
                    <h4 className="text-sm font-extrabold text-[#1A2B3C] uppercase tracking-wider">
                      Durable Document Version History
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Versions Table */}
                    <div className="lg:col-span-7 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl overflow-hidden">
                      <div className="px-4 py-3 bg-[#F3F4F6] border-b border-[#E5E7EB] flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider">Stored CV Artifacts</span>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <Lock className="w-3 h-3" />
                          <span>Encrypted & Audited Storage</span>
                        </div>
                      </div>

                      <div className="divide-y divide-[#E5E7EB] max-h-[220px] overflow-y-auto">
                        {versions.map((v) => (
                          <div key={v.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono font-bold text-[#1A2B3C] bg-[#1A2B3C]/10 px-1.5 py-0.5 rounded text-[10px]">
                                  v{v.versionNumber}
                                </span>
                                <span className="font-bold text-[#374151] truncate max-w-[150px] sm:max-w-[200px]" title={v.fileName}>
                                  {v.fileName}
                                </span>
                                {v.isActive && (
                                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                    Active
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-[#6B7280]">
                                <span className="font-mono uppercase">{((v.fileSize || 5120) / 1024).toFixed(1)} KB</span>
                                <span>•</span>
                                <span className="font-mono">{new Date(v.uploadedAt).toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Status badge */}
                              {v.status === 'parsed' ? (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  Parsed
                                </span>
                              ) : v.status === 'failed' ? (
                                <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] px-2 py-0.5 rounded-full font-bold" title={v.errorLog}>
                                  Failed
                                </span>
                              ) : (
                                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                                  {v.status}
                                </span>
                              )}

                              {/* Rollback button */}
                              {!v.isActive && v.status === 'parsed' && (
                                <button
                                  type="button"
                                  onClick={() => handleRollback(v.id)}
                                  disabled={isRollingBack}
                                  className="p-1.5 hover:bg-white border border-transparent hover:border-[#E5E7EB] text-[#1A2B3C] rounded-lg transition-all cursor-pointer"
                                  title="Rollback to this version"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}

                              {/* Secure Delete button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteVersion(v.id)}
                                disabled={isDeleting}
                                className="p-1.5 hover:bg-red-50 text-[#EF4444] rounded-lg transition-all cursor-pointer"
                                title="Securely shred and delete version"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Events Console Logs */}
                    <div className="lg:col-span-5 bg-[#1E293B] border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[264px]">
                      <div className="px-4 py-3 bg-[#0F172A] border-b border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">Pipeline Event Monitor</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 font-bold uppercase">SECURE_AUDIT_LOGS</span>
                      </div>

                      <div className="p-4 flex-1 font-mono text-[11px] text-slate-300 overflow-y-auto space-y-2.5">
                        {events.length === 0 ? (
                          <p className="text-slate-500 text-center italic py-12">No ingestion events logged yet. Upload a CV to trigger processing.</p>
                        ) : (
                          events.slice(0, 15).map((evt) => (
                            <div key={evt.id} className="space-y-0.5">
                              <div className="flex justify-between text-[9px] text-slate-500">
                                <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                                <span className="text-emerald-400 font-bold">{evt.eventType.toUpperCase()}</span>
                              </div>
                              <p className="text-[#38BDF8] break-all leading-relaxed">{evt.description}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==============================================
              STEP 2: SHANA ANALYSIS PROCESSING SCREEN
             ============================================== */}
          {step === 'analyzing' && (
            <div id="cv-analyzing-step" className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-8 animate-pulse">
              
              {/* Majestic Audio-wave-like Ripple */}
              <div className="relative">
                <div className="w-24 h-24 bg-[#1A2B3C]/5 border border-[#1A2B3C]/10 rounded-full flex items-center justify-center animate-spin duration-3000">
                  <Activity className="w-10 h-10 text-[#1A2B3C]" />
                </div>
                <div className="absolute inset-0 border border-[#1A2B3C]/20 rounded-full animate-ping scale-150 opacity-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#1A2B3C] tracking-tight">{t.analyzingTitle}</h3>
                <p className="text-xs text-[#6B7280] font-bold uppercase tracking-widest font-mono">{t.preparingDesc}</p>
              </div>

              {/* Progressive loading states - No fake percentages, only structural status messages! */}
              <div className="max-w-md w-full bg-[#F9FAFB] border border-[#E5E7EB] p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center shadow-inner">
                <div id="loading-state-ticker" className="text-xs text-[#1A2B3C] font-extrabold flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{loadingStates[loadingStateIndex]}</span>
                </div>
                <p className="text-[10px] text-[#9CA3AF] font-medium leading-relaxed mt-1">
                  {t.secureMappingDesc}
                </p>
              </div>

            </div>
          )}

          {/* ==============================================
              STEP 5: BLUEPRINT RESULT PAGE
             ============================================== */}
          {/* ==============================================
              STEP 5: BLUEPRINT RESULT PAGE
             ============================================== */}
          {step === 'blueprint' && analysis && blueprint && (
            <div id="cv-blueprint-result-step" className="space-y-8 flex-1 flex flex-col justify-between">
              
              {/* HEADER CAPTIONS */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-[#F3F4F6]">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#10B981] font-bold bg-[#E6F4EA] px-2.5 py-1 rounded inline-block">
                    {t.blueprintCalibrated}
                  </span>
                  <h3 className="text-3xl font-black text-[#1A2B3C] tracking-tight">{t.planReady}</h3>
                  <p className="text-xs text-[#6B7280] font-medium">
                    {t.adaptedDesc}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-3.5">
                  <div className="space-y-0.5 text-right">
                    <span className="block text-[8px] font-bold text-[#9CA3AF] uppercase">{t.difficultyRank}</span>
                    <span className="block font-mono text-xs font-black text-[#1A2B3C]">{isFrench && blueprint.difficulty === 'Mid' ? 'Intermédiaire' : isFrench && blueprint.difficulty === 'Junior' ? 'Débutant' : isFrench && blueprint.difficulty === 'Senior' ? 'Senior' : isFrench && blueprint.difficulty === 'Executive' ? 'Direction' : blueprint.difficulty}</span>
                  </div>
                  <div className="w-px h-8 bg-[#E5E7EB]" />
                  <div className="space-y-0.5 text-left pl-1">
                    <span className="block text-[8px] font-bold text-[#9CA3AF] uppercase">{t.recommended}</span>
                    <span className="block text-xs font-black text-[#1A2B3C]">{blueprint.recommendedSessions} {t.sessionsSuffix}</span>
                  </div>
                </div>
              </div>

              {/* CORE HIGHLIGHTS BENTO GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
                
                {/* COLUMN 1: CANDIDATE PROFILE EXTRAPOLATION */}
                <div className="space-y-5">
                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#9CA3AF] mb-2 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{t.extractedBlueprint}</span>
                    </h4>
                    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-5 space-y-4 shadow-inner">
                      <div>
                        <span className="text-[9px] text-[#9CA3AF] font-bold font-mono">{t.targetRole}</span>
                        <p className="text-sm font-bold text-[#1A2B3C] mt-0.5">{analysis.role}</p>
                      </div>

                      <div>
                        <span className="text-[9px] text-[#9CA3AF] font-bold font-mono">{t.industryDomain}</span>
                        <p className="text-xs font-bold text-[#1A2B3C] mt-0.5">{analysis.industry}</p>
                      </div>

                      <div>
                        <span className="text-[9px] text-[#9CA3AF] font-bold font-mono">{t.careerSummary}</span>
                        <p className="text-xs text-[#6B7280] font-medium leading-relaxed mt-0.5">{analysis.summary}</p>
                      </div>

                      <div>
                        <span className="text-[9px] text-[#9CA3AF] font-bold font-mono">{t.demonstratedSkills}</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {analysis.skills.map((sku, i) => (
                            <span key={i} className="text-[10px] font-bold bg-[#1A2B3C]/5 text-[#1A2B3C] px-2 py-0.5 rounded border border-[#1A2B3C]/10">
                              {sku}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#9CA3AF] mb-2 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{t.calibrationFocus}</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="border border-[#E5E7EB] rounded-xl p-3 bg-white space-y-0.5">
                        <span className="text-[8px] font-bold text-[#9CA3AF] uppercase block">{t.primaryFocus}</span>
                        <span className="text-xs font-bold text-[#1A2B3C] block truncate">{isFrench && blueprint.primaryFocus === 'Core Technical Capability' ? 'Compétence Technique Clé' : isFrench && blueprint.primaryFocus === 'STAR Method Mastery' ? 'Maîtrise de la Méthode STAR' : blueprint.primaryFocus}</span>
                      </div>
                      <div className="border border-[#E5E7EB] rounded-xl p-3 bg-white space-y-0.5">
                        <span className="text-[8px] font-bold text-[#9CA3AF] uppercase block">{t.secondaryFocus}</span>
                        <span className="text-xs font-bold text-[#1A2B3C] block truncate">{isFrench && blueprint.secondaryFocus === 'STAR Method Mastery' ? 'Maîtrise de la Méthode STAR' : isFrench && blueprint.secondaryFocus === 'Behavioral Poise' ? 'Aisance et Posture' : blueprint.secondaryFocus}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: BLUEPRINT WEIGHTING & PERFORMANCE INDICATORS */}
                <div className="space-y-5">
                  
                  {/* WEIGHTS VISUALIZER */}
                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#9CA3AF] mb-2 flex items-center gap-1">
                      <PieIcon className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{t.interviewAreaBalance}</span>
                    </h4>
                    <div className="bg-zinc-50 border border-[#E5E7EB] rounded-2xl p-5 space-y-3 shadow-inner">
                      
                      {/* Weights breakdown list */}
                      <div className="space-y-3.5">
                        {/* Behavioral weight */}
                        <div>
                          <div className="flex justify-between items-center text-xs font-bold text-[#1A2B3C] mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 bg-[#1A2B3C] rounded-full" />
                              {t.behavioral}
                            </span>
                            <span>{blueprint.behavioralWeight}%</span>
                          </div>
                          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1A2B3C] rounded-full transition-all" style={{ width: `${blueprint.behavioralWeight}%` }} />
                          </div>
                        </div>

                        {/* Role weight */}
                        <div>
                          <div className="flex justify-between items-center text-xs font-bold text-[#1A2B3C] mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                              {t.roleSpecific}
                            </span>
                            <span>{blueprint.roleWeight}%</span>
                          </div>
                          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${blueprint.roleWeight}%` }} />
                          </div>
                        </div>

                        {/* Industry weight */}
                        <div>
                          <div className="flex justify-between items-center text-xs font-bold text-[#1A2B3C] mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full" />
                              {t.industryFocus}
                            </span>
                            <span>{blueprint.industryWeight}%</span>
                          </div>
                          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${blueprint.industryWeight}%` }} />
                          </div>
                        </div>

                        {/* Resume weight */}
                        <div>
                          <div className="flex justify-between items-center text-xs font-bold text-[#1A2B3C] mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                              {t.resumeDeepDive}
                            </span>
                            <span>{blueprint.resumeWeight}%</span>
                          </div>
                          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${blueprint.resumeWeight}%` }} />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* STRENGTHS AND AREAS TO IMPROVE (Potential Risks) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Strengths card */}
                    <div className="border border-emerald-100 bg-emerald-50/20 rounded-2xl p-4 space-y-2">
                      <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t.coreStrengths}</span>
                      </span>
                      <ul className="space-y-2">
                        {analysis.strengths.slice(0, 2).map((st, i) => (
                          <li key={i} className="text-[11px] text-zinc-700 font-medium leading-relaxed flex gap-1 items-start">
                            <span className="text-emerald-500 shrink-0 font-bold">✓</span>
                            <span>{st}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Areas to Improve (Risks) */}
                    <div className="border border-amber-100 bg-amber-50/20 rounded-2xl p-4 space-y-2">
                      <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        <span>{t.potentialRisks}</span>
                      </span>
                      <ul className="space-y-2">
                        {analysis.risks.slice(0, 2).map((ri, i) => (
                          <li key={i} className="text-[11px] text-zinc-700 font-medium leading-relaxed flex gap-1 items-start">
                            <span className="text-amber-500 shrink-0 font-bold">!</span>
                            <span>{ri}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>

                </div>

              </div>

              {/* ACTION ROW */}
              <div className="pt-6 border-t border-[#F3F4F6] flex flex-col sm:flex-row justify-between items-center gap-4">
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleChangeCV}
                    className="w-full sm:w-auto px-5 py-3 border-2 border-dashed border-[#1A2B3C]/20 hover:border-[#1A2B3C] text-[#1A2B3C] hover:bg-[#1A2B3C]/5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t.changeCvBtn}</span>
                  </button>

                  <button
                    onClick={handleRegenerate}
                    className="w-full sm:w-auto px-5 py-3 border border-[#E5E7EB] hover:border-[#1A2B3C]/30 text-[#6B7280] hover:text-[#1A2B3C] font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t.regenerateBtn}</span>
                  </button>
                </div>

                <button
                  id="result-continue-btn"
                  onClick={() => onComplete(analysis, blueprint)}
                  className="w-full sm:w-auto px-10 py-4 bg-[#1A2B3C] hover:bg-[#2C3E50] text-[#FFFFFF] font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>{t.continueBtn}</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
