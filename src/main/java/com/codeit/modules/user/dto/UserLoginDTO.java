package com.codeit.modules.user.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserLoginDTO {
    @NotEmpty(message = "Email cant be empty")
    private String email;
    @NotEmpty(message = "Password cant be empty")
    private String password;
}
