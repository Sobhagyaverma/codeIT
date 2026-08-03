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
    private Timestamp createdAt;
    private Integer hostUserId;
    /** Display name preference: users.name, fallback uniqueuserid. */
    private String hostName;
    private String hostUsername;
    private String hostNote;
    /** Total members currently in the room (DB). */
    private int memberCount;
    /** Currently online over STOMP (may be 0 if nobody connected). */
    private int onlineCount;
}
