package com.codeit.modules.quickclash;

import java.util.List;
import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class QuickContestEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public QuickContestEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishLobby(long contestId, Map<String, Object> payload) {
        String destination = "/topic/quick-clash/" + contestId + "/lobby";
        messagingTemplate.convertAndSend(destination, (Object) payload);
    }

    public void publishLeaderboard(long contestId, List<Map<String, Object>> board) {
        String destination = "/topic/quick-clash/" + contestId + "/leaderboard";
        messagingTemplate.convertAndSend(destination, (Object) board);
    }

    public void publishStatus(long contestId, Map<String, Object> payload) {
        String destination = "/topic/quick-clash/" + contestId + "/status";
        messagingTemplate.convertAndSend(destination, (Object) payload);
    }
}
