const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../db');

/* =========================
   EMAIL TRANSPORTER SETUP
========================= */

// Use Gmail or SMTP (recommended for real apps)
// Use Gmail service with App Password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/* Optional: verify email connection on server start */
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email server error:', error.message);
    } else {
        console.log('✅ Email server ready to send messages');
    }
});

/* =========================
   JWT TOKEN GENERATOR
========================= */
const generateToken = (id, name, role) => {
    return jwt.sign(
        { id, name, role },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '30d' }
    );
};

/* =========================
   SEND OTP EMAIL
========================= */
const sendOTPEmail = async (email, otp, type = 'verify') => {
    try {
        const isReset = type === 'reset';
        const title = isReset ? "Password Reset Request" : "Welcome to AivaPay! 🚀";
        const subtitle = isReset 
            ? "We received a request to reset your AivaPay password. Use the verification code below to securely reset it."
            : "Thank you for joining AivaPay, your ultimate AI-powered household manager. Please use the verification code below to activate your account.";

        const message = {
            from: `"AivaPay Security" <${process.env.SMTP_USER}>`,
            to: email,
            subject: isReset ? "AivaPay - Password Reset Code" : "AivaPay - Your Account Verification Code",
            text: `Your AivaPay OTP is: ${otp}. It expires in 10 minutes.`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                    <div style="background-color: #7c3aed; padding: 30px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">AivaPay</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1e293b; font-size: 20px; margin-top: 0;">${title}</h2>
                        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                            ${subtitle}
                        </p>
                        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px;">
                            <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px;">Your Security Code</span>
                            <h1 style="color: #7c3aed; font-size: 42px; margin: 0; letter-spacing: 8px; font-family: monospace;">${otp}</h1>
                        </div>
                        <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">
                            This code will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email or contact support to secure your account.
                        </p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                            © ${new Date().getFullYear()} AivaPay Inc. All rights reserved.<br>
                            Secure, smart, and stress-free household management.
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(message);
        console.log('✅ OTP email sent to:', email);
        console.log('📧 Message ID:', info.messageId);

    } catch (error) {
        console.error('❌ EMAIL ERROR DETAIL:', error);
    }
};

/* =========================
   REGISTER USER
========================= */
const registerUser = async (req, res) => {
    const { name, email, password, phone } = req.body;

    // ── Validation ────────────────────────────────────────────
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (phone) {
        // Allow: 0712345678 (10 digits) or +254712345678 (13 chars)
        const cleaned = phone.replace(/\s+/g, '');
        const phoneRegex = /^(0\d{9}|\+254\d{9})$/;
        if (!phoneRegex.test(cleaned)) {
            return res.status(400).json({ message: 'Phone must be 10 digits (e.g. 0712345678) or international format (+254712345678).' });
        }
    }

    try {
        // Check if user exists
        const userExists = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60000);

        // Save user
        const result = await db.query(
            `INSERT INTO users 
            (name, email, password_hash, phone, otp_code, otp_expires, email_verified) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING id, email`,
            [name, email, hashedPassword, phone || null, otp, otpExpires, false]
        );

        // Debug logs (VERY IMPORTANT)
        console.log("📌 OTP generated:", otp);
        console.log("📌 Sending email to:", email);

        // Send email
        await sendOTPEmail(email, otp);

        res.status(201).json({
            message: 'Registration successful. Verify OTP sent to email.',
            email: result.rows[0].email,
            test_otp: otp // remove in production
        });

    } catch (err) {
        console.error('❌ Register error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/* =========================
   VERIFY OTP
 ========================= */
const verifyEmailOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const result = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        const user = result.rows[0];

        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.email_verified) return res.status(400).json({ message: 'Already verified' });

        console.log("🔍 Verification attempt for:", email);
        console.log("🔍 Provided OTP:", otp, `(Type: ${typeof otp})`);
        console.log("🔍 Stored OTP:", user.otp_code, `(Type: ${typeof user.otp_code})`);

        if (user.otp_code != otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (new Date() > new Date(user.otp_expires))
            return res.status(400).json({ message: 'OTP expired' });

        await db.query(
            `UPDATE users 
             SET email_verified = true, otp_code = NULL, otp_expires = NULL 
             WHERE id = $1`,
            [user.id]
        );

        res.json({
            message: 'Email verified successfully',
            token: generateToken(user.id, user.name, user.role),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/* =========================
   LOGIN
 ========================= */
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.email_verified) {
            return res.status(403).json({ message: 'Please verify your email first' });
        }

        // ── Account status checks ──────────────────────────────────────────
        const status = user.status || 'active';

        if (status === 'suspended') {
            return res.status(403).json({
                message: 'Your account has been suspended. Please contact support for assistance.',
                status: 'suspended'
            });
        }

        if (status === 'deleted') {
            return res.status(403).json({
                message: 'This account has been deactivated. Please contact support if you believe this is a mistake.',
                status: 'deleted'
            });
        }

        if (status === 'restricted') {
            return res.status(403).json({
                message: 'Your account access has been restricted. Please contact support for more information.',
                status: 'restricted'
            });
        }
        // ──────────────────────────────────────────────────────────────────

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id, user.name, user.role)
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/* =========================
   FORGOT PASSWORD
 ========================= */
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const result = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        const user = result.rows[0];
        if (!user) return res.status(404).json({ message: 'User not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60000);

        await db.query(
            'UPDATE users SET otp_code = $1, otp_expires = $2 WHERE id = $3',
            [otp, otpExpires, user.id]
        );

        await sendOTPEmail(email, otp, 'reset');

        res.json({ message: 'OTP sent to email', test_otp: otp });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/* =========================
   RESET PASSWORD
 ========================= */
const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        const result = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        const user = result.rows[0];
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.otp_code !== otp)
            return res.status(400).json({ message: 'Invalid OTP' });

        if (new Date() > new Date(user.otp_expires))
            return res.status(400).json({ message: 'OTP expired' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query(
            `UPDATE users 
             SET password_hash = $1, otp_code = NULL, otp_expires = NULL 
             WHERE id = $2`,
            [hashedPassword, user.id]
        );

        res.json({ message: 'Password reset successful' });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    verifyEmailOTP,
    forgotPassword,
    resetPassword,
    sendOTPEmail
};