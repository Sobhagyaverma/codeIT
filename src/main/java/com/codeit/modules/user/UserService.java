package com.codeit.modules.user;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.modules.user.dto.RegisterRequest;

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
        String name = request.getName().trim();
        String uniqueUserId = request.getUniqueUserId().trim();
        String email = request.getEmail().trim();

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
}
