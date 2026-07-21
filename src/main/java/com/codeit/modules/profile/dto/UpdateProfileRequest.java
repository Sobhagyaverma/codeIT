package com.codeit.modules.profile.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String bio;
    private String location;
    private String avatarUrl;
    private Boolean showEmail;
}