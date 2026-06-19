package com.codeit.modules.user;

import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.codeit.modules.user.dto.UserLoginDTO;

@Service

public class UserService {
    @Autowired
    private UserRepository userRepository;

    public List<User> getUsers() {

        return userRepository.getUsers();

    }

    public String save(User user) {
        User existingUser = userRepository.getUserByEmail(user.getEmail());
        if (existingUser != null) {
            return "Email already exists";
        }
        int result = userRepository.createUser(user);
        if (result > 0) {
            return "User created successfully";
        }
        return "Failed to create user";
    }

    public int delete(int id) {
        return userRepository.deleteUser(id);
    }

    public User getUserByEmail(UserLoginDTO user) {
        return userRepository.getUserByEmail(user.getEmail());
    }

}