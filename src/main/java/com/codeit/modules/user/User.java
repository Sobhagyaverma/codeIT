package com.codeit.modules.user;

import java.sql.Struct;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class User {

    private String id;
    private String username;
    @NotEmpty(message = "Email cant be empty")
    private String email;
    @NotEmpty(message = "Password cant be empty")
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
