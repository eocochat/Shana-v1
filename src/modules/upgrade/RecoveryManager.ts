import { PurchaseFlowService, PurchaseTransaction, PaymentState } from '../../services/commerce/PurchaseFlowService';
import { StorageService } from '../../lib/storage';

export const RecoveryManager = {
  /**
   * Get all failed transactions for a candidate
   */
  getRecoverablePayments(userId: string): PurchaseTransaction[] {
    return PurchaseFlowService.getFailedTransactions(userId);
  },

  /**
   * Safe payment retry procedure
   * Takes a previously failed transaction, attempts payment again, and applies benefits upon success
   */
  retryFailedPayment(
    userId: string,
    failedTransactionId: string,
    paymentMethod: string,
    onStateChange: (state: PaymentState, error?: string) => void
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const failedTxs = this.getRecoverablePayments(userId);
      const failedTx = failedTxs.find(tx => tx.id === failedTransactionId);
      
      if (!failedTx) {
        reject(new Error("No matching recoverable transaction found."));
        return;
      }

      try {
        // Attempt a fresh secure checkout
        const updatedMonetization = await PurchaseFlowService.processPurchase(
          userId,
          failedTx.productId,
          paymentMethod,
          onStateChange
        );

        // If successful, remove it from failed logs
        PurchaseFlowService.clearFailedTransaction(userId, failedTransactionId);
        
        resolve(updatedMonetization);
      } catch (err) {
        reject(err);
      }
    });
  },

  /**
   * Permanently dismiss a failed transaction from the recovery log
   */
  dismissRecovery(userId: string, transactionId: string): void {
    PurchaseFlowService.clearFailedTransaction(userId, transactionId);
  }
};
