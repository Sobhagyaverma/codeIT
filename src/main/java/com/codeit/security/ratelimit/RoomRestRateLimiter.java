package com.codeit.security.ratelimit;

import java.util.UUID;

import org.springframework.stereotype.Component;

/**
 * Rate limits for CodeRoom REST (invite, chat, join spam, sync-token).
 */
@Component
public class RoomRestRateLimiter {

    public static final String POLICY_INVITE = "room-invite";
    public static final String POLICY_CHAT = "room-chat";
    public static final String POLICY_JOIN = "room-join";
    public static final String POLICY_SYNC_TOKEN = "room-sync-token";
    public static final String POLICY_TRANSFER_HOST = "room-transfer-host";
    public static final String POLICY_RENAME = "room-rename";

    private final RateLimitService rateLimitService;
    private final RateLimitProperties properties;

    public RoomRestRateLimiter(RateLimitService rateLimitService, RateLimitProperties properties) {
        this.rateLimitService = rateLimitService;
        this.properties = properties;
    }

    /** POST /api/rooms — creates room + invite token. */
    public void checkInvite(Integer userId) {
        var limit = properties.getRoomInvite();
        rateLimitService.checkOrThrow(
                POLICY_INVITE,
                "user",
                String.valueOf(userId),
                limit.getLimit(),
                limit.getWindowSeconds());
    }

    /** POST /api/rooms/{id}/messages */
    public void checkChat(Integer userId) {
        var limit = properties.getRoomChat();
        rateLimitService.checkOrThrow(
                POLICY_CHAT,
                "user",
                String.valueOf(userId),
                limit.getLimit(),
                limit.getWindowSeconds());
    }

    /**
     * Join (including leave+rejoin same room). Keyed by user + room so
     * spam on one room does not block joining a different room.
     */
    public void checkJoin(Integer userId, UUID roomId) {
        var limit = properties.getRoomJoin();
        rateLimitService.checkOrThrow(
                POLICY_JOIN,
                "user-room",
                userId + ":" + roomId,
                limit.getLimit(),
                limit.getWindowSeconds());
    }

    /** GET /api/rooms/{id}/sync-token — Yjs JWT mint. */
    public void checkSyncToken(Integer userId) {
        var limit = properties.getRoomSyncToken();
        rateLimitService.checkOrThrow(
                POLICY_SYNC_TOKEN,
                "user",
                String.valueOf(userId),
                limit.getLimit(),
                limit.getWindowSeconds());
    }

    /** POST /api/rooms/{id}/transfer-host */
    public void checkTransferHost(Integer userId) {
        var limit = properties.getRoomTransferHost();
        rateLimitService.checkOrThrow(
                POLICY_TRANSFER_HOST,
                "user",
                String.valueOf(userId),
                limit.getLimit(),
                limit.getWindowSeconds());
    }

    /** PATCH /api/rooms/{id}/note — rename / host note */
    public void checkRename(Integer userId) {
        var limit = properties.getRoomRename();
        rateLimitService.checkOrThrow(
                POLICY_RENAME,
                "user",
                String.valueOf(userId),
                limit.getLimit(),
                limit.getWindowSeconds());
    }
}
