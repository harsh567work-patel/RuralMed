/**
 * whatsappService.js
 * One-way outgoing WhatsApp transactional alert via Twilio.
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_WHATSAPP_NUMBER   (e.g. +14155238886 – Twilio sandbox or your approved sender)
 */

import twilio from 'twilio';

// Lazily initialise the Twilio client so the module can be imported even
// before env vars are wired up (useful during unit testing / CI).
let _client = null;

function getClient() {
  if (!_client) {
    _client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return _client;
}

/**
 * Send a one-way WhatsApp prescription alert to a patient.
 *
 * The body is kept deliberately short and human-readable so it works
 * even when rendered as a plain-text SMS fallback inside WhatsApp.
 *
 * @param {string} patientPhone  - E.164 format, e.g. "+919876543210"
 * @param {string} patientName   - Patient's display name
 * @param {string} medsString    - Comma-separated medication summary, e.g. "Paracetamol 500mg OD x5"
 * @returns {Promise<void>}      - Always resolves; never rejects (errors are logged only)
 */
export async function sendWhatsAppPrescription(patientPhone, patientName, medsString) {
  const from = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886'}`;
  const to   = `whatsapp:${patientPhone}`;

  // Keep body concise for rural data-light conditions.
  const body = `RuralMed Rx for ${patientName}:\n${medsString}\nQueries? Contact your clinic.`;

  try {
    const message = await getClient().messages.create({ from, to, body });
    console.info(`[whatsappService] Message sent – SID: ${message.sid}`);
  } catch (err) {
    // Log exact failure without crashing the backend process.
    console.error(
      `[whatsappService] Failed to send WhatsApp to ${patientPhone}:`,
      err.message
    );
    // Resolve gracefully – callers must not await a rejection from this service.
  }
}
