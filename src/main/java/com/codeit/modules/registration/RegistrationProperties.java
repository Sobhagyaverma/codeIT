package com.codeit.modules.registration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RegistrationProperties {

    private final RegistrationMode mode;
    private final int inviteTtlDays;
    private final String invitePepper;
    private final String publicBaseUrl;

    public RegistrationProperties(
            @Value("${codeit.registration.mode:INVITE_ONLY}") String mode,
            @Value("${codeit.registration.invite-ttl-days:7}") int inviteTtlDays,
            @Value("${codeit.registration.invite-pepper:${codeit.otp.pepper}}") String invitePepper,
            @Value("${codeit.app.public-base-url:http://localhost:5173}") String publicBaseUrl) {
        this.mode = RegistrationMode.from(mode);
        this.inviteTtlDays = Math.max(1, inviteTtlDays);
        this.invitePepper = invitePepper != null ? invitePepper : "";
        this.publicBaseUrl = publicBaseUrl == null ? "http://localhost:5173" : publicBaseUrl.replaceAll("/$", "");
    }

    public RegistrationMode getMode() {
        return mode;
    }

    public boolean requiresInvite() {
        return mode.requiresInvite();
    }

    public boolean isPrivateBeta() {
        return mode.isPrivateBeta();
    }

    public int getInviteTtlDays() {
        return inviteTtlDays;
    }

    public String getInvitePepper() {
        return invitePepper;
    }

    public String getPublicBaseUrl() {
        return publicBaseUrl;
    }
}
