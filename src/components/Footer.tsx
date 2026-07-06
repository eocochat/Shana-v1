import React from 'react';
import { translations } from '../translations';
import { Globe, ArrowUpRight } from 'lucide-react';
import ShanaLogo from './ShanaLogo';

interface FooterProps {
  lang: 'EN' | 'FR';
  onChangeLang: (lang: 'EN' | 'FR') => void;
  onNavigatePage: (page: string) => void;
  onNavigateHome: () => void;
}

export default function Footer({ lang, onChangeLang, onNavigatePage, onNavigateHome }: FooterProps) {
  const isFR = lang === 'FR';

  const sections = {
    product: {
      title: isFR ? "Produit" : "Product",
      links: [
        { id: 'how-it-works', label: isFR ? "Comment ça marche" : "How It Works" },
        { id: 'voice-training-info', label: isFR ? "Entraînement Vocal" : "Voice Training" },
        { id: 'mirror-assessment-info', label: isFR ? "Évaluation Miroir" : "Mirror Assessment" },
        { id: 'faq', label: isFR ? "FAQ" : "FAQ" }
      ]
    },
    resources: {
      title: isFR ? "Ressources" : "Resources",
      links: [
        { id: 'blog', label: isFR ? "Blog" : "Blog" },
        { id: 'interview-guide', label: isFR ? "Guide d'Entretien" : "Interview Guide" },
        { id: 'help-center', label: isFR ? "Centre d'Aide" : "Help Center" },
        { id: 'contact', label: isFR ? "Contact" : "Contact" }
      ]
    },
    legal: {
      title: isFR ? "Légal" : "Legal",
      links: [
        { id: 'privacy', label: isFR ? "Charte de Confidentialité" : "Privacy Policy" },
        { id: 'terms', label: isFR ? "Conditions Générales" : "Terms & Conditions" },
        { id: 'cookies', label: isFR ? "Politique de Cookies" : "Cookie Policy" },
        { id: 'data-usage', label: isFR ? "Utilisation des Données" : "Data Usage" }
      ]
    }
  };

  return (
    <footer id="shana-global-footer" className="bg-stone-950 text-[#E5E7EB] pt-16 pb-12 shrink-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pb-12 border-b border-stone-800">
          
          {/* Brand/Tagline Column */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity" onClick={onNavigateHome}>
              <ShanaLogo size="sm" theme="gold" showSlogan={false} className="items-start" />
            </div>
            
            <p className="font-sans text-xs font-bold text-[#9CA3AF] tracking-wider uppercase">
              {isFR ? "S'Entraîner. S'Évaluer. S'Améliorer." : "Train. Assess. Improve."}
            </p>
            
            <p className="text-xs text-[#9CA3AF] leading-relaxed max-w-sm font-bold">
              {isFR 
                ? "Préparation d'entretien ultra-ciblée d'après votre parcours et vos expériences singulières."
                : "Personalized interview preparation powered by your experience and actual industry requirements."}
            </p>
          </div>

          {/* Nav Links Column: Product */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h4 className="font-sans font-black text-xs text-white uppercase tracking-wider">
              {sections.product.title}
            </h4>
            <ul className="space-y-2.5 text-xs text-[#9CA3AF] uppercase font-bold tracking-wide">
              {sections.product.links.map((link) => (
                <li key={link.id}>
                  <button
                    id={`footer-link-${link.id}`}
                    onClick={() => onNavigatePage(link.id)}
                    className="hover:text-white hover:underline transition-colors cursor-pointer text-left focus:outline-none"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Nav Links Column: Resources */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h4 className="font-sans font-black text-xs text-white uppercase tracking-wider">
              {sections.resources.title}
            </h4>
            <ul className="space-y-2.5 text-xs text-[#9CA3AF] uppercase font-bold tracking-wide">
              {sections.resources.links.map((link) => (
                <li key={link.id}>
                  <button
                    id={`footer-link-${link.id}`}
                    onClick={() => onNavigatePage(link.id)}
                    className="hover:text-white hover:underline transition-colors cursor-pointer text-left focus:outline-none"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Nav Links Column: Legal */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h4 className="font-sans font-black text-xs text-white uppercase tracking-wider">
              {sections.legal.title}
            </h4>
            <ul className="space-y-2.5 text-xs text-[#9CA3AF] uppercase font-bold tracking-wide">
              {sections.legal.links.map((link) => (
                <li key={link.id}>
                  <button
                    id={`footer-link-${link.id}`}
                    onClick={() => onNavigatePage(link.id)}
                    className="hover:text-white hover:underline transition-colors cursor-pointer text-left focus:outline-none"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* System/Language Utilities Column */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h4 className="font-sans font-black text-xs text-white uppercase tracking-wider">
              {isFR ? "CONFIG SYSTEME" : "SYSTEM CONFIG"}
            </h4>
            
            {/* Language Selection */}
            <div className="flex bg-[#FAF7F2] p-1 rounded-xl border-2 border-stone-950 max-w-[120px] shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)]">
              <button
                id="footer-lang-en"
                onClick={() => onChangeLang('EN')}
                className={`flex-1 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center font-mono ${
                  lang === 'EN' ? 'bg-stone-950 text-white font-black' : 'text-stone-500 hover:text-stone-950'
                }`}
              >
                EN
              </button>
              <button
                id="footer-lang-fr"
                onClick={() => onChangeLang('FR')}
                className={`flex-1 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center font-mono ${
                  lang === 'FR' ? 'bg-stone-950 text-white font-black' : 'text-stone-500 hover:text-stone-950'
                }`}
              >
                FR
              </button>
            </div>

            <div className="space-y-1 font-mono text-[9px] text-[#9CA3AF] uppercase">
              <span className="block">{isFR ? "VERSION // 1.4.0-PRO" : "VERSION // 1.4.0-PRO"}</span>
              <span className="block text-emerald-400 font-bold">&#x25CF; {isFR ? "PROTOCOLES OK" : "PROTOCOLS VERIFIED"}</span>
            </div>
          </div>

        </div>

        {/* Lower copyright bar */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p className="font-mono text-[10px] text-[#9CA3AF]">
            © 2026 SHANA INTERFACE PROTOCOL. ALL RIGHTS RESERVED.
          </p>
          <p className="text-[10px] text-[#6B7280] max-w-xs leading-normal">
            {isFR 
              ? "SHANA est une marque de préparation d'entretien d'excellence, conçue dans un cadre privé et hautement sécurisé."
              : "SHANA is an elite interview preparation brand built within a private, highly secured container."}
          </p>
        </div>

      </div>
    </footer>
  );
}
