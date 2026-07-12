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

@Service
public class AuthService {

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    public AuthResponse login(UserLoginDTO user) {
        User userByDB = userService.getUserByEmail(user);
        if (userByDB == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        boolean passwordOk = passwordEncoder.matches(user.getPassword(), userByDB.getPassword());
        if (!passwordOk) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        String token = jwtService.generateToken(userByDB);

        return new AuthResponse(
                token,
                Integer.parseInt(userByDB.getId()),
                userByDB.getEmail(),
                userByDB.getRole() != null ? userByDB.getRole() : "USER",
                jwtService.getExpirationMs());
    }
}
