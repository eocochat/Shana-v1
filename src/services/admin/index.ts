import { User, ActiveTab } from '../../types';
import { StorageService } from '../../lib/storage';

export interface AuditLog {
  id: string;
  type: 'LOGIN' | 'ROLE_UPDATE' | 'ADMIN_ACTION' | 'SYSTEM';
  action: string;
  performedBy: {
    id: string;
    email: string;
    role: string;
  };
  targetUserId?: string;
  timestamp: string;
  details?: string;
}

const AUDIT_LOGS_KEY = 'shana_audit_logs';

/**
 * AccessController holds roles/permission logic on the client side
 * and manages access control verification and admin workflows.
 */
export const AccessController = {
  /**
   * Returns true if user has the given role or higher.
   */
  hasRole(userRole: string | undefined, requiredRole: 'candidate' | 'admin' | 'super_admin'): boolean {
    if (!userRole) return false;
    if (requiredRole === 'candidate') return true;
    if (requiredRole === 'admin') {
      return userRole === 'admin' || userRole === 'super_admin';
    }
    if (requiredRole === 'super_admin') {
      return userRole === 'super_admin';
    }
    return false;
  },

  /**
   * Returns all available permissions for a role.
   */
  getPermissions(role: 'candidate' | 'admin' | 'super_admin' | string | undefined): string[] {
    if (role === 'super_admin') {
      return [
        'view_dashboard',
        'view_users',
        'manage_user_status',
        'manage_user_roles', // Super admin only
        'view_interviews',
        'view_settings',
        'manage_settings',
        'view_audit_logs',  // Super admin only
        'manage_platform',  // Super admin only
        'manage_admins'     // Super admin only
      ];
    }
    if (role === 'admin') {
      return [
        'view_dashboard',
        'view_users',
        'manage_user_status',
        'view_interviews',
        'view_settings'
      ];
    }
    // Candidate
    return ['view_dashboard_own'];
  },

  /**
   * Log administrative activity securely
   */
  logAction(
    type: AuditLog['type'],
    action: string,
    performedBy: { id: string; email: string; role: string },
    targetUserId?: string,
    details?: string
  ): void {
    try {
      const logs = this.getAuditLogs();
      const newLog: AuditLog = {
        id: 'aud_' + Math.random().toString(36).substring(2, 11),
        type,
        action,
        performedBy,
        targetUserId,
        timestamp: new Date().toISOString(),
        details
      };
      logs.unshift(newLog); // Newest first
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
      
      // Also notify the server about this audit event
      fetch('/api/admin/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      }).catch(err => console.warn('[SHANA Audit] Failed to push audit log to server:', err));
    } catch (e) {
      console.error('Failed to log audit action:', e);
    }
  },

  /**
   * Retrieve secure audit logs (Newest first)
   */
  getAuditLogs(): AuditLog[] {
    try {
      const saved = localStorage.getItem(AUDIT_LOGS_KEY);
      const list = saved ? JSON.parse(saved) : [];
      if (list.length === 0) {
        // Seed default audit logs
        const defaultLogs: AuditLog[] = [
          {
            id: 'aud_seed1',
            type: 'SYSTEM',
            action: 'Administration database initialized securely.',
            performedBy: { id: 'system', email: 'system@shana.com', role: 'super_admin' },
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'aud_seed2',
            type: 'ROLE_UPDATE',
            action: 'Promoted Marc to Super Admin.',
            performedBy: { id: 'system', email: 'system@shana.com', role: 'super_admin' },
            targetUserId: 'usr_superadmin',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
          }
        ];
        localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(defaultLogs));
        return defaultLogs;
      }
      return list;
    } catch (e) {
      return [];
    }
  }
};
