export interface CookieConsent {
  essential: boolean;
  preferences: boolean;
  updatedAt: string;
}

export const getCookie = (name: string): string | null => {
  const nameEQ = encodeURIComponent(name) + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  // Robust fallback for iframes where cookies are disabled or blocked
  try {
    const fallback = localStorage.getItem(`cookie_${name}`);
    if (fallback !== null) return fallback;
  } catch (e) {
    console.warn("[SHANA Cookies] Failed to read from localStorage fallback:", e);
  }
  return null;
};

export const setCookie = (
  name: string,
  value: string,
  options: { days?: number; secure?: boolean; sameSite?: 'Lax' | 'Strict' | 'None' } = {}
): void => {
  // Check if consent is granted when trying to set Category 2 (Preferences) cookies.
  // Exception: Consent cookie itself is Category 1 (Essential).
  if (name !== 'shana_cookie_consent') {
    const consent = getConsent();
    if (name === 'shana_lang' || name === 'shana_onboarding' || name === 'shana_theme') {
      if (!consent || !consent.preferences) {
        console.warn(`[SHANA Cookies] Rejected setting non-essential cookie "${name}" due to user cookie preferences.`);
        return;
      }
    }
  }

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  const days = options.days !== undefined ? options.days : 30;
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  cookieString += `; expires=${d.toUTCString()}; path=/`;

  if (options.secure || window.location.protocol === 'https:') {
    cookieString += '; secure';
  }
  
  cookieString += `; samesite=${options.sameSite || 'Lax'}`;

  document.cookie = cookieString;

  // Sync to localStorage for robust fallback inside sandboxed iframe previews
  try {
    localStorage.setItem(`cookie_${name}`, value);
  } catch (e) {
    console.warn("[SHANA Cookies] Failed to write to localStorage fallback:", e);
  }
};

export const deleteCookie = (name: string): void => {
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  try {
    localStorage.removeItem(`cookie_${name}`);
  } catch (e) {
    console.warn("[SHANA Cookies] Failed to delete from localStorage fallback:", e);
  }
};

export const getConsent = (): CookieConsent | null => {
  const cookieVal = getCookie('shana_cookie_consent');
  if (!cookieVal) {
    try {
      const fallbackVal = localStorage.getItem('cookie_shana_cookie_consent');
      if (fallbackVal) {
        return JSON.parse(fallbackVal);
      }
    } catch {}
    return null;
  }
  try {
    return JSON.parse(cookieVal);
  } catch {
    return null;
  }
};

export const setConsent = (consent: Omit<CookieConsent, 'updatedAt'>): void => {
  const payload: CookieConsent = {
    ...consent,
    updatedAt: new Date().toISOString()
  };
  
  const serialized = JSON.stringify(payload);
  let cookieString = `shana_cookie_consent=${encodeURIComponent(serialized)}`;
  const d = new Date();
  d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
  cookieString += `; expires=${d.toUTCString()}; path=/; samesite=Lax`;
  if (window.location.protocol === 'https:') {
    cookieString += '; secure';
  }
  document.cookie = cookieString;

  // Sync to localStorage
  try {
    localStorage.setItem('cookie_shana_cookie_consent', serialized);
  } catch (e) {
    console.warn("[SHANA Cookies] Failed to write consent to localStorage fallback:", e);
  }

  // If preferences consent was revoked or not selected, clean preferences cookies
  if (!consent.preferences) {
    deleteCookie('shana_lang');
    deleteCookie('shana_onboarding');
    deleteCookie('shana_theme');
  }
};
