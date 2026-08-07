package com.codeit.modules.registration;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/registration")
public class RegistrationConfigController {

    private final RegistrationProperties properties;

    public RegistrationConfigController(RegistrationProperties properties) {
        this.properties = properties;
    }

    @GetMapping("/config")
    public Map<String, Object> config() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("mode", properties.getMode().name());
        body.put("requiresInvite", properties.requiresInvite());
        body.put("privateBeta", properties.isPrivateBeta());
        body.put("inviteTtlDays", properties.getInviteTtlDays());
        return body;
    }
}
