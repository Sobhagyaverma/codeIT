package com.codeit.modules.mail;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "codeit.mail")
public class MailProperties {

    /** When false, sendHtml no-ops (local/dev without Brevo). */
    private boolean enabled = false;

    /** From header, e.g. {@code CodeT <noreply@example.com>}. */
    private String from = "CodeT <noreply@localhost>";

    /** Inbox that receives Contact Us notifications. */
    private String inbox = "";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public String getInbox() {
        return inbox;
    }

    public void setInbox(String inbox) {
        this.inbox = inbox;
    }
}
