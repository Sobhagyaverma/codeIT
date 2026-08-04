package com.codeit.modules.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Thin SMTP wrapper. OTP / contact flows own their templates and rate limits.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final MailProperties properties;
    private final JavaMailSender mailSender;

    public MailService(MailProperties properties, ObjectProvider<JavaMailSender> mailSender) {
        this.properties = properties;
        this.mailSender = mailSender.getIfAvailable();
    }

    public void sendHtml(String to, String subject, String htmlBody) {
        if (!properties.isEnabled()) {
            log.info("Mail disabled — skipping send to={} subject={}", mask(to), subject);
            return;
        }
        if (mailSender == null) {
            throw new IllegalStateException(
                    "Mail enabled but JavaMailSender is missing — refresh Maven deps / restart via ./mvnw spring-boot:run");
        }
        if (to == null || to.isBlank()) {
            throw new IllegalArgumentException("Mail recipient is required");
        }
        try {
            var message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(properties.getFrom());
            helper.setTo(to.trim());
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Mail sent to={} subject={}", mask(to), subject);
        } catch (Exception ex) {
            log.error("Mail send failed to={} subject={}: {}", mask(to), subject, ex.toString());
            throw new IllegalStateException("Failed to send email", ex);
        }
    }

    public String getInbox() {
        return properties.getInbox();
    }

    public boolean isEnabled() {
        return properties.isEnabled();
    }

    private static String mask(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        int at = email.indexOf('@');
        return email.charAt(0) + "***" + email.substring(at);
    }
}
