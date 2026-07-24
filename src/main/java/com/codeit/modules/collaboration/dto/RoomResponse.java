package com.codeit.modules.collaboration.dto;

import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;

import lombok.Data;

@Data
public class RoomResponse {
    private UUID id;
    private String type;
    private Integer problemId;
    private Integer hostUserId;
    private String inviteToken;
    private String activeWorkspace;
    private String language;
    private String status;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private List<RoomMemberResponse> members;
}