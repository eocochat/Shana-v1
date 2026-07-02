import React, { useEffect, useState } from 'react';
import { StorageService } from '../lib/storage';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
  onRedirect: () => void;
  lang?: 'FR' | 'EN';
}

export default function AdminGuard({
  children,
  onRedirect,
  lang = 'FR'
}: AdminGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Get user role from StorageService.getSession()
    const session = StorageService.getSession();
    let userRole = session?.user?.role;

    // 2. Also check browser sessionStorage for any stored user session or role to align with "session storage"
    if (!userRole) {
      try {
        const storedUser = sessionStorage.getItem('currentUser') || sessionStorage.getItem('shana_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          userRole = parsed?.role;
        }
      } catch (e) {
        console.error('Error reading currentUser from sessionStorage:', e);
      }
    }

    if (!userRole) {
      try {
        const directRole = sessionStorage.getItem('user_role') || sessionStorage.getItem('shana_role') || sessionStorage.getItem('role');
        if (directRole) {
          userRole = directRole as any;
        }
      } catch (e) {
        console.error('Error reading role from sessionStorage:', e);
      }
    }

    const authorized = userRole === 'admin' || userRole === 'super_admin';
    setIsAuthorized(authorized);

    // If unauthorized, trigger the redirect callback to the home view
    if (!authorized) {
      onRedirect();
    }
  }, [onRedirect]);

  // While checking authorization, show a clean loading spinner
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  // If unauthorized, return null (the useEffect redirect will trigger navigation) or fallback warning card
  if (!isAuthorized) {
    return (
      <div 
        id="admin-guard-unauthorized-stage" 
        className="max-w-md mx-auto my-12 p-8 bg-white border border-red-200 rounded-[32px] shadow-xs text-center space-y-6"
      >
        <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-[9px] uppercase tracking-widest bg-red-100 border border-red-200 text-red-700 px-2.5 py-1 rounded font-bold">
            {lang === 'FR' ? "ACCÈS COMPROMIS" : "ACCESS DENIED"}
          </span>
          <h3 className="font-sans font-bold text-xl text-stone-900 mt-2">
            {lang === 'FR' ? "Espace Restreint" : "Restricted Administration Area"}
          </h3>
          <p className="text-[#6B7280] text-xs leading-relaxed font-semibold">
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
          <span>{lang === 'FR' ? "Retourner à l'Accueil" : "Return to Home"}</span>
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
