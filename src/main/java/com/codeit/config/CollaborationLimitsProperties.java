package com.codeit.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Hard caps for CodeRoom / collab (members, chat, STOMP tabs).
 */
@ConfigurationProperties(prefix = "codeit.collaboration")
public class CollaborationLimitsProperties {

    /** Max DB members in one ACTIVE room (including host). */
    private int maxMembersPerRoom = 10;

    /** Max chat message length (characters). */
    private int maxChatMessageChars = 2000;

    /**
     * Max concurrent STOMP presence sessions per user per room (tabs).
     * Extra tabs displace the oldest session.
     */
    private int maxStompSessionsPerUserPerRoom = 2;

    /** Max Excalidraw elements published to a shared whiteboard. */
    private int maxWhiteboardElements = 2000;

    /** Max canvas strokes (stitch whiteboard). */
    private int maxWhiteboardStrokes = 500;

    /** Max points per stroke. */
    private int maxStrokePoints = 400;

    /** Local undo/redo stack depth for canvas boards. */
    private int maxUndoSteps = 50;

    public int getMaxMembersPerRoom() {
        return maxMembersPerRoom;
    }

    public void setMaxMembersPerRoom(int maxMembersPerRoom) {
        this.maxMembersPerRoom = maxMembersPerRoom;
    }

    public int getMaxChatMessageChars() {
        return maxChatMessageChars;
    }

    public void setMaxChatMessageChars(int maxChatMessageChars) {
        this.maxChatMessageChars = maxChatMessageChars;
    }

    public int getMaxStompSessionsPerUserPerRoom() {
        return maxStompSessionsPerUserPerRoom;
    }

    public void setMaxStompSessionsPerUserPerRoom(int maxStompSessionsPerUserPerRoom) {
        this.maxStompSessionsPerUserPerRoom = maxStompSessionsPerUserPerRoom;
    }

    public int getMaxWhiteboardElements() {
        return maxWhiteboardElements;
    }

    public void setMaxWhiteboardElements(int maxWhiteboardElements) {
        this.maxWhiteboardElements = maxWhiteboardElements;
    }

    public int getMaxWhiteboardStrokes() {
        return maxWhiteboardStrokes;
    }

    public void setMaxWhiteboardStrokes(int maxWhiteboardStrokes) {
        this.maxWhiteboardStrokes = maxWhiteboardStrokes;
    }

    public int getMaxStrokePoints() {
        return maxStrokePoints;
    }

    public void setMaxStrokePoints(int maxStrokePoints) {
        this.maxStrokePoints = maxStrokePoints;
    }

    public int getMaxUndoSteps() {
        return maxUndoSteps;
    }

    public void setMaxUndoSteps(int maxUndoSteps) {
        this.maxUndoSteps = maxUndoSteps;
    }
}
