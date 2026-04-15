const cron = require('node-cron');
const Goal = require('../models/Goal');
const { sendGoalDeadlineReminderEmail } = require('../services/emailService');

const startDeadlineReminderJob = () => {
  // Every hour
  cron.schedule('0 * * * *', async () => {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    try {
      const goals = await Goal.find({
        deadline: { $gte: now, $lte: in24h },
        deadlineReminderEmailSent: false,
      })
        .populate('createdBy', 'name email')
        .populate('managerId', 'name email');

      for (const goal of goals) {
        try {
          const to = [goal.createdBy?.email, goal.managerId?.email].filter(Boolean);
          if (to.length === 0) {
            goal.deadlineReminderEmailSent = true;
            await goal.save();
            continue;
          }

          await sendGoalDeadlineReminderEmail({
            to,
            goalTitle: goal.title,
            deadline: goal.deadline,
            createdByName: goal.createdBy?.name,
            managerName: goal.managerId?.name,
          });

          goal.deadlineReminderEmailSent = true;
          await goal.save();
        } catch (e) {
          console.error('Deadline reminder email failed for goal', goal?._id?.toString?.() || '', e?.message || e);
        }
      }
    } catch (e) {
      console.error('Deadline reminder job error:', e?.message || e);
    }
  });
};

module.exports = { startDeadlineReminderJob };
