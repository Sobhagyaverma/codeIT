package com.codeit.modules.quickclash;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class QuickContestScheduler {

    private static final Logger log = LoggerFactory.getLogger(QuickContestScheduler.class);

    private final QuickContestService quickContestService;

    public QuickContestScheduler(QuickContestService quickContestService) {
        this.quickContestService = quickContestService;
    }

    @Scheduled(fixedDelayString = "${codeit.quick-clash.end-poll-ms:5000}")
    public void endExpiredContests() {
        try {
            quickContestService.finalizeExpired();
        } catch (Exception ex) {
            log.warn("Quick Clash end poll failed: {}", ex.toString());
        }
    }
}
