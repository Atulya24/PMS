const nodemailer = require('nodemailer');

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

const sendMail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error('SMTP is not configured (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS)');
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
};

const formatDate = (d) => {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
};

const sendGoalCreatedEmail = async ({ to, goalTitle, goalDescription, deadline, createdByName, managerName }) => {
  const subject = `New Goal Created: ${goalTitle}`;
  const text = `A new goal has been created.\n\nTitle: ${goalTitle}\nDescription: ${goalDescription}\nDeadline: ${formatDate(deadline)}\nEmployee: ${createdByName || ''}\nManager: ${managerName || ''}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.5;">
      <h2 style="margin:0 0 12px;">New Goal Created</h2>
      <p><b>Title:</b> ${goalTitle}</p>
      <p><b>Description:</b> ${goalDescription}</p>
      <p><b>Deadline:</b> ${formatDate(deadline)}</p>
      ${createdByName ? `<p><b>Employee:</b> ${createdByName}</p>` : ''}
      ${managerName ? `<p><b>Manager:</b> ${managerName}</p>` : ''}
      <hr/>
      <p style="color:#555; font-size:12px;">PMS Notification</p>
    </div>
  `;

  return sendMail({ to, subject, text, html });
};

const sendGoalDeadlineReminderEmail = async ({ to, goalTitle, deadline, createdByName, managerName }) => {
  const subject = `Reminder: Goal deadline is tomorrow - ${goalTitle}`;
  const text = `Reminder: The deadline for the goal is tomorrow.\n\nTitle: ${goalTitle}\nDeadline: ${formatDate(deadline)}\nEmployee: ${createdByName || ''}\nManager: ${managerName || ''}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.5;">
      <h2 style="margin:0 0 12px;">Deadline Reminder</h2>
      <p>The deadline for this goal is <b>tomorrow</b>.</p>
      <p><b>Title:</b> ${goalTitle}</p>
      <p><b>Deadline:</b> ${formatDate(deadline)}</p>
      ${createdByName ? `<p><b>Employee:</b> ${createdByName}</p>` : ''}
      ${managerName ? `<p><b>Manager:</b> ${managerName}</p>` : ''}
      <hr/>
      <p style="color:#555; font-size:12px;">PMS Notification</p>
    </div>
  `;

  return sendMail({ to, subject, text, html });
};

module.exports = {
  sendGoalCreatedEmail,
  sendGoalDeadlineReminderEmail,
};
