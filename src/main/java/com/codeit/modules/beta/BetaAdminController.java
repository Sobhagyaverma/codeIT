package com.codeit.modules.beta;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.codeit.modules.beta.dto.GenerateInviteRequest;
import com.codeit.modules.beta.dto.RejectRequestDto;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/beta")
public class BetaAdminController {

    private final BetaService betaService;

    public BetaAdminController(BetaService betaService) {
        this.betaService = betaService;
    }

    @GetMapping("/requests")
    public List<Map<String, Object>> listRequests(
            @RequestParam(required = false, defaultValue = "ALL") String status) {
        return betaService.listRequests(status);
    }

    @PostMapping("/requests/{id}/approve")
    public Map<String, Object> approve(@PathVariable long id, HttpServletRequest request) {
        return betaService.approveRequest(id, request);
    }

    @PostMapping("/requests/{id}/reject")
    public Map<String, Object> reject(
            @PathVariable long id,
            @RequestBody(required = false) RejectRequestDto body,
            HttpServletRequest request) {
        return betaService.rejectRequest(id, body == null ? new RejectRequestDto() : body, request);
    }

    @PostMapping("/invites")
    public Map<String, Object> generate(
            @Valid @RequestBody GenerateInviteRequest body, HttpServletRequest request) {
        return betaService.generateInvite(body, request);
    }

    @GetMapping("/invites")
    public List<Map<String, Object>> listInvites() {
        return betaService.listInvites();
    }

    @PostMapping("/invites/{id}/resend")
    public Map<String, Object> resend(@PathVariable long id, HttpServletRequest request) {
        return betaService.resendInvite(id, request);
    }

    @GetMapping("/analytics")
    public Map<String, Object> analytics() {
        return betaService.analytics();
    }
}
