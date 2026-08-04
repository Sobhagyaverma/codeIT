package com.codeit.modules.collaboration;

import java.sql.Timestamp;
import java.util.UUID;

import lombok.Data;

/** Room row joined with the caller's membership fields for "my rooms" listing. */
@Data
public class UserRoomMembership {
    private UUID id;
    private String type;
    private Integer problemId;
    private String language;
    private String status;
    private String activeWorkspace;
    private String inviteToken;
    private Timestamp updatedAt;
    private Timestamp createdAt;
    private String role;
    private Timestamp joinedAt;
    private Timestamp lastSeenAt;
    private Integer hostUserId;
    private String hostName;
    private String hostUsername;
    private String hostNote;
    private int memberCount;
}
