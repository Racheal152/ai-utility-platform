const { sendNotification } = require('./notificationService');

const detectAnomaly = async (currentBillAmount, historicalAverage, userId) => {
    // If the new bill is 30% higher than the historical average, flag it.
    const thresholdMultiplier = 1.30;
    
    if (currentBillAmount > (historicalAverage * thresholdMultiplier)) {
        await sendNotification(
            userId, 
            `Anomaly Detected: Your recent bill of KES ${currentBillAmount} is significantly higher than your average of KES ${historicalAverage.toFixed(2)}.`,
            'sms'
        );
        return true;
    }
    return false;
};

module.exports = { detectAnomaly };
