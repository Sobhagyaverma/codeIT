package com.codeit.config;

import java.util.List;
import java.util.UUID;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import com.codeit.modules.auth.AuthUserPrincipal;
import com.codeit.modules.auth.JwtService;
import com.codeit.modules.collaboration.repository.RoomMemberRepository;
import com.codeit.modules.collaboration.repository.RoomRepository;
import com.codeit.modules.collaboration.RoomStatus;
import com.codeit.modules.competition.CompetitionRepository;
import com.codeit.modules.quickclash.QuickContestRepository;
import com.codeit.modules.user.UserRepository;

@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final String USER_TOPIC_PREFIX = "/topic/users/";
    private static final String ROOM_TOPIC_PREFIX = "/topic/rooms/";
    private static final String COMPETITION_TOPIC_PREFIX = "/topic/competitions/";
    private static final String QUICK_CLASH_TOPIC_PREFIX = "/topic/quick-clash/";

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RoomRepository roomRepository;
    private final CompetitionRepository competitionRepository;
    private final QuickContestRepository quickContestRepository;

    public StompAuthChannelInterceptor(
            JwtService jwtService,
            UserRepository userRepository,
            RoomMemberRepository roomMemberRepository,
            RoomRepository roomRepository,
            CompetitionRepository competitionRepository,
            QuickContestRepository quickContestRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.roomRepository = roomRepository;
        this.competitionRepository = competitionRepository;
        this.quickContestRepository = quickContestRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = extractToken(accessor);
            if (token == null || !jwtService.isSessionToken(token)) {
                throw new IllegalArgumentException("STOMP CONNECT requires a valid session JWT");
            }

            Integer userId = jwtService.extractUserId(token);
            int claimTv = jwtService.extractTokenVersion(token);
            Integer dbTv = userRepository.getTokenVersion(userId);
            if (dbTv == null || claimTv != dbTv) {
                throw new IllegalArgumentException("STOMP CONNECT JWT is revoked or stale");
            }

            String role = userRepository.getUserById(userId)
                    .map(u -> u.getRole() != null ? u.getRole() : "USER")
                    .orElseThrow(() -> new IllegalArgumentException("STOMP CONNECT user not found"));

            AuthUserPrincipal principal = new AuthUserPrincipal(
                    userId,
                    jwtService.extractEmail(token),
                    null,
                    role);

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    principal, null, principal.getAuthorities());
            accessor.setUser(authentication);
        }

        // Clients must never publish to the broker. Only the server (SimpMessagingTemplate)
        // may send to /topic/**. Application destinations (/app/**) are the only allowed SENDs.
        if (StompCommand.SEND.equals(accessor.getCommand())) {
            rejectClientBrokerPublish(accessor);
        }

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            requireOwnUserTopic(accessor);
            requireRoomMembership(accessor);
            requireCompetitionSubscription(accessor);
            requireQuickClashSubscription(accessor);
        }

        return message;
    }

    private void rejectClientBrokerPublish(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || destination.isBlank()) {
            throw new IllegalArgumentException("STOMP SEND requires a destination");
        }
        if (destination.startsWith("/topic")
                || destination.startsWith("/queue")
                || destination.startsWith("/user")) {
            throw new IllegalArgumentException(
                    "Client SEND to broker destinations is forbidden; use /app only");
        }
        if (!destination.startsWith("/app")) {
            throw new IllegalArgumentException("STOMP SEND destination must start with /app");
        }
        if (currentUserId(accessor) == null) {
            throw new IllegalArgumentException("STOMP SEND requires authentication");
        }
    }

    private void requireOwnUserTopic(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || !destination.startsWith(USER_TOPIC_PREFIX)) {
            return;
        }

        String rest = destination.substring(USER_TOPIC_PREFIX.length());
        int slash = rest.indexOf('/');
        String idPart = slash >= 0 ? rest.substring(0, slash) : rest;

        Integer requestedId;
        try {
            requestedId = Integer.valueOf(idPart);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Malformed user topic: " + destination);
        }

        Integer currentId = currentUserId(accessor);
        if (currentId == null || !currentId.equals(requestedId)) {
            throw new IllegalArgumentException("Cannot subscribe to another user's topic");
        }
    }

    private void requireRoomMembership(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || !destination.startsWith(ROOM_TOPIC_PREFIX)) {
            return;
        }

        String rest = destination.substring(ROOM_TOPIC_PREFIX.length());
        int slash = rest.indexOf('/');
        String roomIdPart = slash >= 0 ? rest.substring(0, slash) : rest;

        UUID roomId;
        try {
            roomId = UUID.fromString(roomIdPart);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Malformed room topic: " + destination);
        }

        Integer currentId = currentUserId(accessor);
        if (currentId == null || !roomMemberRepository.exists(roomId, currentId)) {
            throw new IllegalArgumentException("Not a member of room " + roomId);
        }
        var room = roomRepository.findById(roomId).orElse(null);
        if (room == null || !RoomStatus.ACTIVE.name().equals(room.getStatus())) {
            throw new IllegalArgumentException("Room is not active");
        }
    }

    /**
     * Competition topics: must be a participant. Private session topics must be own user id.
     * Pattern: /topic/competitions/{id}/... and /topic/competitions/{id}/users/{uid}/session
     */
    private void requireCompetitionSubscription(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || !destination.startsWith(COMPETITION_TOPIC_PREFIX)) {
            return;
        }

        String rest = destination.substring(COMPETITION_TOPIC_PREFIX.length());
        int slash = rest.indexOf('/');
        String idPart = slash >= 0 ? rest.substring(0, slash) : rest;
        Integer competitionId;
        try {
            competitionId = Integer.valueOf(idPart);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Malformed competition topic: " + destination);
        }

        Integer currentId = currentUserId(accessor);
        if (currentId == null) {
            throw new IllegalArgumentException("Authentication required");
        }
        Integer joined = competitionRepository.alreadyJoined(competitionId, currentId);
        if (joined == null || joined == 0) {
            throw new IllegalArgumentException("Not a participant of competition " + competitionId);
        }

        // /topic/competitions/{id}/users/{uid}/session — only the owner
        String suffix = slash >= 0 ? rest.substring(slash + 1) : "";
        if (suffix.startsWith("users/")) {
            String afterUsers = suffix.substring("users/".length());
            int next = afterUsers.indexOf('/');
            String uidPart = next >= 0 ? afterUsers.substring(0, next) : afterUsers;
            try {
                Integer targetUid = Integer.valueOf(uidPart);
                if (!currentId.equals(targetUid)) {
                    throw new IllegalArgumentException("Cannot subscribe to another user's session topic");
                }
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Malformed competition user topic: " + destination);
            }
        }
    }

    private void requireQuickClashSubscription(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || !destination.startsWith(QUICK_CLASH_TOPIC_PREFIX)) {
            return;
        }

        String rest = destination.substring(QUICK_CLASH_TOPIC_PREFIX.length());
        int slash = rest.indexOf('/');
        String idPart = slash >= 0 ? rest.substring(0, slash) : rest;
        long contestId;
        try {
            contestId = Long.parseLong(idPart);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Malformed quick-clash topic: " + destination);
        }

        Integer currentId = currentUserId(accessor);
        if (currentId == null) {
            throw new IllegalArgumentException("Authentication required");
        }
        var contest = quickContestRepository.findContest(contestId).orElse(null);
        if (contest == null) {
            throw new IllegalArgumentException("Quick contest not found");
        }
        Integer hostId = contest.get("host_user_id") instanceof Number n ? n.intValue() : null;
        boolean visible = (hostId != null && hostId.equals(currentId))
                || quickContestRepository.findParticipant(contestId, currentId).isPresent();
        if (!visible) {
            throw new IllegalArgumentException("Not allowed to subscribe to quick-clash " + contestId);
        }
    }

    private Integer currentUserId(StompHeaderAccessor accessor) {
        if (accessor.getUser() instanceof UsernamePasswordAuthenticationToken token
                && token.getPrincipal() instanceof AuthUserPrincipal principal) {
            return principal.getUserId();
        }
        return null;
    }

    private String extractToken(StompHeaderAccessor accessor) {
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String header = authHeaders.get(0);
            if (header != null && header.startsWith("Bearer ")) {
                return header.substring(7);
            }
        }

        List<String> tokenHeaders = accessor.getNativeHeader("token");
        if (tokenHeaders != null && !tokenHeaders.isEmpty()) {
            return tokenHeaders.get(0);
        }
        return null;
    }
}
