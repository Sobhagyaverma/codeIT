package com.codeit.modules.collaboration.events;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Tracks which users are currently connected to a room over STOMP.
 * Keyed by sessionId; enforces a max number of tabs (sessions) per user per room.
 */
@Component
public class RoomPresenceTracker {

    /** sessionId -> roomId */
    private final Map<String, UUID> sessionRoom = new ConcurrentHashMap<>();
    /** sessionId -> userId */
    private final Map<String, Integer> sessionUser = new ConcurrentHashMap<>();
    /** roomId -> set of userIds online (derived from sessions) */
    private final Map<UUID, Set<Integer>> roomUsers = new ConcurrentHashMap<>();
    /** roomId -> userId -> ordered sessionIds (oldest first) */
    private final Map<UUID, Map<Integer, LinkedHashSet<String>>> roomUserSessions =
            new ConcurrentHashMap<>();

    /**
     * Register presence. If the user already has {@code maxSessions} tabs in this room,
     * the oldest session is displaced (caller should broadcast LEFT for it).
     *
     * @return displaced sessionId, if any
     */
    public Optional<String> join(String sessionId, UUID roomId, Integer userId, int maxSessions) {
        leave(sessionId); // clean previous room/session if any

        int cap = Math.max(1, maxSessions);
        LinkedHashSet<String> sessions = roomUserSessions
                .computeIfAbsent(roomId, id -> new ConcurrentHashMap<>())
                .computeIfAbsent(userId, id -> new LinkedHashSet<>());

        String displaced = null;
        synchronized (sessions) {
            while (sessions.size() >= cap) {
                String oldest = sessions.iterator().next();
                sessions.remove(oldest);
                displaced = oldest;
                // Fully remove oldest session maps (without touching other sessions of user)
                forceDropSession(oldest, roomId, userId);
            }
            sessions.add(sessionId);
        }

        sessionRoom.put(sessionId, roomId);
        sessionUser.put(sessionId, userId);
        roomUsers
                .computeIfAbsent(roomId, id -> ConcurrentHashMap.newKeySet())
                .add(userId);

        return Optional.ofNullable(displaced);
    }

    /** @return userId that left, or null if session was unknown */
    public Integer leave(String sessionId) {
        UUID roomId = sessionRoom.remove(sessionId);
        Integer userId = sessionUser.remove(sessionId);
        if (roomId == null || userId == null) {
            return null;
        }

        Map<Integer, LinkedHashSet<String>> byUser = roomUserSessions.get(roomId);
        if (byUser != null) {
            LinkedHashSet<String> sessions = byUser.get(userId);
            if (sessions != null) {
                synchronized (sessions) {
                    sessions.remove(sessionId);
                    if (sessions.isEmpty()) {
                        byUser.remove(userId);
                        Set<Integer> users = roomUsers.get(roomId);
                        if (users != null) {
                            users.remove(userId);
                            if (users.isEmpty()) {
                                roomUsers.remove(roomId);
                            }
                        }
                    }
                }
            }
            if (byUser.isEmpty()) {
                roomUserSessions.remove(roomId);
            }
        } else {
            Set<Integer> users = roomUsers.get(roomId);
            if (users != null) {
                users.remove(userId);
                if (users.isEmpty()) {
                    roomUsers.remove(roomId);
                }
            }
        }
        return userId;
    }

    public UUID getRoomId(String sessionId) {
        return sessionRoom.get(sessionId);
    }

    public Integer getUserId(String sessionId) {
        return sessionUser.get(sessionId);
    }

    public int countSessions(UUID roomId, Integer userId) {
        Map<Integer, LinkedHashSet<String>> byUser = roomUserSessions.get(roomId);
        if (byUser == null) {
            return 0;
        }
        LinkedHashSet<String> sessions = byUser.get(userId);
        if (sessions == null) {
            return 0;
        }
        synchronized (sessions) {
            return sessions.size();
        }
    }

    public Set<Integer> getOnlineUserIds(UUID roomId) {
        Set<Integer> users = roomUsers.get(roomId);
        if (users == null) {
            return Collections.emptySet();
        }
        return Set.copyOf(users);
    }

    private void forceDropSession(String sessionId, UUID roomId, Integer userId) {
        sessionRoom.remove(sessionId, roomId);
        sessionUser.remove(sessionId, userId);
        // Do not remove user from roomUsers here — other sessions may remain
    }

    /** Snapshot of session ids for debugging / disconnect of displaced tabs. */
    public java.util.List<String> listSessionIds(UUID roomId, Integer userId) {
        Map<Integer, LinkedHashSet<String>> byUser = roomUserSessions.get(roomId);
        if (byUser == null) {
            return List.of();
        }
        LinkedHashSet<String> sessions = byUser.get(userId);
        if (sessions == null) {
            return List.of();
        }
        synchronized (sessions) {
            return new ArrayList<>(sessions);
        }
    }
}
