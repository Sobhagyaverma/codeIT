package com.codeit.modules.user;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.modules.user.dto.RegisterRequest;
import com.codeit.modules.user.dto.UserLoginDTO;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<User> getUsers() {
        return userRepository.getUsers();
    }

    public String register(RegisterRequest request) {
        User existingUser = userRepository.getUserByEmail(request.getEmail());
        if (existingUser != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        // Public register always creates USER — never trust client-supplied role
        user.setRole("USER");
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        int result = userRepository.createUser(user);
        if (result <= 0) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create user");
        }
        return "User created successfully";
    }

    public int delete(int id) {
        return userRepository.deleteUser(id);
    }

    public User getUserByEmail(UserLoginDTO user) {
        return userRepository.getUserByEmail(user.getEmail());
    }

    public User getUserById(int id) {
        return userRepository.getUserById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
