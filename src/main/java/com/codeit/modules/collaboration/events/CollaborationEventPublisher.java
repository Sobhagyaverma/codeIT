package com.codeit.modules.collaboration.events;

import java.util.UUID;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.codeit.modules.collaboration.dto.PresenceEvent;
import com.codeit.modules.collaboration.dto.RoomMessageResponse;

@Service
public class CollaborationEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public CollaborationEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishChat(UUID roomId, RoomMessageResponse message) {
        messagingTemplate.convertAndSend(chatTopic(roomId), message);
    }

    public void publishPresence(UUID roomId, PresenceEvent event) {
        messagingTemplate.convertAndSend(presenceTopic(roomId), event);
    }

    public void publishWorkspace(UUID roomId, String workspace) {
        java.util.Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("roomId", roomId.toString());
        payload.put("workspace", workspace);
        messagingTemplate.convertAndSend(workspaceTopic(roomId), (Object) payload);
    }

    public void publishRun(UUID roomId, Object payload) {
        messagingTemplate.convertAndSend(runTopic(roomId), (Object) payload);
    }

    public void publishSubmit(UUID roomId, Object payload) {
        messagingTemplate.convertAndSend(submitTopic(roomId), (Object) payload);
    }

    public static String chatTopic(UUID roomId) {
        return "/topic/rooms/" + roomId + "/chat";
    }

    public static String presenceTopic(UUID roomId) {
        return "/topic/rooms/" + roomId + "/presence";
    }

    public static String workspaceTopic(UUID roomId) {
        return "/topic/rooms/" + roomId + "/workspace";
    }

    public static String runTopic(UUID roomId) {
        return "/topic/rooms/" + roomId + "/run";
    }

    public static String submitTopic(UUID roomId) {
        return "/topic/rooms/" + roomId + "/submit";
    }
}