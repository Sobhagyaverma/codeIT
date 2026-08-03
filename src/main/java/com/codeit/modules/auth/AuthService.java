package com.codeit.modules.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.modules.auth.dto.AuthResponse;
import com.codeit.modules.user.User;
import com.codeit.modules.user.UserService;
import com.codeit.modules.user.dto.UserLoginDTO;
import com.codeit.security.crypto.SensitiveFieldDecryptor;

@Service
public class AuthService {

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private SensitiveFieldDecryptor sensitiveFieldDecryptor;

    public AuthResponse login(UserLoginDTO dto) {
        String login = sensitiveFieldDecryptor
                .resolve(dto.getLogin(), dto.isEncrypted(), "login")
                .trim();
        String password = sensitiveFieldDecryptor.resolve(
                dto.getPassword(), dto.isEncrypted(), "password");

        User userByDB = looksLikeEmail(login)
                ? userService.getUserByEmail(login)
                : userService.getUserByUniqueUserId(login);

        if (userByDB == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        boolean passwordOk = passwordEncoder.matches(password, userByDB.getPassword());
        if (!passwordOk) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String token = jwtService.generateToken(userByDB);

        return new AuthResponse(
                token,
                Integer.parseInt(userByDB.getId()),
                userByDB.getName(),
                userByDB.getUniqueUserId(),
                userByDB.getEmail(),
                userByDB.getRole() != null ? userByDB.getRole() : "USER",
                jwtService.getExpirationMs());
    }

    private boolean looksLikeEmail(String value) {
        return value.contains("@");
    }
}
