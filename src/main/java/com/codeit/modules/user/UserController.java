package com.codeit.modules.user;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/getUsers")
    public List<User> getUsers() {
        return userService.getUsers();
    }

    @PostMapping("/register")
    public String createUser(@Valid @RequestBody User user) {
        return userService.save(user);
    }

    @DeleteMapping("/deleteUser/{id}")
    public int deleteUser(@PathVariable("id") int id) {
        return userService.delete(id);
    }

    @GetMapping("/getUser/{id}")
    public User getUserById(@PathVariable("id") int id) {
        return userService.getUserById(id);
    }
}
