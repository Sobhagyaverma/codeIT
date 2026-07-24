package com.codeit.modules.collaboration;

import java.sql.Timestamp;
import java.util.UUID;

import lombok.Data;

@Data
public class RoomMessage {
    private Long id;
    private UUID roomId;
    private Integer userId;
    private String content;
    private Timestamp createdAt;
}