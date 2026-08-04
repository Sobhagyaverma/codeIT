package com.codeit.modules.contact;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ContactRetryJob {

    private static final Logger log = LoggerFactory.getLogger(ContactRetryJob.class);

    private final ContactService contactService;

    public ContactRetryJob(ContactService contactService) {
        this.contactService = contactService;
    }

    @Scheduled(fixedDelayString = "${codeit.contact.retry-delay-ms:300000}")
    public void retry() {
        try {
            contactService.retryFailed();
        } catch (Exception ex) {
            log.warn("Contact retry job error: {}", ex.toString());
        }
    }
}
