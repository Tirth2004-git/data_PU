const nodemailer = require('nodemailer');

// In-memory rate limiting and de-duplication state
let emailCountThisHour = 0;
let currentHourWindow = Math.floor(Date.now() / 3600000);
const summaryQueue = [];
let summaryTimer = null;

/**
 * Format date in Indian Standard Time (IST)
 */
const formatIST = (date = new Date()) => {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(date);
};

/**
 * Create Nodemailer transporter using Gmail SMTP
 */
const createTransporter = () => {
  const user = process.env.ALERT_EMAIL_FROM;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, ''), // Strip spaces if pasted with spaces from Google
    },
  });
};

/**
 * Check and advance the 1-hour window
 */
const checkHourWindow = async () => {
  const nowHour = Math.floor(Date.now() / 3600000);
  if (nowHour > currentHourWindow) {
    // Hour rolled over: if any queued alerts exist, send the summary email
    if (summaryQueue.length > 0) {
      await sendHourlySummary();
    }
    currentHourWindow = nowHour;
    emailCountThisHour = 0;
  }
};

/**
 * Send consolidated hourly summary if alert volume exceeded threshold
 */
const sendHourlySummary = async () => {
  const recipient = process.env.ALERT_EMAIL_TO || 'ozatirth52@gmail.com';
  const transporter = createTransporter();

  if (!transporter || summaryQueue.length === 0) {
    summaryQueue.length = 0;
    return;
  }

  const count = summaryQueue.length;
  const timestamp = formatIST();
  const subject = `🔒 Campus Compass — Hourly Security Summary (${count} failed PIN attempts)`;

  const textBody = `Campus Compass Security Summary
Time: ${timestamp}
Total Suppressed PIN Alerts in the Past Hour: ${count}

Recent Events:
${summaryQueue
  .slice(-10)
  .map(
    (item, idx) =>
      `#${idx + 1}: IP: ${item.ip} | Attempts: ${item.attemptsSoFar} | Locked: ${
        item.locked
      } | UA: ${item.userAgent} | Time: ${item.time}`
  )
  .join('\n')}

This is an automated hourly security summary. Individual alert notifications were throttled to prevent inbox flooding.`;

  try {
    await transporter.sendMail({
      from: `"Campus Compass Security" <${process.env.ALERT_EMAIL_FROM}>`,
      to: recipient,
      subject,
      text: textBody,
    });
    console.log(`📧 Hourly summary alert sent for ${count} suppressed security events.`);
  } catch (err) {
    console.error('❌ Failed to send hourly summary email:', err.message);
  } finally {
    summaryQueue.length = 0;
  }
};

/**
 * Send security email alert for a wrong PIN attempt or lockout
 * @param {Object} params
 * @param {string} params.ip
 * @param {number} params.attemptsSoFar
 * @param {boolean} params.locked
 * @param {string} params.userAgent
 */
const sendPinAlert = async ({ ip, attemptsSoFar, locked, userAgent = 'Unknown' }) => {
  try {
    await checkHourWindow();

    const recipient = process.env.ALERT_EMAIL_TO || 'ozatirth52@gmail.com';
    const timestampIST = formatIST();

    const subject = locked
      ? '🔒 Campus Compass — LOCKED after 3 failed PIN attempts'
      : `🔒 Campus Compass — wrong PIN attempt (${attemptsSoFar}/3)`;

    const textBody = `Campus Compass Security Alert
==========================================
Status: ${locked ? 'PORTAL ACCESS LOCKED FOR 5 MINUTES' : `Wrong PIN Attempt (${attemptsSoFar}/3)`}
Timestamp: ${timestampIST}
IP Address: ${ip}
User Agent / Device: ${userAgent}

Note: This is an automated security alert, not a confirmed intrusion. If you initiated this attempt, please check your PIN. If you did not make this attempt, unauthorized access may have been attempted.
==========================================`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: ${locked ? '#dc2626' : '#d97706'}; margin: 0; font-size: 20px;">
            ${locked ? '🚨 Campus Compass — Portal Access Locked' : '⚠️ Campus Compass — Failed PIN Attempt'}
          </h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Automated Security Notification</p>
        </div>

        <div style="background-color: ${locked ? '#fef2f2' : '#fffbeb'}; border-left: 4px solid ${locked ? '#dc2626' : '#f59e0b'}; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">
          <strong style="color: ${locked ? '#991b1b' : '#92400e'};">
            ${locked ? 'Portal has been locked for 5 minutes after 3 consecutive wrong attempts.' : `Attempt ${attemptsSoFar} of 3 recorded.`}
          </strong>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; width: 130px;"><strong>Timestamp (IST):</strong></td>
            <td style="padding: 8px 0; color: #1e293b;">${timestampIST}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;"><strong>IP Address:</strong></td>
            <td style="padding: 8px 0; color: #1e293b; font-family: monospace;">${ip}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;"><strong>Attempts:</strong></td>
            <td style="padding: 8px 0; color: #1e293b;">${attemptsSoFar} / 3 ${locked ? '(Lockout triggered)' : ''}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; vertical-align: top;"><strong>User Agent:</strong></td>
            <td style="padding: 8px 0; color: #1e293b; word-break: break-all; font-size: 12px; line-height: 1.4;">${userAgent}</td>
          </tr>
        </table>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b; line-height: 1.5;">
          <p style="margin: 0;"><strong>Security Note:</strong> This is an automated security alert, not a confirmed intrusion. If you initiated this request, ensure you enter the correct 8-digit PIN. If you did not make this request, someone may be attempting unauthorized access to the admin portal.</p>
        </div>
      </div>
    `;

    // Check rate limit threshold: 20 emails per hour
    if (emailCountThisHour >= 20) {
      console.warn(`⚠️ [MAILER] Alert volume exceeded 20 emails this hour. Queueing alert for hourly summary.`);
      summaryQueue.push({
        ip,
        attemptsSoFar,
        locked,
        userAgent,
        time: timestampIST,
      });

      if (!summaryTimer) {
        summaryTimer = setTimeout(async () => {
          summaryTimer = null;
          await sendHourlySummary();
        }, 3600000);
      }
      return;
    }

    const transporter = createTransporter();
    if (!transporter) {
      console.warn('⚠️ [MAILER] ALERT_EMAIL_FROM or GMAIL_APP_PASSWORD is not configured in .env.');
      console.warn(`[SECURITY ALERT SIMULATION] Sent to: ${recipient}`);
      console.warn(`Subject: ${subject}`);
      console.warn(`IP: ${ip} | Attempts: ${attemptsSoFar} | Locked: ${locked}`);
      return;
    }

    // Send email asynchronously
    emailCountThisHour++;
    const info = await transporter.sendMail({
      from: `"Campus Compass Security" <${process.env.ALERT_EMAIL_FROM}>`,
      to: recipient,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log(`📧 Security alert email delivered to ${recipient}. MessageId: ${info.messageId}`);
  } catch (error) {
    // Critical: Never let mailer failure crash or block the request
    console.error('❌ Failed to deliver PIN security alert email:', error.message);
  }
};

module.exports = {
  sendPinAlert,
  formatIST,
};
