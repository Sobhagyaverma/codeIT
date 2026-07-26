package com.codeit.modules.collaboration.dto;

import java.sql.Timestamp;
import java.util.UUID;

import lombok.Data;

@Data
public class RoomSummaryResponse {
    private UUID id;
    private String type;
    private String language;
    private String status;
    private String activeWorkspace;
    private String inviteToken;
    private String role;
    private Timestamp joinedAt;
    private Timestamp lastSeenAt;
    private Timestamp updatedAt;
}
