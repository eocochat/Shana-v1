import { IntegrationKeyManager } from './modules/key-vault/IntegrationKeyManager';

async function run() {
  const stripeKeyVal = "pk_live_51TPLCQLt8sxEdjdKc1R5W7ZUjcd8kcmJgYhtohFxz0Cso9hlmStuAqOjV9iNobR543ZWHfgKA9Q8tNdbCHZvLNqH00irBPd0WP";
  
  const rawKeys = IntegrationKeyManager.getRawKeysInternal();
  
  // 1. Production Stripe Key
  const prodKey = rawKeys.find(k => k.providerId === 'stripe' && k.environment === 'production' && !k.isDeleted);
  if (prodKey) {
    console.log("Stripe key found in production vault. Rotating...");
    IntegrationKeyManager.rotateKey(prodKey.id, stripeKeyVal, 'Admin Setup');
  } else {
    console.log("Stripe key not found in production vault. Creating...");
    IntegrationKeyManager.addKey('stripe', 'Stripe Publishable Key', stripeKeyVal, 'production', 'Admin Setup');
  }

  // 2. Development Stripe Key
  const devKey = rawKeys.find(k => k.providerId === 'stripe' && k.environment === 'development' && !k.isDeleted);
  if (devKey) {
    console.log("Stripe key found in development vault. Rotating...");
    IntegrationKeyManager.rotateKey(devKey.id, stripeKeyVal, 'Admin Setup');
  } else {
    console.log("Stripe key not found in development vault. Creating...");
    IntegrationKeyManager.addKey('stripe', 'Stripe Publishable Key', stripeKeyVal, 'development', 'Admin Setup');
  }

  console.log("Key configuration completed successfully!");
}

run().catch(err => {
  console.error("Error setting up Stripe key:", err);
});

