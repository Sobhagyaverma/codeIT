package com.codeit.modules.collaboration.service;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Ensures at most one run/submit execution is in-flight per room.
 */
@Component
public class RoomExecutionGate {

    private final ConcurrentHashMap<UUID, Long> busyRooms = new ConcurrentHashMap<>();

    /**
     * Try to acquire the room lock. Throws 409 if another execution is running.
     *
     * @return a handle that must be released in a finally block
     */
    public Handle acquire(UUID roomId) {
        long now = System.currentTimeMillis();
        Long previous = busyRooms.putIfAbsent(roomId, now);
        if (previous != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Another execution is already running in this room. Wait for it to finish.");
        }
        return () -> busyRooms.remove(roomId, now);
    }

    @FunctionalInterface
    public interface Handle extends AutoCloseable {
        @Override
        void close();
    }
}
