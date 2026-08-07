package com.codeit.modules.collaboration.events;

import java.util.ArrayList;
import java.util.UUID;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.codeit.modules.collaboration.dto.PresenceEvent;
import com.codeit.modules.user.User;
import com.codeit.modules.user.UserRepository;

@Component
public class RoomPresenceDisconnectListener {

    private final RoomPresenceTracker presenceTracker;
    private final CollaborationEventPublisher eventPublisher;
    private final UserRepository userRepository;

    public RoomPresenceDisconnectListener(
            RoomPresenceTracker presenceTracker,
            CollaborationEventPublisher eventPublisher,
            UserRepository userRepository) {
        this.presenceTracker = presenceTracker;
        this.eventPublisher = eventPublisher;
        this.userRepository = userRepository;
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        if (sessionId == null) {
            return;
        }

        RoomPresenceTracker.LeaveResult left = presenceTracker.leaveWithResult(sessionId);
        if (left == null) {
            return;
        }

        // Multi-tab: only broadcast LEFT when the last session for this user is gone
        if (!left.lastSession()) {
            return;
        }

        UUID roomId = left.roomId();
        Integer userId = left.userId();

        PresenceEvent presenceEvent = new PresenceEvent();
        presenceEvent.setType("LEFT");
        presenceEvent.setRoomId(roomId.toString());
        presenceEvent.setUserId(userId);
        presenceEvent.setUsername(
                userRepository
                        .getUserById(userId)
                        .map(User::getUniqueUserId)
                        .orElse("user-" + userId));
        presenceEvent.setOnlineUserIds(new ArrayList<>(presenceTracker.getOnlineUserIds(roomId)));

        eventPublisher.publishPresence(roomId, presenceEvent);
    }
}
