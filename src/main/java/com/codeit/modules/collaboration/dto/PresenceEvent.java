package com.codeit.modules.collaboration.dto;

import java.util.List;

import lombok.Data;

@Data
public class PresenceEvent {
    /** JOINED | LEFT | SNAPSHOT */
    private String type;
    private String roomId;
    private Integer userId;
    private String username;
    /** Full online list (useful on SNAPSHOT / JOINED) */
    private List<Integer> onlineUserIds;
}