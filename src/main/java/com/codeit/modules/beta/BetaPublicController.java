package com.codeit.modules.beta;

import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.codeit.modules.beta.dto.BetaAccessRequestDto;
import com.codeit.modules.beta.dto.VerifyInviteRequest;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/beta")
public class BetaPublicController {

    private final BetaService betaService;

    public BetaPublicController(BetaService betaService) {
        this.betaService = betaService;
    }

    @PostMapping("/request-access")
    public Map<String, Object> requestAccess(
            @Valid @RequestBody BetaAccessRequestDto body, HttpServletRequest request) {
        return betaService.requestAccess(body, request);
    }

    @PostMapping("/verify-invite")
    public Map<String, Object> verifyInvite(
            @Valid @RequestBody VerifyInviteRequest body, HttpServletRequest request) {
        return betaService.verifyInvite(body, request);
    }
}
