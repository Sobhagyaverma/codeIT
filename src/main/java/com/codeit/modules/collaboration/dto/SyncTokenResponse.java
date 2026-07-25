package com.codeit.modules.collaboration.dto;

import lombok.Data;

@Data
public class SyncTokenResponse {
    private String token;
    private long expiresInMs;
    private String codeDocName;
    private String whiteboardDocName;
}
