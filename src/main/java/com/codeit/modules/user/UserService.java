package com.codeit.modules.user;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.modules.auth.EmailAuthService;
import com.codeit.modules.beta.BetaInvite;
import com.codeit.modules.beta.BetaService;
import com.codeit.modules.registration.RegistrationProperties;
import com.codeit.modules.user.dto.RegisterRequest;
import com.codeit.security.captcha.TurnstileService;
import com.codeit.security.crypto.SensitiveFieldDecryptor;
import com.codeit.security.ratelimit.ClientIpResolver;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private SensitiveFieldDecryptor sensitiveFieldDecryptor;

    @Autowired
    private EmailAuthService emailAuthService;

    @Autowired
    private TurnstileService turnstileService;

    @Autowired
    private RegistrationProperties registrationProperties;

    @Autowired
    private BetaService betaService;

    public List<User> getUsers() {
        return userRepository.getUsers();
    }

    @Transactional
    public Map<String, Object> register(RegisterRequest request, HttpServletRequest http) {
        turnstileService.verifyOrThrow(request.getCaptchaToken(), ClientIpResolver.resolve(http));

        String name = request.getName().trim();
        String uniqueUserId = request.getUniqueUserId().trim();
        String email = request.getEmail().trim().toLowerCase();
        String password = sensitiveFieldDecryptor.resolve(
                request.getPassword(), request.isEncrypted(), "password");
        if (password.length() < 6) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Password must be at least 6 characters");
        }

        BetaInvite invite = null;
        if (registrationProperties.requiresInvite()) {
            invite = betaService.requireValidInvite(request.getInviteCode(), email);
        }

        if (userRepository.getUserByUniqueUserId(uniqueUserId) != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Unique user ID already exists");
        }

        if (userRepository.getUserByEmail(email) != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        User user = new User();
        user.setName(name);
        user.setUniqueUserId(uniqueUserId);
        user.setEmail(email);
        user.setRole("USER");
        user.setPassword(passwordEncoder.encode(password));
        user.setEmailVerified(false);

        int result = userRepository.createUser(user);
        if (result <= 0) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create user");
        }

        User created = userRepository.getUserByEmail(email);
        if (invite != null && created != null) {
            betaService.consumeInvite(invite.getId(), Integer.parseInt(created.getId()));
        }

        try {
            if (created != null) {
                emailAuthService.sendVerificationEmail(created);
            }
        } catch (ResponseStatusException ex) {
            // Account exists; FE can resend. Surface unavailable clearly.
            if (ex.getStatusCode() == HttpStatus.SERVICE_UNAVAILABLE) {
                Map<String, Object> body = new LinkedHashMap<>();
                body.put("message", "User created. Email delivery is temporarily unavailable — use resend later.");
                body.put("needsVerification", true);
                body.put("email", email);
                return body;
            }
            throw ex;
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", "User created successfully. Please verify your email.");
        body.put("needsVerification", true);
        body.put("email", email);
        return body;
    }

    public int delete(int id) {
        return userRepository.deleteUser(id);
    }

    public User getUserByEmail(String email) {
        return userRepository.getUserByEmail(email);
    }

    public User getUserByUniqueUserId(String uniqueUserId) {
        return userRepository.getUserByUniqueUserId(uniqueUserId);
    }

    public User getUserById(int id) {
        return userRepository.getUserById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    /** Invalidate all session JWTs for this user (logout / force re-auth). */
    public void bumpTokenVersion(int userId) {
        userRepository.bumpTokenVersion(userId);
    }
}
