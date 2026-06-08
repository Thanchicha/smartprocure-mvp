/**
 * features/hardware-sync.js — SmartProcure Future Phase
 * Phase 5: Cross-System Integration Layer
 * Hardware Scan + Cloud Database Sync (Cold Storage Verification)
 * 
 * STATUS: Skeleton / Commented out in index.html
 * This file is NOT active in MVP. Uncomment the <script> tag in index.html to enable.
 */

const CLOUD_ENDPOINT = 'https://api.pakarang-supply.com/smartprocure/preorder'; // Future

/**
 * Sends pre-order payload to cloud database after CSV export.
 * Future: Called automatically after exportToCSV() in dashboard.js.
 * 
 * @param {Object} payload - Pre-order data object
 * @param {Array}  payload.items    - Recommended order items
 * @param {string} payload.hotelId  - Hotel unique identifier
 * @param {string} payload.mealDate - ISO date string
 * @param {string} payload.meal     - 'breakfast' | 'lunch' | 'dinner'
 */
async function sendPayloadToCloud(payload) {
  console.log('[HARDWARE-SYNC] Sending pre-order payload to Cloud DB...');
  console.log('[HARDWARE-SYNC] Payload:', JSON.stringify(payload, null, 2));
  console.log('[HARDWARE-SYNC] Target endpoint:', CLOUD_ENDPOINT);

  // TODO Phase 5: Replace with actual fetch POST
  // const response = await fetch(CLOUD_ENDPOINT, {
  //   method:  'POST',
  //   headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getAuthToken() },
  //   body:    JSON.stringify(payload),
  // });
  // const result = await response.json();
  // console.log('[HARDWARE-SYNC] Cloud sync result:', result);

  // Simulated success response
  const mockResult = { success: true, orderId: 'ORD-' + Date.now(), synced_at: new Date().toISOString() };
  console.log('[HARDWARE-SYNC] Cloud sync result (mock):', mockResult);
  return mockResult;
}

/**
 * Receives hardware scan input (QR code + weight sensor) from warehouse device.
 * Future: WebSocket or polling from warehouse IoT scanner.
 * 
 * @param {Object} scanData - Data from hardware scan
 * @param {string} scanData.qrCode     - Scanned QR code value
 * @param {number} scanData.weightKg   - Actual weight from scale sensor
 * @param {string} scanData.scannedAt  - ISO timestamp
 */
function receiveHardwareScanInput(scanData) {
  console.log('[HARDWARE-SYNC] Hardware scan input received:');
  console.log('[HARDWARE-SYNC]   QR Code:', scanData.qrCode);
  console.log('[HARDWARE-SYNC]   Weight (actual):', scanData.weightKg, 'kg');
  console.log('[HARDWARE-SYNC]   Scanned at:', scanData.scannedAt);

  // TODO Phase 5: Fetch the matched order from cloud DB and call verifySpecsMatch()
}

/**
 * Verifies if actual delivered weight matches the ordered specs.
 * 
 * @param {number} orderedKg - Amount from pre-order
 * @param {number} actualKg  - Amount from hardware scan
 * @param {number} [tolerance=0.1] - Allowed deviation (10%)
 * @returns {{ match: boolean, deviation: number, status: 'SUCCESS' | 'WARNING' }}
 */
function verifySpecsMatch(orderedKg, actualKg, tolerance = 0.1) {
  const deviation   = Math.abs(actualKg - orderedKg) / orderedKg;
  const match       = deviation <= tolerance;
  const status      = match ? 'SUCCESS' : 'WARNING';

  console.log(`[HARDWARE-SYNC] Specs check — Ordered: ${orderedKg}kg | Actual: ${actualKg}kg | Deviation: ${(deviation * 100).toFixed(1)}%`);
  console.log(`[HARDWARE-SYNC] Result: ${status}`);

  // TODO Phase 5: Trigger outputStatusSuccess() or outputStatusWarning()
  if (match) {
    outputStatusSuccess({ orderedKg, actualKg, deviation });
  } else {
    outputStatusWarning({ orderedKg, actualKg, deviation });
  }

  return { match, deviation, status };
}

/** Future: Updates cloud DB and renders success state on warehouse device */
function outputStatusSuccess(data) {
  console.log('[HARDWARE-SYNC] ✅ OUTPUT: Status SUCCESS — Stock accepted. Updating central DB...');
  console.log('[HARDWARE-SYNC] Data:', data);
  // TODO: POST to cloud DB with status='received_verified'
}

/** Future: Alerts warehouse staff of weight discrepancy */
function outputStatusWarning(data) {
  console.log('[HARDWARE-SYNC] ⚠️ OUTPUT: Status WARNING — Weight mismatch! Alert sent to staff.');
  console.log('[HARDWARE-SYNC] Data:', data);
  // TODO: POST to cloud DB with status='discrepancy' and trigger alert
}

/**
 * Initializes a WebSocket connection to receive real-time hardware events.
 * Future: Replace with actual WSS endpoint from warehouse IoT system.
 */
function initHardwareWebSocket() {
  console.log('[HARDWARE-SYNC] initHardwareWebSocket() — TODO: Connect to wss://iot.pakarang-supply.com/scanner');
  // const ws = new WebSocket('wss://iot.pakarang-supply.com/scanner');
  // ws.onmessage = (event) => receiveHardwareScanInput(JSON.parse(event.data));
  // ws.onerror   = (err) => console.error('[HARDWARE-SYNC] WebSocket error:', err);
}
