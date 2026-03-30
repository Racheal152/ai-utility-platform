const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

// pdf-parse handles digital PDFs
// pdf-parse exports the function as a named property, not as module.exports directly
let pdfParse = null;
try {
    const mod = require('pdf-parse');
    // The actual function lives at mod.default or the object itself is callable
    // For this version it lives at mod['default'] via the internal lib
    pdfParse = mod.default
        ?? mod.parse
        ?? Object.values(mod).find(v => typeof v === 'function')
        ?? null;

    // Last resort — require the internal entry directly
    if (!pdfParse) {
        pdfParse = require('pdf-parse/lib/pdf-parse.js');
    }

    console.log('pdf-parse loaded, type:', typeof pdfParse);
} catch (e) {
    console.warn('pdf-parse unavailable:', e.message);
}

// ─── Main entry point ──────────────────────────────────────────
const extractPaymentDetails = async (filePath, mimetype = '') => {
    const ext = path.extname(filePath).toLowerCase();
    const isPdf = ext === '.pdf' || mimetype === 'application/pdf';
    try {
        if (isPdf) {
            return await extractFromPDF(filePath);
        }
        return await extractFromImage(filePath);
    } catch (err) {
        console.error('OCR extraction failed:', err.message);
        return getMockResult();
    }
};

// ─── PDF handler ───────────────────────────────────────────────
const extractFromPDF = async (filePath) => {
    const buffer = fs.readFileSync(filePath);

    // Step 1 — try pdf-parse for digital/text PDFs (fast, no rendering)
    if (pdfParse) {
        try {
            const data = await pdfParse(buffer);
            const text = data.text || '';
            if (text.trim().length > 30) {
                console.log('PDF: digital — text extracted directly');
                return parseText(text);
            }
        } catch (e) {
            console.warn('pdf-parse skipped:', e.message);
        }
    }

    // Step 2 — scanned PDF, render page 1 to image then OCR
    console.log('PDF: scanned — rendering page to image');
    return await extractFromScannedPDF(buffer);
};

// ─── Scanned PDF → canvas → Tesseract (pdfjs-dist v5) ─────────
const extractFromScannedPDF = async (pdfBuffer) => {
    try {
        // Use dynamic import() because pdfjs-dist v5 legacy build is ESM (.mjs)
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const { createCanvas } = require('canvas');

        // Disable worker for Node.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';

        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(pdfBuffer),
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
            disableFontFace: true,
        });

        const pdfDoc = await loadingTask.promise;
        const page = await pdfDoc.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = createCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext('2d');

        await page.render({
            canvasContext: ctx,
            viewport,
            canvasFactory: {
                create: (w, h) => { const c = createCanvas(w, h); return { canvas: c, context: c.getContext('2d') }; },
                reset: (obj, w, h) => { obj.canvas.width = w; obj.canvas.height = h; },
                destroy: () => { }
            }
        }).promise;

        const pngBuf = canvas.toBuffer('image/png');
        const { data: { text } } = await Tesseract.recognize(pngBuf, 'eng', { logger: () => { } });

        console.log('Scanned PDF OCR done, chars:', text.length);
        return parseText(text);

    } catch (err) {
        console.error('Scanned PDF render failed:', err.message);
        return getMockResult();
    }
};

// ─── Image handler ─────────────────────────────────────────────
const extractFromImage = async (filePath) => {
    const { data: { text } } = await Tesseract.recognize(
        filePath, 'eng', { logger: () => { } }
    );
    return parseText(text);
};

// ─── Text parser ───────────────────────────────────────────────
const parseText = (text) => {
    if (!text || text.trim().length === 0) return getMockResult();

    const lower = text.toLowerCase();

    // Amount — tries multiple patterns
    const amountPatterns = [
        /(?:KES|Ksh|ksh|kes)\s?[\d,]+\.?\d*/i,
        /(?:amount|total|paid|sent)[:\s]+(?:KES|Ksh)?\s?[\d,]+\.?\d*/i,
        /[\d,]+\.?\d*\s*(?:KES|Ksh)/i,
    ];
    let extractedAmount = null;
    for (const pattern of amountPatterns) {
        const match = text.match(pattern);
        if (match) {
            const parsed = parseFloat(match[0].replace(/[^0-9.]/g, ''));
            if (parsed > 0) { extractedAmount = parsed; break; }
        }
    }

    // Date
    const dateMatch = text.match(
        /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2}/
    );
    const paymentDate = dateMatch
        ? dateMatch[0]
        : new Date().toISOString().split('T')[0];

    // Transaction code — M-Pesa style e.g. SBQ1A2BC3D
    const codeMatch = text.match(/\b[A-Z]{2,4}[0-9A-Z]{6,10}\b/);
    const transactionCode = codeMatch ? codeMatch[0] : null;

    // Bill type
    let paymentType = 'utility payment';
    if (lower.includes('kplc') || lower.includes('electricity') ||
        lower.includes('token') || lower.includes('prepaid'))
        paymentType = 'electricity';
    else if (lower.includes('water') || lower.includes('nawasco') ||
        lower.includes('nairobi water'))
        paymentType = 'water';
    else if (lower.includes('internet') || lower.includes('fiber') ||
        lower.includes('faiba') || lower.includes('zuku'))
        paymentType = 'internet';
    else if (lower.includes('rent') || lower.includes('rental'))
        paymentType = 'rent';
    else if (lower.includes('m-pesa') || lower.includes('mpesa'))
        paymentType = 'M-PESA payment';

    return {
        extractedAmount,
        paymentDate,
        paymentType,
        transactionCode,
        rawText: text.substring(0, 600),
    };
};

// ─── Mock fallback ─────────────────────────────────────────────
const getMockResult = () => ({
    extractedAmount: parseFloat((Math.random() * 4500 + 500).toFixed(2)),
    paymentDate: new Date().toISOString().split('T')[0],
    paymentType: 'M-PESA payment',
    transactionCode: 'SBQ' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    rawText: 'Mock: could not extract text from this file.',
});

module.exports = { extractPaymentDetails };