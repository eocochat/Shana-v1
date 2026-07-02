import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { User } from '../types';
import { AccessController } from '../services/admin';

interface RoleGuardProps {
  user: User | null;
  allowedRoles: ('candidate' | 'admin' | 'super_admin')[];
  children: React.ReactNode;
  lang?: 'FR' | 'EN';
  onRedirect: () => void;
}

export default function RoleGuard({
  user,
  allowedRoles,
  children,
  lang = 'FR',
  onRedirect
}: RoleGuardProps) {
  const userRole = user?.role || 'candidate';
  const isAuthorized = allowedRoles.includes(userRole as any);

  if (!isAuthorized) {
    return (
      <div 
        id="role-guard-unauthorized-stage" 
        className="max-w-md mx-auto my-12 p-8 bg-white border border-red-200 rounded-[32px] shadow-sm text-center space-y-6 animate-fade-in"
      >
        <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 animate-bounce">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-[9px] uppercase tracking-widest bg-red-100 border border-red-200 text-red-700 px-2.5 py-1 rounded font-bold">
            {lang === 'FR' ? "ACCÈS COMPROMIS" : "ACCESS DENIED"}
          </span>
          <h3 className="font-sans font-bold text-xl text-stone-900 mt-2">
            {lang === 'FR' ? "Espace Restreint" : "Restricted Administration Area"}
          </h3>
          <p className="text-stone-500 text-xs leading-relaxed font-medium">
            {lang === 'FR'
              ? "Vos privilèges actuels ne vous permettent pas d'accéder à ce portail d'administration."
              : "Your account credentials do not have permissions to access these system configuration views."}
          </p>
        </div>

        <button
          onClick={onRedirect}
          className="inline-flex items-center gap-2 bg-stone-950 hover:bg-stone-850 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl cursor-pointer shadow-md transition-all active:scale-95 font-sans"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'FR' ? "Retourner au Tableau de Bord" : "Return to Dashboard"}</span>
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
