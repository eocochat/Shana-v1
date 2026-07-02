import { StorageService } from '../../lib/storage';

export interface FrozenCredits {
  freeAudio: number;
  packAudio: number;
  topUpAudio: number;
  freeMirror: number;
  packMirror: number;
  topUpMirror: number;
}

export const UpgradeEngine = {
  /**
   * Transition Premium/Starter to Ultra subscription
   * Activates unlimited and freezes existing credits
   */
  upgradeToUltra(userId: string): any {
    const monetization = StorageService.getCandidateMonetization(userId);
    
    // Check if already has Ultra
    if (monetization.ultraActive) {
      return monetization;
    }

    // Freeze current credits before setting them to 0 (so we preserve them for when Ultra ends)
    const frozen: FrozenCredits = {
      freeAudio: monetization.freeAudio || 0,
      packAudio: monetization.packAudio || 0,
      topUpAudio: monetization.topUpAudio || 0,
      freeMirror: monetization.freeMirror || 0,
      packMirror: monetization.packMirror || 0,
      topUpMirror: monetization.topUpMirror || 0,
    };

    monetization.frozenCredits = frozen;

    // Zero out active credits (Ultra is unlimited)
    monetization.freeAudio = 0;
    monetization.packAudio = 0;
    monetization.topUpAudio = 0;
    monetization.freeMirror = 0;
    monetization.packMirror = 0;
    monetization.topUpMirror = 0;

    // Activate Ultra
    monetization.ultraActive = true;
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 30); // 30 days duration
    monetization.ultraExpiresAt = endsAt.toISOString();
    monetization.ultraRenewalCancelled = false; // By default auto-renews

    // Log the transaction
    const date = new Date().toISOString();
    const purchaseId = 'pur_ultra_' + Math.random().toString(36).substring(3, 11);
    
    monetization.purchases.unshift({
      id: purchaseId,
      productId: 'sub_ultra',
      nameEN: 'Ultra Unlimited (Credits Frozen & Saved)',
      nameFR: 'Ultra Illimité (Crédits gelés & préservés)',
      price: 39.99,
      date
    });

    StorageService.saveCandidateMonetization(userId, monetization);
    
    // Trigger notification
    const event = new CustomEvent('shana_notification', {
      detail: { trigger: 'Ultra activated', userId }
    });
    window.dispatchEvent(event);

    return monetization;
  },

  /**
   * Downgrades Ultra to inactive, unfreezing previous credits
   */
  downgradeFromUltra(userId: string): any {
    const monetization = StorageService.getCandidateMonetization(userId);
    
    if (!monetization.ultraActive) {
      return monetization;
    }

    // Unfreeze credits
    if (monetization.frozenCredits) {
      const frozen = monetization.frozenCredits;
      monetization.freeAudio = frozen.freeAudio;
      monetization.packAudio = frozen.packAudio;
      monetization.topUpAudio = frozen.topUpAudio;
      monetization.freeMirror = frozen.freeMirror;
      monetization.packMirror = frozen.packMirror;
      monetization.topUpMirror = frozen.topUpMirror;
      
      monetization.frozenCredits = null;
    } else {
      // Recovery fallback if no frozen credits exist
      monetization.freeAudio = 2;
    }

    monetization.ultraActive = false;
    monetization.ultraExpiresAt = null;
    monetization.ultraRenewalCancelled = false;

    StorageService.saveCandidateMonetization(userId, monetization);
    
    const event = new CustomEvent('shana_notification', {
      detail: { trigger: 'Ultra ending soon', status: 'expired' }
    });
    window.dispatchEvent(event);

    return monetization;
  },

  /**
   * Starter to Premium upgrade
   * Keep remaining sessions and add Premium benefits
   */
  upgradeStarterToPremium(userId: string): any {
    const monetization = StorageService.getCandidateMonetization(userId);
    
    // Add Premium sessions (+5 Audio, +1 Mirror) immediately, keeping any previous credits
    monetization.packAudio += 5;
    monetization.packMirror += 1;

    // Log purchase
    const date = new Date().toISOString();
    const purchaseId = 'pur_upg_' + Math.random().toString(36).substring(3, 11);
    
    monetization.purchases.unshift({
      id: purchaseId,
      productId: 'pack_premium',
      nameEN: 'Premium Pack Upgrade (+5 Audio + 1 Mirror)',
      nameFR: 'Mise à niveau Pack Premium (+5 Audio + 1 Miroir)',
      price: 7.99,
      date
    });

    StorageService.saveCandidateMonetization(userId, monetization);
    
    const event = new CustomEvent('shana_notification', {
      detail: { trigger: 'purchase success', productId: 'pack_premium' }
    });
    window.dispatchEvent(event);

    return monetization;
  }
};
