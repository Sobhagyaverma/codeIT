package com.codeit.modules.user;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class User {

    private String id;
    private String name;
    private String uniqueUserId;
    @NotEmpty(message = "Email cant be empty")
    private String email;
    @JsonIgnore
    private String password;
    private String role;

    private String bio;
    private String avatarUrl;
    private String location;
    private Boolean showEmail;
    private Instant createdAt;
    private Instant updatedAt;


    public User(String id, String name, String uniqueUserId, String email, String password, String role) {
        this.id = id;
        this.name = name;
        this.uniqueUserId = uniqueUserId;
        this.email = email;
        this.password = password;
        this.role = role;


    }

    public User() {
    }
}
