package com.codeit.config;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Liveness probe for Docker/Nginx. Always public (see SecurityConfig).
 */
@RestController
@RequestMapping("/api/health")
public class AppHealthController {

    @GetMapping
    public Map<String, Object> health() {
        return Map.of("status", "ok", "service", "codeit-api");
    }
}
