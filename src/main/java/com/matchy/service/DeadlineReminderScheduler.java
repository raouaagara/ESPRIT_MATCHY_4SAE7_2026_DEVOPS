package com.matchy.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class DeadlineReminderScheduler {

    @Autowired
    private ProjectService projectService;

    // Runs every day at 08:00 server time
    @Scheduled(cron = "${matchy.deadline-reminder.cron:0 0 8 * * *}")
    public void runDailyDeadlineReminders() {
        projectService.sendDeadlineReminders();
    }
}
