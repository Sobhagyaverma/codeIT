package com.codeit.config;

import java.util.List;

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

@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final String USER_TOPIC_PREFIX = "/topic/users/";

    private final JwtService jwtService;

    public StompAuthChannelInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = extractToken(accessor);
            if (token == null || !jwtService.isValid(token)) {
                throw new IllegalArgumentException("STOMP CONNECT requires a valid JWT");
            }

            AuthUserPrincipal principal = new AuthUserPrincipal(
                    jwtService.extractUserId(token),
                    jwtService.extractEmail(token),
                    null,
                    jwtService.extractRole(token));

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    principal, null, principal.getAuthorities());
            accessor.setUser(authentication);
        }

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            requireOwnUserTopic(accessor);
        }

        return message;
    }

    /**
     * Personal topics ({@code /topic/users/{id}/**}) carry private data such as friend
     * requests, so a session may only subscribe to its own.
     */
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

        // Fallback: some clients send "token" header
        List<String> tokenHeaders = accessor.getNativeHeader("token");
        if (tokenHeaders != null && !tokenHeaders.isEmpty()) {
            return tokenHeaders.get(0);
        }
        return null;
    }
}