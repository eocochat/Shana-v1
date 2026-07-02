import { Request, Response, NextFunction } from 'express';

// Role definitions
export type UserRole = 'candidate' | 'admin' | 'super_admin';
export type UserStatus = 'enabled' | 'disabled';

export interface BackendUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName: string;
  lastName: string;
  createdAt: string;
}

// In-Memory Database for backend role alignment
export const inMemoryUsers = new Map<string, BackendUser>();

// Initialize with default seeded users
inMemoryUsers.set('usr_candidate', {
  id: 'usr_candidate',
  email: 'candidate@shana.com',
  role: 'candidate',
  status: 'enabled',
  firstName: 'Jean',
  lastName: 'Candidat',
  createdAt: new Date().toISOString()
});

inMemoryUsers.set('usr_admin', {
  id: 'usr_admin',
  email: 'admin@shana.com',
  role: 'admin',
  status: 'enabled',
  firstName: 'Alice',
  lastName: 'Admin',
  createdAt: new Date().toISOString()
});

inMemoryUsers.set('usr_superadmin', {
  id: 'usr_superadmin',
  email: 'superadmin@shana.com',
  role: 'super_admin',
  status: 'enabled',
  firstName: 'Marc',
  lastName: 'Super',
  createdAt: new Date().toISOString()
});

inMemoryUsers.set('usr_disabled', {
  id: 'usr_disabled',
  email: 'disabled@shana.com',
  role: 'candidate',
  status: 'disabled',
  firstName: 'René',
  lastName: 'Désactivé',
  createdAt: new Date().toISOString()
});

/**
 * AccessController checks whether a specific role has permission to proceed
 */
export const AccessController = {
  hasRole(role: string | undefined, requiredRole: UserRole): boolean {
    if (!role) return false;
    if (requiredRole === 'candidate') return true;
    if (requiredRole === 'admin') {
      return role === 'admin' || role === 'super_admin';
    }
    if (requiredRole === 'super_admin') {
      return role === 'super_admin';
    }
    return false;
  }
};

/**
 * PermissionMiddleware intercepts express requests to validate session cookies
 * and verify role clearance.
 */
export function PermissionMiddleware(requiredRole: UserRole) {
  return (req: any, res: any, next: NextFunction) => {
    // Read the session cookie shana_sid (set in login flow)
    const userId = req.cookies && req.cookies.shana_sid;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Active session shana_sid cookie is missing." });
    }

    // Retrieve user from database
    let user = inMemoryUsers.get(userId);
    if (!user) {
      // Lazy seed standard registered candidates if they are not in-memory yet
      user = {
        id: userId,
        email: 'lazy_registered@shana.com',
        role: 'candidate',
        status: 'enabled',
        firstName: 'Candidate',
        lastName: 'Member',
        createdAt: new Date().toISOString()
      };
      inMemoryUsers.set(userId, user);
    }

    // Enforce suspension check
    if (user.status === 'disabled') {
      return res.status(403).json({ error: "Forbidden: Your account is suspended." });
    }

    // Evaluate clearance level
    const isCleared = AccessController.hasRole(user.role, requiredRole);
    if (!isCleared) {
      return res.status(403).json({ error: `Forbidden: Restricted area. Requires ${requiredRole} credentials.` });
    }

    // Append authorized user details to request object
    req.adminUser = user;
    next();
  };
}
