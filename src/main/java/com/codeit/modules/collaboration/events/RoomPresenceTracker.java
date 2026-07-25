package com.codeit.modules.collaboration.events;

import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Tracks which users are currently connected to a room over WebSocket.
 * Keyed by STOMP sessionId so one user with multiple tabs is handled carefully.
 */
@Component
public class RoomPresenceTracker {

    /** sessionId -> roomId */
    private final Map<String, UUID> sessionRoom = new ConcurrentHashMap<>();
    /** sessionId -> userId */
    private final Map<String, Integer> sessionUser = new ConcurrentHashMap<>();
    /** roomId -> set of userIds online */
    private final Map<UUID, Set<Integer>> roomUsers = new ConcurrentHashMap<>();

    public void join(String sessionId, UUID roomId, Integer userId) {
        leave(sessionId); // clean previous room if any

        sessionRoom.put(sessionId, roomId);
        sessionUser.put(sessionId, userId);
        roomUsers
                .computeIfAbsent(roomId, id -> ConcurrentHashMap.newKeySet())
                .add(userId);
    }

    /** @return userId that left, or null if session was unknown */
    public Integer leave(String sessionId) {
        UUID roomId = sessionRoom.remove(sessionId);
        Integer userId = sessionUser.remove(sessionId);
        if (roomId == null || userId == null) {
            return null;
        }
        Set<Integer> users = roomUsers.get(roomId);
        if (users != null) {
            users.remove(userId);
            if (users.isEmpty()) {
                roomUsers.remove(roomId);
            }
        }
        return userId;
    }

    public UUID getRoomId(String sessionId) {
        return sessionRoom.get(sessionId);
    }

    public Set<Integer> getOnlineUserIds(UUID roomId) {
        Set<Integer> users = roomUsers.get(roomId);
        if (users == null) {
            return Collections.emptySet();
        }
        return Set.copyOf(users);
    }
}