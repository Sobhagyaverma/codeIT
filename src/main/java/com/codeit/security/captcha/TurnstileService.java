package com.codeit.security.captcha;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

/**
 * Cloudflare Turnstile siteverify. No-op when captcha is disabled.
 */
@Service
@EnableConfigurationProperties(CaptchaProperties.class)
public class TurnstileService {

    private static final Logger log = LoggerFactory.getLogger(TurnstileService.class);

    private final CaptchaProperties properties;
    private final RestTemplate restTemplate;

    public TurnstileService(CaptchaProperties properties, RestTemplate restTemplate) {
        this.properties = properties;
        this.restTemplate = restTemplate;
    }

    public boolean isEnabled() {
        return properties.isEnabled();
    }

    public String getSiteKey() {
        return properties.getTurnstile().getSiteKey();
    }

    public void verifyOrThrow(String captchaToken, String remoteIp) {
        if (!properties.isEnabled()) {
            return;
        }
        String secret = properties.getTurnstile().getSecretKey();
        if (secret == null || secret.isBlank()) {
            log.error("Captcha enabled but TURNSTILE_SECRET_KEY is empty");
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "CAPTCHA_FAILED");
        }
        if (captchaToken == null || captchaToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CAPTCHA_FAILED");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("secret", secret);
            form.add("response", captchaToken.trim());
            if (remoteIp != null && !remoteIp.isBlank()) {
                form.add("remoteip", remoteIp.trim());
            }

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    properties.getTurnstile().getVerifyUrl(),
                    new HttpEntity<>(form, headers),
                    Map.class);

            Map<?, ?> body = response.getBody();
            Object success = body == null ? null : body.get("success");
            if (!Boolean.TRUE.equals(success)) {
                log.warn("Turnstile verify failed ip={} body={}", remoteIp, body);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CAPTCHA_FAILED");
            }
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Turnstile verify error: {}", ex.toString());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CAPTCHA_FAILED");
        }
    }
}
