import { StorageService } from '../../lib/storage';

export type PaymentState = 'pending' | 'processing' | 'failed' | 'completed';

export interface PurchaseTransaction {
  id: string;
  productId: string;
  state: PaymentState;
  amount: number;
  paymentMethod: string;
  errorDetails?: string;
  createdAt: string;
}

export const PurchaseFlowService = {
  // Simulate payment processing
  processPurchase(
    userId: string,
    productId: string,
    paymentMethod: string,
    onStateChange: (state: PaymentState, error?: string) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // 1. Initial pending state
      onStateChange('pending');
      
      setTimeout(() => {
        // 2. Transition to processing
        onStateChange('processing');
        
        setTimeout(() => {
          // Simulation of success rate (say 90% success, 10% failed for simulation of recovery)
          // Unless the card ends in 4444 or has a specific identifier for forced failures
          const isFailedSim = paymentMethod === 'card_failed_sim';
          
          if (isFailedSim) {
            const errorMsg = "Card declined. Insufficient funds or invalid security parameters.";
            onStateChange('failed', errorMsg);
            
            // Log failed transaction in history to allow recovery later
            this.logFailedTransaction(userId, productId, paymentMethod, errorMsg);
            
            // Dispatch failed notification
            this.dispatchNotification('payment failed', { productId, error: errorMsg });
            
            reject(new Error(errorMsg));
            return;
          }
          
          try {
            // Apply upgrade engine logic or basic purchase credits
            let updatedMonetization;
            
            if (productId === 'sub_ultra') {
              // Trigger UpgradeEngine to freeze credits if necessary and activate Ultra
              const { UpgradeEngine } = require('../../modules/upgrade/UpgradeEngine');
              updatedMonetization = UpgradeEngine.upgradeToUltra(userId);
              this.dispatchNotification('Ultra activated', { userId });
            } else {
              // Basic product additions
              updatedMonetization = StorageService.addCandidatePurchase(userId, productId);
            }
            
            onStateChange('completed');
            this.dispatchNotification('purchase success', { productId });
            
            resolve(updatedMonetization);
          } catch (err: any) {
            onStateChange('failed', err.message);
            reject(err);
          }
        }, 1500); // 1.5s simulation of processing gateway
      }, 500); // 0.5s pending
    });
  },

  logFailedTransaction(userId: string, productId: string, paymentMethod: string, error: string): void {
    const key = `shana_failed_payments_${userId}`;
    let existing: PurchaseTransaction[] = [];
    try {
      existing = JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {}
    
    const newFailed: PurchaseTransaction = {
      id: 'tx_failed_' + Math.random().toString(36).substring(3, 11),
      productId,
      state: 'failed',
      amount: this.getProductPrice(productId),
      paymentMethod,
      errorDetails: error,
      createdAt: new Date().toISOString()
    };
    
    existing.unshift(newFailed);
    localStorage.setItem(key, JSON.stringify(existing));
    
    // Trigger global storage update event
    window.dispatchEvent(new Event('shana_failed_payments_updated'));
  },

  getFailedTransactions(userId: string): PurchaseTransaction[] {
    const key = `shana_failed_payments_${userId}`;
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      return [];
    }
  },

  clearFailedTransaction(userId: string, transactionId: string): void {
    const key = `shana_failed_payments_${userId}`;
    try {
      const existing: PurchaseTransaction[] = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = existing.filter(tx => tx.id !== transactionId);
      localStorage.setItem(key, JSON.stringify(filtered));
      window.dispatchEvent(new Event('shana_failed_payments_updated'));
    } catch (e) {}
  },

  getProductPrice(productId: string): number {
    switch (productId) {
      case 'pack_starter': return 3.99;
      case 'pack_premium': return 7.99;
      case 'sub_ultra': return 39.99;
      case 'topup_1_audio': return 1.49;
      case 'topup_3_audio': return 3.49;
      case 'topup_1_mirror': return 2.99;
      default: return 0;
    }
  },

  // Dispatches simple custom browser events that can be captured by Notification centers or toast views
  dispatchNotification(trigger: string, extra: any = {}): void {
    const event = new CustomEvent('shana_notification', {
      detail: { trigger, ...extra }
    });
    window.dispatchEvent(event);
  }
};
