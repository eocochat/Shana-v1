import React, { useState } from 'react';
import { Shield, Brain, Trash2, Edit2, Check, X, Download, AlertTriangle, Eye, Sliders, RefreshCw, Sparkles, Radio } from 'lucide-react';
import { RelationshipMemoryEngine, MemoryPrefs, MultimodalMemoryMock } from '../lib/conversation/relationshipMemoryEngine';
import { StorageService } from '../lib/storage';
import { useToast } from './Toast';

interface RelationshipMemoryCenterProps {
  userId: string;
  lang: 'EN' | 'FR';
}

export default function RelationshipMemoryCenter({ userId, lang }: RelationshipMemoryCenterProps) {
  const { addToast } = useToast();
  const [prefs, setPrefs] = useState<MemoryPrefs>(() => RelationshipMemoryEngine.getPrefs(userId));
  const [history, setHistory] = useState<any[]>(() => StorageService.getHistory(userId));
  const [activeTab, setActiveTab] = useState<'all' | 'career' | 'technical' | 'communication' | 'multimodal'>('all');
  
  // Edit state
  const [editingIndex, setEditingIndex] = useState<{ sessionIdx: number; field: 'weakness' | 'recommendation' | 'strengths'; strengthIdx?: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  const isFR = lang === 'FR';

  const handleToggleMemory = () => {
    const updated = { ...prefs, enabled: !prefs.enabled };
    RelationshipMemoryEngine.savePrefs(userId, updated);
    setPrefs(updated);
    addToast({
      title: isFR ? "Préférences modifiées" : "Privacy Preferences Updated",
      description: updated.enabled
        ? (isFR ? "La mémoire à long terme a été activée." : "Long-term Relationship Memory is now active.")
        : (isFR ? "La mémoire à long terme a été désactivée." : "Long-term Relationship Memory has been paused."),
      type: "success"
    });
  };

  const handleExportMemory = () => {
    try {
      const profile = StorageService.getProfile(userId);
      const cvAnalysis = StorageService.getAnalysis(userId);
      const memories = RelationshipMemoryEngine.extractRelationshipMemories(userId, history, profile);
      const dataToExport = {
        userId,
        exportedAt: new Date().toISOString(),
        profile: {
          targetRole: profile?.targetRole || cvAnalysis?.role,
          industry: profile?.industry || cvAnalysis?.industry,
          experienceYears: profile?.experienceYears
        },
        relationship_memory: {
          prefs,
          career: memories.careerMem,
          technical: memories.technicalMem,
          behavioral: memories.behavioralMem,
          communication: memories.communicationMem,
          learning: memories.learningMem
        }
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shana_relationship_memory_${userId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        title: isFR ? "Exportation Réussie" : "Export Completed",
        description: isFR ? "Votre profil de mémoire relationnelle a été téléchargé." : "Your Relationship Memory profile has been exported as JSON.",
        type: "success"
      });
    } catch (e) {
      addToast({
        title: "Error",
        description: "Failed to export relationship memory.",
        type: "error"
      });
    }
  };

  const handleResetHistory = () => {
    const confirmReset = window.confirm(
      isFR
        ? "Êtes-vous absolument sûr de vouloir effacer complètement votre historique d'entretiens ? Cela effacera tous vos progrès et désactivera vos souvenirs relationnels."
        : "Are you absolutely sure you want to clear your interview and training history? This will permanently wipe your relationship memory records and reset your growth curve."
    );

    if (!confirmReset) return;

    StorageService.saveHistory(userId, []);
    setHistory([]);
    addToast({
      title: isFR ? "Historique Réinitialisé" : "History Wiped",
      description: isFR ? "Tous vos souvenirs et sessions ont été effacés." : "Your interview history and memories have been purged successfully.",
      type: "success"
    });
  };

  const handleDeleteMemoryItem = (sessionIdx: number, field: 'weakness' | 'recommendation' | 'strengths', strengthIdx?: number) => {
    const confirmDel = window.confirm(
      isFR ? "Voulez-vous supprimer ce souvenir spécifique de votre profil ?" : "Do you want to permanently delete this specific memory element?"
    );
    if (!confirmDel) return;

    const updatedHistory = [...history];
    const session = { ...updatedHistory[sessionIdx] };

    if (field === 'weakness') {
      session.weakness = '';
    } else if (field === 'recommendation') {
      session.recommendation = '';
    } else if (field === 'strengths' && typeof strengthIdx === 'number' && session.strengths) {
      session.strengths = session.strengths.filter((_: any, i: number) => i !== strengthIdx);
    }

    updatedHistory[sessionIdx] = session;
    StorageService.saveHistory(userId, updatedHistory);
    setHistory(updatedHistory);

    addToast({
      title: isFR ? "Souvenir Supprimé" : "Memory Item Deleted",
      description: isFR ? "Le souvenir sélectionné a été retiré de votre historique." : "Selected memory fragment has been purged from history.",
      type: "success"
    });
  };

  const handleStartEdit = (sessionIdx: number, field: 'weakness' | 'recommendation' | 'strengths', initialVal: string, strengthIdx?: number) => {
    setEditingIndex({ sessionIdx, field, strengthIdx });
    setEditValue(initialVal);
  };

  const handleSaveEdit = () => {
    if (!editingIndex) return;
    const { sessionIdx, field, strengthIdx } = editingIndex;

    const updatedHistory = [...history];
    const session = { ...updatedHistory[sessionIdx] };

    if (field === 'weakness') {
      session.weakness = editValue.trim();
    } else if (field === 'recommendation') {
      session.recommendation = editValue.trim();
    } else if (field === 'strengths' && typeof strengthIdx === 'number' && session.strengths) {
      session.strengths[strengthIdx] = editValue.trim();
    }

    updatedHistory[sessionIdx] = session;
    StorageService.saveHistory(userId, updatedHistory);
    setHistory(updatedHistory);
    setEditingIndex(null);

    addToast({
      title: isFR ? "Souvenir Rectifié" : "Memory Item Corrected",
      description: isFR ? "Le souvenir a été mis à jour avec succès." : "The memory entry has been updated successfully.",
      type: "success"
    });
  };

  const profile = StorageService.getProfile(userId);
  const cvAnalysis = StorageService.getAnalysis(userId);
  const memories = RelationshipMemoryEngine.extractRelationshipMemories(userId, history, profile);
  const multimodal = RelationshipMemoryEngine.getMultimodalMemoryMock(isFR);

  return (
    <div id="relationship-memory-center" className="space-y-6 text-left selection:bg-emerald-200">
      
      {/* Overview Block */}
      <div className="bg-emerald-50 border-2 border-stone-950 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-emerald-700 animate-pulse" />
              <span>{isFR ? "MOTEUR D'EMPATHIE ET SOUVENIR RELATIONNEL" : "RECRUITER EMPATHY & RELATIONSHIP MEMORY ENGINE"}</span>
            </span>
            <h3 className="text-base font-extrabold text-stone-900 leading-tight uppercase">
              {isFR ? "Gestionnaire de Relation Mentorat" : "Mentorship Relationship Manager"}
            </h3>
            <p className="text-xs text-stone-700 leading-relaxed font-bold">
              {isFR
                ? "SHANA ne se contente pas de transcrire vos mots. Elle mémorise votre courbe de progression, vos défis techniques passés et votre élocution d'une session à l'autre pour agir en véritable mentor."
                : "SHANA builds a continuous, deep relationship profile. She tracks your growth milestones, past technical vulnerabilities, and communication pacing from session to session."}
            </p>
          </div>
          
          {/* Enable Toggle Switch */}
          <button
            type="button"
            onClick={handleToggleMemory}
            className={`px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-widest border-2 border-stone-950 rounded-lg cursor-pointer transition-colors shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] ${
              prefs.enabled 
                ? 'bg-[#A7F3D0] hover:bg-[#86efac] text-emerald-950' 
                : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
            }`}
            id="relationship-memory-toggle"
          >
            {prefs.enabled ? (isFR ? "Mémoire Activée" : "Memory Enabled") : (isFR ? "Mémoire Suspendue" : "Memory Paused")}
          </button>
        </div>

        {/* Info row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t-2 border-dashed border-emerald-950/20">
          <div className="bg-white/80 p-2.5 rounded-xl border border-stone-950/20">
            <span className="text-[9px] text-stone-500 font-bold block uppercase">{isFR ? "Sessions Mémorisées" : "Stored Sessions"}</span>
            <span className="text-sm font-black text-emerald-900">{history.length}</span>
          </div>
          <div className="bg-white/80 p-2.5 rounded-xl border border-stone-950/20">
            <span className="text-[9px] text-stone-500 font-bold block uppercase">{isFR ? "Force Mentale" : "Behavioral Highlights"}</span>
            <span className="text-sm font-black text-emerald-900">{memories.behavioralMem.length}</span>
          </div>
          <div className="bg-white/80 p-2.5 rounded-xl border border-stone-950/20">
            <span className="text-[9px] text-stone-500 font-bold block uppercase">{isFR ? "Défis Techniques" : "Technical Milestones"}</span>
            <span className="text-sm font-black text-emerald-900">{memories.technicalMem.length}</span>
          </div>
          <div className="bg-white/80 p-2.5 rounded-xl border border-stone-950/20">
            <span className="text-[9px] text-stone-500 font-bold block uppercase">{isFR ? "Évolution Élocution" : "Communication Assets"}</span>
            <span className="text-sm font-black text-emerald-900">{memories.communicationMem.length}</span>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="flex flex-wrap gap-2 border-b-2 border-stone-950 pb-2">
        {(['all', 'career', 'technical', 'communication', 'multimodal'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider rounded-lg border-2 border-stone-950 cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] ${
              activeTab === tab
                ? 'bg-[#EDC154] text-stone-950'
                : 'bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            {tab === 'all' && (isFR ? "Tous" : "All Profile")}
            {tab === 'career' && (isFR ? "Carrière & Conseils" : "Career & Coaching")}
            {tab === 'technical' && (isFR ? "Vérification Technique" : "Technical & Star")}
            {tab === 'communication' && (isFR ? "Fidélité Élocution" : "Pace & Filler Words")}
            {tab === 'multimodal' && (isFR ? "Moteur Corporel ✦" : "Multimodal Evolution ✦")}
          </button>
        ))}
      </div>

      {/* Memory Entries Content Panel */}
      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
        {history.length === 0 && activeTab !== 'multimodal' ? (
          <div className="p-8 text-center bg-stone-50 border-2 border-stone-950 rounded-2xl border-dashed">
            <Sliders className="w-8 h-8 text-stone-400 mx-auto mb-2 animate-bounce" />
            <p className="text-xs font-bold text-stone-500 uppercase">
              {isFR ? "Aucune donnée de relation enregistrée" : "No Relationship Memories Available Yet"}
            </p>
            <p className="text-[10px] text-stone-400 mt-1">
              {isFR ? "Complétez votre premier entraînement ou assessment pour forger vos premiers souvenirs." : "Conduct an active training or assessment session to generate relationship memories."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            
            {/* 1. CAREER & COACHING MEMORY */}
            {(activeTab === 'all' || activeTab === 'career') && (
              <div className="space-y-2.5">
                {memories.careerMem.map((cm, i) => (
                  <div key={`career-${i}`} className="bg-white border-2 border-stone-950 p-3.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="bg-stone-100 border border-stone-950 text-[8px] font-mono px-2 py-0.5 rounded font-black uppercase text-stone-600">
                        {isFR ? "CIBLE CARRIÈRE" : "CAREER SPECIFICATION"}
                      </span>
                      <p className="text-xs font-black text-stone-900">{cm}</p>
                    </div>
                  </div>
                ))}

                {/* Recommendations as Learning Memory */}
                {history.map((session, sIdx) => {
                  if (!session.recommendation) return null;
                  const isEditingThis = editingIndex?.sessionIdx === sIdx && editingIndex?.field === 'recommendation';
                  return (
                    <div key={`rec-${sIdx}`} className="bg-white border-2 border-stone-950 p-3.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] flex flex-col justify-between gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="bg-blue-100 border border-blue-950 text-[8px] font-mono px-2 py-0.5 rounded font-black uppercase text-blue-900">
                            {isFR ? `CONSEIL DISPENSÉ LE ${session.date || ''}` : `MENTOR COACHING GIVEN ON ${session.date || ''}`}
                          </span>
                          
                          {isEditingThis ? (
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full mt-2 border-2 border-stone-950 p-2 text-xs rounded-lg font-bold font-sans focus:outline-none"
                              rows={3}
                            />
                          ) : (
                            <p className="text-xs font-bold text-stone-800 leading-relaxed italic">"{session.recommendation}"</p>
                          )}
                        </div>

                        {/* GDPR Operations */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isEditingThis ? (
                            <>
                              <button onClick={handleSaveEdit} className="p-1 text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-950 cursor-pointer" title="Save">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setEditingIndex(null)} className="p-1 text-red-700 hover:bg-red-50 rounded border border-red-950 cursor-pointer" title="Cancel">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleStartEdit(sIdx, 'recommendation', session.recommendation)} className="p-1 text-stone-600 hover:bg-stone-50 rounded cursor-pointer" title="Correct Memory Item">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteMemoryItem(sIdx, 'recommendation')} className="p-1 text-red-650 hover:bg-red-50 rounded cursor-pointer" title="Delete Memory Item">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. TECHNICAL & BEHAVIORAL */}
            {(activeTab === 'all' || activeTab === 'technical') && (
              <div className="space-y-2.5">
                {/* Weaknesses / Growth targets */}
                {history.map((session, sIdx) => {
                  if (!session.weakness) return null;
                  const isEditingThis = editingIndex?.sessionIdx === sIdx && editingIndex?.field === 'weakness';
                  return (
                    <div key={`weak-${sIdx}`} className="bg-white border-2 border-stone-950 p-3.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] flex flex-col justify-between gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="bg-red-100 border border-red-950 text-[8px] font-mono px-2 py-0.5 rounded font-black uppercase text-red-950">
                            {isFR ? `CIBLE D'AMÉLIORATION IDENTIFIÉE (${session.date || ''})` : `VULNERABILITY TO EXAMINE (${session.date || ''})`}
                          </span>
                          
                          {isEditingThis ? (
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full mt-2 border-2 border-stone-950 p-2 text-xs rounded-lg font-bold font-sans focus:outline-none"
                              rows={3}
                            />
                          ) : (
                            <p className="text-xs font-black text-red-950 leading-relaxed">"{session.weakness}"</p>
                          )}
                        </div>

                        {/* GDPR Operations */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isEditingThis ? (
                            <>
                              <button onClick={handleSaveEdit} className="p-1 text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-950 cursor-pointer" title="Save">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setEditingIndex(null)} className="p-1 text-red-700 hover:bg-red-50 rounded border border-red-950 cursor-pointer" title="Cancel">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleStartEdit(sIdx, 'weakness', session.weakness)} className="p-1 text-stone-600 hover:bg-stone-50 rounded cursor-pointer" title="Correct Memory Item">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteMemoryItem(sIdx, 'weakness')} className="p-1 text-red-650 hover:bg-red-50 rounded cursor-pointer" title="Delete Memory Item">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Behavioral Strengths */}
                {history.map((session, sIdx) => {
                  if (!session.strengths || !Array.isArray(session.strengths)) return null;
                  return session.strengths.map((str: string, strIdx: number) => {
                    const isEditingThis = editingIndex?.sessionIdx === sIdx && editingIndex?.field === 'strengths' && editingIndex?.strengthIdx === strIdx;
                    return (
                      <div key={`str-${sIdx}-${strIdx}`} className="bg-white border-2 border-stone-950 p-3.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] flex flex-col justify-between gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <span className="bg-emerald-100 border border-emerald-950 text-[8px] font-mono px-2 py-0.5 rounded font-black uppercase text-emerald-900">
                              {isFR ? `COMPÉTENCE PROFESSIONNELLE VALIDÉE (${session.date || ''})` : `VALIDATED TALENT METRIC (${session.date || ''})`}
                            </span>
                            
                            {isEditingThis ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full mt-2 border-2 border-stone-950 p-2 text-xs rounded-lg font-bold font-sans focus:outline-none"
                              />
                            ) : (
                              <p className="text-xs font-extrabold text-stone-900 leading-relaxed">"{str}"</p>
                            )}
                          </div>

                          {/* GDPR Operations */}
                          <div className="flex items-center gap-1 shrink-0">
                            {isEditingThis ? (
                              <>
                                <button onClick={handleSaveEdit} className="p-1 text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-950 cursor-pointer" title="Save">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingIndex(null)} className="p-1 text-red-700 hover:bg-red-50 rounded border border-red-950 cursor-pointer" title="Cancel">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => handleStartEdit(sIdx, 'strengths', str, strIdx)} className="p-1 text-stone-600 hover:bg-stone-50 rounded cursor-pointer" title="Correct Memory Item">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteMemoryItem(sIdx, 'strengths', strIdx)} className="p-1 text-red-650 hover:bg-red-50 rounded cursor-pointer" title="Delete Memory Item">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            )}

            {/* 3. COMMUNICATION CADENCE */}
            {(activeTab === 'all' || activeTab === 'communication') && (
              <div className="space-y-2.5">
                {history.map((session, sIdx) => {
                  if (!session.questionsFeedback || !Array.isArray(session.questionsFeedback)) return null;
                  return (
                    <div key={`comm-${sIdx}`} className="bg-white border-2 border-stone-950 p-4 rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] space-y-2">
                      <span className="bg-purple-100 border border-purple-950 text-[8px] font-mono px-2 py-0.5 rounded font-black uppercase text-purple-900">
                        {isFR ? `QUALITÉ CONVERSATIONNELLE ET VOCALE LE ${session.date || ''}` : `SPEECH METRICS AND VOCAL FLOW ON ${session.date || ''}`}
                      </span>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs pt-1">
                        <div className="p-2 bg-stone-50 rounded border border-stone-200">
                          <span className="text-[9px] text-stone-400 font-bold uppercase block">{isFR ? "Clarté Globale" : "Acoustic Clarity"}</span>
                          <span className="font-extrabold text-stone-850">84%</span>
                        </div>
                        <div className="p-2 bg-stone-50 rounded border border-stone-200">
                          <span className="text-[9px] text-stone-400 font-bold uppercase block">{isFR ? "Niveau d'Énergie" : "Energy Index"}</span>
                          <span className="font-extrabold text-stone-850">78%</span>
                        </div>
                        <div className="p-2 bg-stone-50 rounded border border-stone-200 col-span-2 md:col-span-1">
                          <span className="text-[9px] text-stone-400 font-bold uppercase block">{isFR ? "Stabilité de Vitesse" : "Pace Stability"}</span>
                          <span className="font-extrabold text-stone-850">{isFR ? "Régulier" : "Calibrated / Steady"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4. MULTIMODAL EVOLUTION */}
            {activeTab === 'multimodal' && (
              <div className="space-y-3">
                <div className="bg-emerald-950/5 border-2 border-dashed border-emerald-950/40 p-4 rounded-xl flex items-start gap-3">
                  <Radio className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="bg-[#A7F3D0] border border-stone-950 text-[8px] font-mono px-2 py-0.5 rounded font-black uppercase text-emerald-950 inline-block">
                      {isFR ? "MOTEUR MULTIMODAL DU FUTUR" : "FUTURE MULTIMODAL SPECIFICATION"}
                    </span>
                    <h5 className="text-xs font-black text-stone-900 uppercase mt-1">
                      {isFR ? "Signature Biométrique & Interaction Corporelle" : "Biometric Signature & Posture Intelligence"}
                    </h5>
                    <p className="text-[10px] text-stone-700 font-medium leading-relaxed mt-0.5">
                      {isFR
                        ? "Ce module prépare l'application pour l'intégration des flux vidéo, de la fréquence cardiaque indirecte et des capteurs oculaires."
                        : "This section maps physical cues (vocal jitter, camera focal vector, frame motion variance) to provide multimodal coaching feedback."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white border-2 border-stone-950 p-3.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] space-y-1">
                    <span className="text-[8px] font-mono text-stone-400 uppercase font-black">{isFR ? "Élocution & Pression respiratoire" : "Vocal Pace & Breath Control"}</span>
                    <p className="text-xs font-bold text-stone-800">{multimodal.voiceEvolution}</p>
                  </div>
                  <div className="bg-white border-2 border-stone-950 p-3.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] space-y-1">
                    <span className="text-[8px] font-mono text-stone-400 uppercase font-black">{isFR ? "Sourire & Stabilité Emotionnelle" : "Micro-smiles & Poise Retention"}</span>
                    <p className="text-xs font-bold text-stone-800">{multimodal.facialConfidence}</p>
                  </div>
                  <div className="bg-white border-2 border-stone-950 p-3.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] space-y-1">
                    <span className="text-[8px] font-mono text-stone-400 uppercase font-black">{isFR ? "Ciblage Oculaire" : "Eye Tracking Vector"}</span>
                    <p className="text-xs font-bold text-stone-800">{multimodal.eyeContact}</p>
                  </div>
                  <div className="bg-white border-2 border-stone-950 p-3.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] space-y-1">
                    <span className="text-[8px] font-mono text-stone-400 uppercase font-black">{isFR ? "Posture & Mouvements parasites" : "Posture Alignment & Fidget reduction"}</span>
                    <p className="text-xs font-bold text-stone-800">{multimodal.posture}</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* GDPR Global Actions */}
      <div className="pt-4 border-t-2 border-stone-950 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleExportMemory}
          className="flex-1 px-4 py-3 bg-white hover:bg-stone-50 border-2 border-stone-950 text-stone-950 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-[2.5px_2.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all flex items-center justify-center gap-2"
          id="export-memory-btn"
        >
          <Download className="w-4 h-4 text-stone-800" />
          <span>{isFR ? "Exporter mes Souvenirs (JSON)" : "Export Relationship Memory (JSON)"}</span>
        </button>

        <button
          type="button"
          disabled={history.length === 0}
          onClick={handleResetHistory}
          className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-950 border-2 border-stone-950 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-[2.5px_2.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          id="wipe-memory-history-btn"
        >
          <Trash2 className="w-4 h-4 text-red-650" />
          <span>{isFR ? "Effacer Mon Historique" : "Wipe Session History"}</span>
        </button>
      </div>

    </div>
  );
}
