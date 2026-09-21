/**
 * prescriptionController.js
 * Routing logic for post-sync communication dispatch.
 *
 * This controller is called AFTER a prescription record has been persisted
 * to the backend (i.e., after the local SQLite record syncs to the server).
 *
 * `patient.hasSmartphone` is expected in the request body for now.
 * A DB column / migration for this field is out of scope for this step.
 */

import { sendWhatsAppPrescription } from '../services/whatsappService.js';
import { sendSMSReminder }          from '../services/smsService.js';

/**
 * Dispatch a post-prescription communication to the patient.
 *
 * Expected req.body shape:
 * {
 *   patient: {
 *     phone:          string,  // E.164, e.g. "+919876543210"
 *     name:           string,
 *     hasSmartphone:  boolean, // passed from client for now (no DB column yet)
 *   },
 *   medsString: string,        // human-readable medication summary
 *   clinicName: string,
 *   followUpDate: string,      // e.g. "06 Sep 2026"
 * }
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export async function dispatchPrescriptionAlert(req, res) {
  const { patient, medsString, clinicName, followUpDate } = req.body;

  if (!patient?.phone || !patient?.name) {
    return res.status(400).json({ error: 'patient.phone and patient.name are required.' });
  }

  // ── Smart-phone routing ───────────────────────────────────────────────────
  if (patient.hasSmartphone) {
    // WhatsApp: rich, no extra charge for message length beyond 160 chars.
    await sendWhatsAppPrescription(patient.phone, patient.name, medsString);
  } else {
    // SMS fallback: strict <160-char template for feature phones.
    await sendSMSReminder(patient.phone, clinicName, followUpDate);
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Both service functions resolve gracefully even on Twilio errors,
  // so we always return 200 here. Actual delivery errors are in server logs.
  return res.json({ message: 'Communication dispatch attempted.' });
}
