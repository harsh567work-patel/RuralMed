/**
 * printerHelper.js
 * Web Bluetooth ESC/POS thermal printer utility.
 * Falls back to window.print() when Web Bluetooth is unavailable.
 *
 * Target BLE service UUID for generic thermal printers (commonly used on
 * cheap POS devices like GB03/CS519 etc.):
 *   000018f0-0000-1000-8000-00805f9b34fb  (custom serial-like TX characteristic)
 */

const PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
// Write characteristic UUID standard for that service
const PRINTER_CHAR_UUID    = '00002af1-0000-1000-8000-00805f9b34fb';

/**
 * Build an ESC/POS byte sequence for a simple text prescription.
 *
 * @param {Object} params
 * @param {string} params.patientName
 * @param {string} params.date          - e.g. "2026-09-06"
 * @param {string} params.medication    - e.g. "Paracetamol 500mg – 1 tab TDS x 5 days"
 * @returns {Uint8Array}
 */
async function buildEscPosData({ patientName, date, medication }) {
  // Dynamic import keeps the chunk out of the critical path for browsers
  // that never exercise this code path.
  const { default: EscPosEncoder } = await import('esc-pos-encoder');

  const encoder = new EscPosEncoder();

  const result = encoder
    .initialize()
    .align('center')
    .bold(true)
    .text('--- PRESCRIPTION ---')
    .newline()
    .bold(false)
    .align('left')
    .newline()
    .text(`Patient : ${patientName}`)
    .newline()
    .text(`Date    : ${date}`)
    .newline()
    .text(`Rx      : ${medication}`)
    .newline()
    .newline()
    .text('Signature: _______________')
    .newline()
    .newline()
    // Feed and cut
    .cut()
    .encode();

  return result;
}

/**
 * Attempt to print via Web Bluetooth.
 * Falls back to window.print() on any failure or when BT is unsupported.
 *
 * @param {Object} prescriptionData - { patientName, date, medication }
 */
export async function printPrescription(prescriptionData) {
  // ── Fallback: browser does not support Web Bluetooth ──────────────────────
  if (!navigator.bluetooth) {
    console.warn('[printerHelper] Web Bluetooth not supported – falling back to window.print()');
    window.print();
    return;
  }

  try {
    // 1. Discover a nearby Bluetooth device that exposes the printer service
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [PRINTER_SERVICE_UUID],
    });

    // 2. Connect GATT
    const server      = await device.gatt.connect();
    const service     = await server.getPrimaryService(PRINTER_SERVICE_UUID);
    const characteristic = await service.getCharacteristic(PRINTER_CHAR_UUID);

    // 3. Build ESC/POS payload
    const data = await buildEscPosData(prescriptionData);

    // 4. Write in 512-byte chunks (BLE MTU constraint on many cheap printers)
    const CHUNK = 512;
    for (let offset = 0; offset < data.byteLength; offset += CHUNK) {
      const slice = data.slice(offset, offset + CHUNK);
      await characteristic.writeValueWithoutResponse(slice);
    }

    console.info('[printerHelper] Print job sent successfully via Bluetooth.');
    device.gatt.disconnect();

  } catch (err) {
    // User cancelled the picker, or GATT connection failed, or characteristic
    // not found – gracefully degrade to the browser print dialog.
    console.error('[printerHelper] Bluetooth print failed:', err.message);
    console.warn('[printerHelper] Falling back to window.print()');
    window.print();
  }
}
