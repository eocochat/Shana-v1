import { StorageService } from '../../lib/storage';

export interface CloudPurchaseBackup {
  id: string;
  productId: string;
  nameEN: string;
  nameFR: string;
  price: number;
  date: string;
  claimed: boolean;
}

export const RestorePurchaseService = {
  /**
   * Returns simulated cloud-side purchases associated with this email
   */
  getCloudBackups(email: string): CloudPurchaseBackup[] {
    const key = `shana_cloud_backups_${email.toLowerCase().trim()}`;
    let backups = localStorage.getItem(key);
    if (!backups) {
      // Seed a couple of historical mock purchases in the "cloud backup" for demonstration/testing
      const mockBackups: CloudPurchaseBackup[] = [
        {
          id: 'pur_cloud_101',
          productId: 'pack_starter',
          nameEN: 'Starter Pack (3 Audio Sessions)',
          nameFR: 'Pack Starter (3 Sessions Audio)',
          price: 3.99,
          date: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(), // 60 days ago
          claimed: false
        },
        {
          id: 'pur_cloud_102',
          productId: 'topup_1_mirror',
          nameEN: '+1 Mirror Session',
          nameFR: '+1 Session Miroir',
          price: 2.99,
          date: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), // 30 days ago
          claimed: false
        }
      ];
      localStorage.setItem(key, JSON.stringify(mockBackups));
      return mockBackups;
    }
    try {
      return JSON.parse(backups);
    } catch (e) {
      return [];
    }
  },

  /**
   * Save a backup record in the "cloud backup" database whenever a user makes a successful purchase
   */
  saveToCloudBackup(email: string, purchase: Omit<CloudPurchaseBackup, 'claimed'>): void {
    const key = `shana_cloud_backups_${email.toLowerCase().trim()}`;
    let backups = this.getCloudBackups(email);
    
    // Prevent duplicate entries in cloud
    if (backups.some(b => b.id === purchase.id)) return;
    
    backups.unshift({ ...purchase, claimed: true });
    localStorage.setItem(key, JSON.stringify(backups));
  },

  /**
   * Main Restore purchases procedure
   */
  restore(userId: string): Promise<{ restoredCount: number; activeUltra: boolean; monetization: any }> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = StorageService.getUser(userId);
        if (!user) {
          reject(new Error("No active user profile. Cannot restore purchases."));
          return;
        }

        const monetization = StorageService.getCandidateMonetization(userId);
        const cloudBackups = this.getCloudBackups(user.email);
        
        let restoredCount = 0;
        let activeUltra = monetization.ultraActive;

        // Process each backup item
        cloudBackups.forEach(backup => {
          // Check if already in the local purchases list to prevent duplicates
          const isAlreadyClaimed = monetization.purchases.some((p: any) => p.id === backup.id);
          
          if (!isAlreadyClaimed) {
            // Restore purchase record
            monetization.purchases.unshift({
              id: backup.id,
              productId: backup.productId,
              nameEN: backup.nameEN,
              nameFR: backup.nameFR,
              price: backup.price,
              date: backup.date
            });

            // Grant corresponding benefits based on product type
            if (backup.productId === 'pack_starter') {
              monetization.packAudio += 3;
            } else if (backup.productId === 'pack_premium') {
              monetization.packAudio += 5;
              monetization.packMirror += 1;
            } else if (backup.productId === 'sub_ultra') {
              monetization.ultraActive = true;
              activeUltra = true;
              
              const endsAt = new Date();
              endsAt.setDate(endsAt.getDate() + 30);
              monetization.ultraExpiresAt = endsAt.toISOString();
            } else if (backup.productId === 'topup_1_audio') {
              monetization.topUpAudio += 1;
            } else if (backup.productId === 'topup_3_audio') {
              monetization.topUpAudio += 3;
            } else if (backup.productId === 'topup_1_mirror') {
              monetization.topUpMirror += 1;
            }

            restoredCount++;
          }
        });

        if (restoredCount > 0) {
          StorageService.saveCandidateMonetization(userId, monetization);
          
          // Trigger notification
          const event = new CustomEvent('shana_notification', {
            detail: { trigger: 'restore completed', count: restoredCount }
          });
          window.dispatchEvent(event);
        }

        resolve({
          restoredCount,
          activeUltra,
          monetization
        });
      }, 1200); // Simulated delay
    });
  }
};
