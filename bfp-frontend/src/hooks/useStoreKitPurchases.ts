/**
 * StoreKit In-App Purchases Hook for iOS
 * Uses @capgo/native-purchases for StoreKit 2 integration
 *
 * PRODUCTION-GRADE:
 * - Sends JWS (jwsRepresentation) to backend for cryptographic verification
 * - Backend validates against Apple's certificate chain
 * - Uses Apple's real expiration dates, not guessed TTLs
 */
import { useCallback, useState, useEffect } from 'react';
import { isNativePlatform, getApiBaseUrl } from '@/lib/platform';

// Product ID - must match App Store Connect
const MONTHLY_SUBSCRIPTION_ID = 'com.bassclarity.app.pro.monthly';

interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  jws?: string;  // StoreKit 2 signed transaction for server verification
  error?: string;
}

interface ActivationResult {
  success: boolean;
  is_member?: boolean;
  expires_at?: string;
  error?: string;
}

export function useStoreKitPurchases() {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceString, setPriceString] = useState<string | null>(null);

  // Initialize and fetch products
  useEffect(() => {
    if (!isNativePlatform()) {
      setIsLoading(false);
      return;
    }

    const loadProducts = async () => {
      try {
        const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');

        const result = await NativePurchases.getProducts({
          productIdentifiers: [MONTHLY_SUBSCRIPTION_ID],
          productType: PURCHASE_TYPE.SUBS,
        });

        if (result.products && result.products.length > 0) {
          const product = result.products[0];
          // priceString is the localized formatted price (e.g., "$9.99")
          setPriceString(product.priceString || `$${product.price}`);
        }
      } catch (err) {
        console.error('[StoreKit] Failed to load products:', err);
        setError('Failed to load subscription options');
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Purchase subscription - returns JWS for server verification
  const purchaseSubscription = useCallback(async (): Promise<PurchaseResult> => {
    if (!isNativePlatform()) {
      return { success: false, error: 'Not on native platform' };
    }

    setIsPurchasing(true);
    setError(null);

    try {
      const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');

      const result = await NativePurchases.purchaseProduct({
        productIdentifier: MONTHLY_SUBSCRIPTION_ID,
        productType: PURCHASE_TYPE.SUBS,
        quantity: 1,
      });

      console.log('[StoreKit] Purchase successful');

      // Extract transaction info including JWS for server verification
      const transactionId = result.transactionId || '';
      const jws = (result as any).jwsRepresentation || '';

      if (!jws) {
        console.warn('[StoreKit] No JWS returned - server verification may fail');
      }

      return {
        success: true,
        transactionId,
        jws,
      };
    } catch (err: any) {
      console.error('[StoreKit] Purchase failed:', err);

      let errorMessage = 'Purchase failed';
      if (err.message?.toLowerCase().includes('cancel')) {
        errorMessage = 'Purchase cancelled';
      } else if (err.message?.toLowerCase().includes('billing')) {
        errorMessage = 'Billing not available';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  // Restore purchases (required by Apple)
  // PRODUCTION-GRADE: Uses getPurchases() API to retrieve transactions with JWS for server verification
  const restorePurchases = useCallback(async (): Promise<{
    success: boolean;
    transactions?: Array<{ transactionId: string; jws: string; isActive: boolean }>;
    error?: string;
  }> => {
    if (!isNativePlatform()) {
      return { success: false, error: 'Not on native platform' };
    }

    setIsPurchasing(true);
    setError(null);

    try {
      const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');

      // Step 1: Restore purchases - syncs with Apple's servers
      await NativePurchases.restorePurchases();
      console.log('[StoreKit] Restore synced with Apple');

      // Step 2: Get all purchases using the dedicated getPurchases() API
      // This returns Transaction[] with jwsRepresentation for server verification
      const { purchases } = await NativePurchases.getPurchases({
        productType: PURCHASE_TYPE.SUBS,
      });

      console.log(`[StoreKit] getPurchases returned ${purchases.length} transactions`);

      // Filter for our product and extract JWS
      const activeTransactions: Array<{ transactionId: string; jws: string; isActive: boolean }> = [];

      for (const tx of purchases) {
        // Only include transactions for our product that have JWS
        if (tx.productIdentifier === MONTHLY_SUBSCRIPTION_ID && tx.jwsRepresentation) {
          activeTransactions.push({
            transactionId: tx.transactionId,
            jws: tx.jwsRepresentation,
            isActive: tx.isActive ?? false,
          });
          console.log(`[StoreKit] Found transaction: ${tx.transactionId}, isActive=${tx.isActive}`);
        }
      }

      console.log(`[StoreKit] Restore completed, found ${activeTransactions.length} matching transactions`);

      return {
        success: true,
        transactions: activeTransactions,
      };
    } catch (err: any) {
      console.error('[StoreKit] Restore failed:', err);
      const errorMessage = err.message || 'Failed to restore purchases';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  // Activate Pro on backend with JWS verification
  const activateProOnBackend = useCallback(async (
    email: string,
    transactionId: string,
    jws: string,
    userId?: string
  ): Promise<ActivationResult> => {
    if (!jws) {
      console.error('[StoreKit] No JWS provided for backend activation');
      return { success: false, error: 'Missing transaction proof' };
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/mobile-auth/activate-storekit-purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          user_id: userId,
          transaction_id: transactionId,
          product_id: MONTHLY_SUBSCRIPTION_ID,
          jws,  // Send JWS for cryptographic verification
        }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          is_member: data.is_member,
          expires_at: data.expires_at,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Activation failed',
        };
      }
    } catch (err) {
      console.error('[StoreKit] Backend activation failed:', err);
      return { success: false, error: 'Network error during activation' };
    }
  }, []);

  return {
    priceString,
    isLoading,
    isPurchasing,
    error,
    purchaseSubscription,
    restorePurchases,
    activateProOnBackend,
    monthlyProductId: MONTHLY_SUBSCRIPTION_ID,
  };
}
