package com.codeit.security.otp;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "codeit.otp")
public class OtpProperties {

    private String pepper = "codeit-dev-otp-pepper-change-me";
    private int ttlSeconds = 300;
    private int cooldownSeconds = 60;
    private int resetTokenTtlSeconds = 600;
    private int maxAttempts = 5;

    public String getPepper() {
        return pepper;
    }

    public void setPepper(String pepper) {
        this.pepper = pepper;
    }

    public int getTtlSeconds() {
        return ttlSeconds;
    }

    public void setTtlSeconds(int ttlSeconds) {
        this.ttlSeconds = ttlSeconds;
    }

    public int getCooldownSeconds() {
        return cooldownSeconds;
    }

    public void setCooldownSeconds(int cooldownSeconds) {
        this.cooldownSeconds = cooldownSeconds;
    }

    public int getResetTokenTtlSeconds() {
        return resetTokenTtlSeconds;
    }

    public void setResetTokenTtlSeconds(int resetTokenTtlSeconds) {
        this.resetTokenTtlSeconds = resetTokenTtlSeconds;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }
}
