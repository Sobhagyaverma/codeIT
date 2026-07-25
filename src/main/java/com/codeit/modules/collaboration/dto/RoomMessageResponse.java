package com.codeit.modules.collaboration.dto;

import java.sql.Timestamp;

import lombok.Data;

@Data
public class RoomMessageResponse {
    private Long id;
    private Integer userId;
    private String username;
    private String content;
    private Timestamp createdAt;
}