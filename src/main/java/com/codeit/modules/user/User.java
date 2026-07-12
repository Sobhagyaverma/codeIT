package com.codeit.modules.user;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class User {

    private String id;
    private String username;
    @NotEmpty(message = "Email cant be empty")
    private String email;
    @JsonIgnore
    private String password;
    private String role;

    public User(String id, String name, String email, String password , String role) {
        this.id = id;
        this.username = name;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    public User() {

    }
}
