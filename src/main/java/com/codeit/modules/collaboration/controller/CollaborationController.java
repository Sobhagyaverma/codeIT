package com.codeit.modules.collaboration.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.codeit.modules.auth.SecurityUtils;
import com.codeit.modules.collaboration.dto.CreateRoomRequest;
import com.codeit.modules.collaboration.dto.RoomMessageResponse;
import com.codeit.modules.collaboration.dto.RoomResponse;
import com.codeit.modules.collaboration.dto.RoomRunRequest;
import com.codeit.modules.collaboration.dto.RoomSubmitRequest;
import com.codeit.modules.collaboration.dto.SendMessageRequest;
import com.codeit.modules.collaboration.dto.SyncTokenResponse;
import com.codeit.modules.collaboration.dto.TransferHostRequest;
import com.codeit.modules.collaboration.dto.UpdateMemberRequest;
import com.codeit.modules.collaboration.dto.UpdateWorkspaceRequest;
import com.codeit.modules.collaboration.service.CollaborationService;
import com.codeit.modules.submission.dto.Judge0Result;
import com.codeit.modules.submission.dto.JudgeVerdictDTO;

@RestController
@RequestMapping("/api/rooms")
public class CollaborationController {

    private final CollaborationService collaborationService;

    public CollaborationController(CollaborationService collaborationService) {
        this.collaborationService = collaborationService;
    }

    @PostMapping
    public RoomResponse createRoom(@RequestBody CreateRoomRequest request) {
        Integer userId = SecurityUtils.currentUserId();
        return collaborationService.createRoom(userId, request);
    }

    @PostMapping("/join/{inviteToken}")
    public RoomResponse joinRoom(@PathVariable String inviteToken) {
        Integer userId = SecurityUtils.currentUserId();
        return collaborationService.joinByInviteToken(userId, inviteToken);
    }

    @GetMapping("/{roomId}")
    public RoomResponse getRoom(@PathVariable UUID roomId) {
        Integer userId = SecurityUtils.currentUserId();
        return collaborationService.getRoom(userId, roomId);
    }

    @PatchMapping("/{roomId}/members/{targetUserId}")
    public RoomResponse updateMemberRole(
            @PathVariable UUID roomId,
            @PathVariable Integer targetUserId,
            @RequestBody UpdateMemberRequest request) {
        Integer userId = SecurityUtils.currentUserId();
        return collaborationService.updateMemberRole(
                userId, roomId, targetUserId, request.getRole());
    }

    @DeleteMapping("/{roomId}/members/{targetUserId}")
    public RoomResponse removeMember(
            @PathVariable UUID roomId, @PathVariable Integer targetUserId) {
        Integer userId = SecurityUtils.currentUserId();
        return collaborationService.removeMember(userId, roomId, targetUserId);
    }

    @PostMapping("/{roomId}/transfer-host")
    public RoomResponse transferHost(
            @PathVariable UUID roomId, @RequestBody TransferHostRequest request) {
        Integer userId = SecurityUtils.currentUserId();
        return collaborationService.transferHost(userId, roomId, request.getNewHostUserId());
    }

    @PatchMapping("/{roomId}/workspace")
    public RoomResponse updateWorkspace(
            @PathVariable UUID roomId, @RequestBody UpdateWorkspaceRequest request) {
        Integer userId = SecurityUtils.currentUserId();
        return collaborationService.updateWorkspace(userId, roomId, request.getWorkspace());
    }

    @GetMapping("/{roomId}/messages")
    public List<RoomMessageResponse> getMessages(
            @PathVariable UUID roomId,
            @RequestParam(defaultValue = "50") int limit) {
        Integer userId = SecurityUtils.currentUserId();
        return collaborationService.getMessages(userId, roomId, limit);
    }

    @PostMapping("/{roomId}/messages")
    public RoomMessageResponse sendMessage(
            @PathVariable UUID roomId, @RequestBody SendMessageRequest request) {
        Integer userId = SecurityUtils.currentUserId();
        return collaborationService.sendMessage(userId, roomId, request.getContent());
    }

    @GetMapping("/{roomId}/sync-token")
    public SyncTokenResponse syncToken(@PathVariable UUID roomId) {
        Integer userId = SecurityUtils.currentUserId();
        return collaborationService.createSyncToken(userId, roomId);
    }

    @PostMapping("/{roomId}/run")
    public Judge0Result runShared(
            @PathVariable UUID roomId, @RequestBody RoomRunRequest request) {
        Integer userId = SecurityUtils.currentUserId();
        return collaborationService.runShared(userId, roomId, request);
    }

    @PostMapping("/{roomId}/submit")
    public JudgeVerdictDTO submitShared(
            @PathVariable UUID roomId, @RequestBody RoomSubmitRequest request) {
        Integer userId = SecurityUtils.currentUserId();
        return collaborationService.submitShared(userId, roomId, request);
    }
}                                                                                            