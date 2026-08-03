package com.codeit.modules.collaboration.controller;

import java.security.Principal;
import java.util.ArrayList;
import java.util.UUID;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import com.codeit.config.CollaborationLimitsProperties;
import com.codeit.modules.auth.AuthUserPrincipal;
import com.codeit.modules.collaboration.dto.PresenceEvent;
import com.codeit.modules.collaboration.events.CollaborationEventPublisher;
import com.codeit.modules.collaboration.events.RoomPresenceTracker;
import com.codeit.modules.collaboration.repository.RoomMemberRepository;
import com.codeit.modules.user.User;
import com.codeit.modules.user.UserRepository;

@Controller
public class CollaborationWsController {

    private final RoomMemberRepository roomMemberRepository;
    private final RoomPresenceTracker presenceTracker;
    private final CollaborationEventPublisher eventPublisher;
    private final UserRepository userRepository;
    private final CollaborationLimitsProperties limits;

    public CollaborationWsController(
            RoomMemberRepository roomMemberRepository,
            RoomPresenceTracker presenceTracker,
            CollaborationEventPublisher eventPublisher,
            UserRepository userRepository,
            CollaborationLimitsProperties limits) {
        this.roomMemberRepository = roomMemberRepository;
        this.presenceTracker = presenceTracker;
        this.eventPublisher = eventPublisher;
        this.userRepository = userRepository;
        this.limits = limits;
    }

    /**
     * Client sends to: /app/rooms/{roomId}/presence/join
     * Caps concurrent tabs per user; displaces the oldest session if over limit.
     */
    @MessageMapping("/rooms/{roomId}/presence/join")
    public void joinPresence(
            @DestinationVariable UUID roomId,
            Principal principal,
            StompHeaderAccessor accessor) {

        AuthUserPrincipal user = requireUser(principal);
        if (!roomMemberRepository.exists(roomId, user.getUserId())) {
            throw new IllegalArgumentException("Not a room member");
        }

        String sessionId = accessor.getSessionId();
        var displaced = presenceTracker.join(
                sessionId,
                roomId,
                user.getUserId(),
                limits.getMaxStompSessionsPerUserPerRoom());

        displaced.ifPresent(oldSession -> {
            PresenceEvent replaced = new PresenceEvent();
            replaced.setType("SESSION_REPLACED");
            replaced.setRoomId(roomId.toString());
            replaced.setUserId(user.getUserId());
            replaced.setUsername(resolveUsername(user.getUserId()));
            replaced.setOnlineUserIds(new ArrayList<>(presenceTracker.getOnlineUserIds(roomId)));
            eventPublisher.publishPresence(roomId, replaced);
        });

        PresenceEvent event = new PresenceEvent();
        event.setType("JOINED");
        event.setRoomId(roomId.toString());
        event.setUserId(user.getUserId());
        event.setUsername(resolveUsername(user.getUserId()));
        event.setOnlineUserIds(new ArrayList<>(presenceTracker.getOnlineUserIds(roomId)));

        eventPublisher.publishPresence(roomId, event);
    }

    private AuthUserPrincipal requireUser(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken token
                && token.getPrincipal() instanceof AuthUserPrincipal authUser) {
            return authUser;
        }
        throw new IllegalArgumentException("Unauthenticated STOMP user");
    }

    private String resolveUsername(Integer userId) {
        return userRepository
                .getUserById(userId)
                .map(User::getUniqueUserId)
                .orElse("user-" + userId);
    }

}

    