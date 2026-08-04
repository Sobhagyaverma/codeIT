package com.codeit.security.captcha;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/captcha")
public class CaptchaController {

    private final TurnstileService turnstileService;

    public CaptchaController(TurnstileService turnstileService) {
        this.turnstileService = turnstileService;
    }

    @GetMapping("/config")
    public Map<String, Object> config() {
        Map<String, Object> body = new LinkedHashMap<>();
        boolean enabled = turnstileService.isEnabled();
        body.put("enabled", enabled);
        body.put("provider", "turnstile");
        body.put("siteKey", enabled ? nullToEmpty(turnstileService.getSiteKey()) : "");
        return body;
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
