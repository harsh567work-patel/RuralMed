/**
 * smsService.js
 * Standard 2-way SMS reminder for patients without WhatsApp (feature phones).
 * Reuses the shared Twilio SDK already installed for whatsappService.
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_SMS_NUMBER   (your Twilio purchased SMS-capable number, e.g. "+12025551234")
 */

import twilio from 'twilio';

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
 * Send a <160-character follow-up SMS reminder.
 *
 * Template (strict):
 *   "Reminder: Your follow-up at [Clinic] is on [Date]. Please bring your previous records."
 *
 * Max realistic lengths:
 *   Fixed text : 72 chars
 *   [Clinic]   : ≤40 chars  (enforced by truncation below)
 *   [Date]     : ≤16 chars  (e.g. "06 Sep 2026 10am")
 *   Total cap  : 128 chars  → safely under 160.
 *
 * @param {string} patientPhone  - E.164 format, e.g. "+919876543210"
 * @param {string} clinicName    - Name of the clinic / health sub-centre
 * @param {string} date          - Human-readable appointment date/time string
 * @returns {Promise<void>}      - Always resolves; never rejects
 */
export async function sendSMSReminder(patientPhone, clinicName, date) {
  // Hard-truncate inputs to guarantee the final message stays under 160 chars.
  const clinic = clinicName.slice(0, 40).trim();
  const apptDate = date.slice(0, 16).trim();

  const body =
    `Reminder: Your follow-up at ${clinic} is on ${apptDate}. Please bring your previous records.`;

  // Safety assertion — should never fire given the constraints above.
  if (body.length > 160) {
    console.warn(
      `[smsService] Message length ${body.length} exceeds 160 chars. Truncating.`
    );
  }

  try {
    const message = await getClient().messages.create({
      from: process.env.TWILIO_SMS_NUMBER,
      to: patientPhone,
      body,
    });
    console.info(`[smsService] SMS sent – SID: ${message.sid}`);
  } catch (err) {
    console.error(
      `[smsService] Failed to send SMS to ${patientPhone}:`,
      err.message
    );
    // Resolve gracefully – callers must not await a rejection from this service.
  }
}
