const extractPaymentDetails = async (filePath) => {
    // In a production scenario, we would use Tesseract.js here:
    // const Tesseract = require('tesseract.js');
    // const result = await Tesseract.recognize(filePath, 'eng');
    // const text = result.data.text;
    
    // Since this is MVP and real gateways/API keys are unavailable,
    // we mock the OCR extraction latency and parsed data.
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                extractedAmount: (Math.random() * (5000 - 500) + 500).toFixed(2),
                paymentDate: new Date().toISOString().split('T')[0],
                paymentType: 'M-PESA Utility Payment Confirmed',
                rawText: 'OBU789234 Confirmed. You have sent Ksh 2,500.00 to KPLC PREPAID on 25/3/26.'
            });
        }, 1500);
    });
};

module.exports = { extractPaymentDetails };
