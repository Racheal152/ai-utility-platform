const sendNotification = async (userId, message, type = 'email') => {
    // Simulated notification service since integrating real SMS/Email is out of scope 
    // for this prototype.
    console.log(`\n========================================`);
    console.log(`🔔 [NOTIFICATION - ${type.toUpperCase()}]`);
    console.log(`To User ID: ${userId}`);
    console.log(`Message: ${message}`);
    console.log(`========================================\n`);
    
    return true;
};

module.exports = { sendNotification };
