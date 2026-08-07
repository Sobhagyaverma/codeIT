package com.codeit.modules.friends;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.modules.auth.SecurityUtils;
import com.codeit.modules.notifications.NotificationEventPublisher;
import com.codeit.modules.notifications.NotificationService;
import com.codeit.modules.user.User;
import com.codeit.modules.user.UserRepository;
import com.codeit.security.ratelimit.RateLimitProperties;
import com.codeit.security.ratelimit.RateLimitService;

@Service
public class FriendService {

    private final FriendRepository friendRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final NotificationEventPublisher notificationEventPublisher;
    private final RateLimitService rateLimitService;
    private final RateLimitProperties rateLimitProperties;

    public FriendService(
            FriendRepository friendRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            NotificationEventPublisher notificationEventPublisher,
            RateLimitService rateLimitService,
            RateLimitProperties rateLimitProperties) {
        this.friendRepository = friendRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.notificationEventPublisher = notificationEventPublisher;
        this.rateLimitService = rateLimitService;
        this.rateLimitProperties = rateLimitProperties;
    }

    public Map<String, Object> search(String uniqueUserId) {
        int me = SecurityUtils.currentUserId();
        Map<String, Object> preview = friendRepository
                .previewByUniqueUserId(uniqueUserId == null ? "" : uniqueUserId.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        int otherId = ((Number) preview.get("user_id")).intValue();
        Map<String, Object> body = new HashMap<>(preview);
        body.put("isSelf", otherId == me);
        body.put("isFriend", friendRepository.areFriends(me, otherId));
        body.put("outgoingPending", friendRepository.hasPending(me, otherId));
        body.put("incomingPending", friendRepository.hasPending(otherId, me));
        return body;
    }

    public Map<String, Object> sendRequest(String uniqueUserId) {
        int me = SecurityUtils.currentUserId();
        rateLimitService.checkTieredOrThrow(
                "friend-request", String.valueOf(me), rateLimitProperties.getFriendRequest());

        User target = userRepository.getUserByUniqueUserId(
                uniqueUserId == null ? "" : uniqueUserId.trim());
        if (target == null || target.getId() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        int toId = Integer.parseInt(target.getId());
        if (toId == me) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot friend yourself");
        }
        if (friendRepository.areFriends(me, toId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You are already friends.");
        }
        if (friendRepository.hasPending(me, toId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Friend request already sent.");
        }
        if (friendRepository.hasPending(toId, me)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "They already sent you a request — accept it instead.");
        }

        try {
            long requestId = friendRepository.insertRequest(me, toId);
            User meUser = userRepository.getUserById(me).orElse(null);
            String senderName = meUser != null ? meUser.getName() : "Someone";

            Map<String, Object> payload = new HashMap<>();
            payload.put("requestId", requestId);
            payload.put("fromUserId", me);
            payload.put("fromName", senderName);
            payload.put("fromUniqueUserId", meUser != null ? meUser.getUniqueUserId() : "");
            payload.put("fromAvatarUrl", meUser != null ? meUser.getAvatarUrl() : null);
            payload.put("message", senderName + " sent you a friend request.");
            notificationService.notify(toId, NotificationService.TYPE_FRIEND_REQUEST, payload);

            return Map.of("requestId", requestId, "status", "PENDING");
        } catch (org.springframework.dao.DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Friend request already sent.");
        }
    }

    /** Transactional so a request is never marked ACCEPTED without the friendship row. */
    @Transactional
    public Map<String, Object> respond(long requestId, String action) {
        int me = SecurityUtils.currentUserId();
        rateLimitService.checkTieredOrThrow(
                "friend-respond", String.valueOf(me), rateLimitProperties.getFriendRespond());

        FriendRequest req = friendRepository
                .findRequestById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        if (req.getToUserId() != me) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your request");
        }
        int senderId = req.getFromUserId();
        User sender = userRepository.getUserById(senderId).orElse(null);
        String senderName = sender != null ? sender.getName() : "They";

        // Stale inbox cards: request was already answered but the notification lingered.
        // Clear it and return the current outcome instead of a hard conflict.
        if (!"PENDING".equals(req.getStatus())) {
            notificationService.dismissFriendRequest(me, requestId, req.getStatus());
            Map<String, Object> body = new HashMap<>();
            body.put("status", req.getStatus());
            body.put("alreadyHandled", true);
            body.put("friends", "ACCEPTED".equals(req.getStatus()));
            body.put("userId", senderId);
            body.put("name", senderName);
            body.put("uniqueUserId", sender != null ? sender.getUniqueUserId() : "");
            return body;
        }

        String normalized = action == null ? "" : action.trim().toUpperCase();
        return switch (normalized) {
            case "ACCEPT" -> {
                int updated = friendRepository.updateRequestStatus(requestId, "ACCEPTED");
                if (updated == 0) {
                    notificationService.dismissFriendRequest(me, requestId, "ACCEPTED");
                    Map<String, Object> body = new HashMap<>();
                    body.put("status", "ACCEPTED");
                    body.put("alreadyHandled", true);
                    body.put("friends", true);
                    body.put("userId", senderId);
                    body.put("name", senderName);
                    body.put("uniqueUserId", sender != null ? sender.getUniqueUserId() : "");
                    yield body;
                }
                friendRepository.insertFriendship(senderId, me);
                notificationService.dismissFriendRequest(me, requestId, "ACCEPTED");

                User meUser = userRepository.getUserById(me).orElse(null);
                String myName = meUser != null ? meUser.getName() : "Someone";
                Map<String, Object> payload = new HashMap<>();
                payload.put("requestId", requestId);
                payload.put("fromUserId", me);
                payload.put("fromName", myName);
                payload.put("fromUniqueUserId", meUser != null ? meUser.getUniqueUserId() : "");
                payload.put("fromAvatarUrl", meUser != null ? meUser.getAvatarUrl() : null);
                payload.put("message", myName + " accepted your friend request.");
                notificationService.notify(senderId, NotificationService.TYPE_FRIEND_ACCEPTED, payload);

                notificationEventPublisher.publishFriendsChanged(
                        me, Map.of("reason", "ACCEPTED", "userId", senderId));
                notificationEventPublisher.publishFriendsChanged(
                        senderId, Map.of("reason", "ACCEPTED", "userId", me));

                Map<String, Object> body = new HashMap<>();
                body.put("status", "ACCEPTED");
                body.put("friends", true);
                body.put("userId", senderId);
                body.put("name", senderName);
                body.put("uniqueUserId", sender != null ? sender.getUniqueUserId() : "");
                yield body;
            }
            case "REJECT" -> {
                int updated = friendRepository.updateRequestStatus(requestId, "REJECTED");
                if (updated == 0) {
                    notificationService.dismissFriendRequest(me, requestId, "REJECTED");
                    yield Map.of("status", "REJECTED", "alreadyHandled", true, "userId", senderId);
                }
                notificationService.dismissFriendRequest(me, requestId, "REJECTED");
                yield Map.of("status", "REJECTED", "userId", senderId, "name", senderName);
            }
            case "IGNORE" -> {
                int updated = friendRepository.updateRequestStatus(requestId, "IGNORED");
                if (updated == 0) {
                    notificationService.dismissFriendRequest(me, requestId, "IGNORED");
                    yield Map.of("status", "IGNORED", "alreadyHandled", true, "userId", senderId);
                }
                notificationService.dismissFriendRequest(me, requestId, "IGNORED");
                yield Map.of("status", "IGNORED", "userId", senderId, "name", senderName);
            }
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "action must be ACCEPT, REJECT, or IGNORE");
        };
    }

    public Map<String, Object> removeFriend(int otherUserId) {
        int me = SecurityUtils.currentUserId();
        if (!friendRepository.areFriends(me, otherUserId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not friends");
        }
        friendRepository.removeFriendship(me, otherUserId);
        notificationEventPublisher.publishFriendsChanged(
                me, Map.of("reason", "REMOVED", "userId", otherUserId));
        notificationEventPublisher.publishFriendsChanged(
                otherUserId, Map.of("reason", "REMOVED", "userId", me));
        return Map.of("ok", true);
    }

    public Map<String, Object> listAll() {
        int me = SecurityUtils.currentUserId();
        List<Map<String, Object>> friends = friendRepository.listFriends(me);
        List<Map<String, Object>> incoming = friendRepository.listIncoming(me);
        List<Map<String, Object>> outgoing = friendRepository.listOutgoing(me);
        return Map.of(
                "friends", friends,
                "incoming", incoming,
                "outgoing", outgoing);
    }
}
