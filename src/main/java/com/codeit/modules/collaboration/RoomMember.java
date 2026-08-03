package com.codeit.modules.collaboration;

import java.sql.Timestamp;
import java.util.UUID;

import lombok.Data;

@Data
public class RoomMember {
    private UUID roomId;
    private Integer userId;
    private String role;
    private Timestamp joinedAt;
    private Timestamp lastSeenAt;
    /** Populated when loaded via JOIN users (avoids N+1). */
    private String username;
    /** users.name from JOIN; preferred for display. */
    private String displayName;
}