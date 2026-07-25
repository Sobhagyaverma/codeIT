package com.codeit.modules.collaboration.dto;

import java.sql.Timestamp;

import lombok.Data;

@Data
public class RoomMemberResponse {
    private Integer userId;
    private String username;
    private String role;
    private Timestamp joinedAt;
}