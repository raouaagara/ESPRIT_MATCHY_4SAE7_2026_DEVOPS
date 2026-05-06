export const environment = {
  production: false,
  // ✅ Passe par la Gateway (8080) et non le backend directement (8081)
  apiUrl: 'http://localhost:8080/api',
  wsUrl: 'http://localhost:8080/ws',
  recaptchaSiteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
  appName: 'Matchy',
  version: '1.0.0'
};