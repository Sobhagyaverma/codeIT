package com.codeit.modules.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.codeit.modules.user.User;
import com.codeit.modules.user.UserService;
import com.codeit.modules.user.dto.UserLoginDTO;

@Service
public class AuthService {
    @Autowired
    private UserService userService;

    public String login(UserLoginDTO user) {
        User userByDB = userService.getUserByEmail(user);
        if (userByDB == null) {
            return "User not found.";
        }
        if (user.getEmail().equals(userByDB.getEmail()) && user.getPassword().equals(userByDB.getPassword())) {

            return "Login success";
        } else {
            return "Login failed.";
        }
    }
}
