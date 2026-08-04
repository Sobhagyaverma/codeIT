package com.codeit.modules.auth;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.codeit.modules.auth.dto.AuthResponse;
import com.codeit.modules.auth.dto.EmailOnlyRequest;
import com.codeit.modules.auth.dto.ForgotPasswordResetRequest;
import com.codeit.modules.auth.dto.ForgotPasswordVerifyRequest;
import com.codeit.modules.auth.dto.VerifyEmailRequest;
import com.codeit.modules.user.dto.UserLoginDTO;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private EmailAuthService emailAuthService;

    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody UserLoginDTO user, HttpServletRequest request) {
        return authService.login(user, request);
    }

    @PostMapping("/verify-email")
    public Map<String, Object> verifyEmail(
            @Valid @RequestBody VerifyEmailRequest request, HttpServletRequest http) {
        return emailAuthService.verifyEmail(request, http);
    }

    @PostMapping("/verify-email/resend")
    public Map<String, Object> resendVerify(
            @Valid @RequestBody EmailOnlyRequest request, HttpServletRequest http) {
        return emailAuthService.resendVerification(request, http);
    }

    @PostMapping("/forgot-password")
    public Map<String, Object> forgotPassword(
            @Valid @RequestBody EmailOnlyRequest request, HttpServletRequest http) {
        return emailAuthService.forgotPassword(request, http);
    }

    @PostMapping("/forgot-password/verify")
    public Map<String, Object> forgotVerify(
            @Valid @RequestBody ForgotPasswordVerifyRequest request, HttpServletRequest http) {
        return emailAuthService.verifyForgotOtp(request, http);
    }

    @PostMapping("/forgot-password/reset")
    public Map<String, Object> forgotReset(
            @Valid @RequestBody ForgotPasswordResetRequest request, HttpServletRequest http) {
        return emailAuthService.resetPassword(request, http);
    }
}
