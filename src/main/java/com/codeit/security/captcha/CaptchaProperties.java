package com.codeit.security.captcha;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "codeit.captcha")
public class CaptchaProperties {

    private boolean enabled = false;
    private final Turnstile turnstile = new Turnstile();

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Turnstile getTurnstile() {
        return turnstile;
    }

    public static class Turnstile {
        private String siteKey = "";
        private String secretKey = "";
        private String verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

        public String getSiteKey() {
            return siteKey;
        }

        public void setSiteKey(String siteKey) {
            this.siteKey = siteKey;
        }

        public String getSecretKey() {
            return secretKey;
        }

        public void setSecretKey(String secretKey) {
            this.secretKey = secretKey;
        }

        public String getVerifyUrl() {
            return verifyUrl;
        }

        public void setVerifyUrl(String verifyUrl) {
            this.verifyUrl = verifyUrl;
        }
    }
}
