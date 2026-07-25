package com.codeit.modules.collaboration.service;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.modules.collaboration.Room;
import com.codeit.modules.collaboration.RoomMember;
import com.codeit.modules.collaboration.RoomMessage;
import com.codeit.modules.collaboration.RoomRole;
import com.codeit.modules.collaboration.RoomStatus;
import com.codeit.modules.collaboration.RoomType;
import com.codeit.modules.collaboration.WorkspaceType;
import com.codeit.modules.auth.JwtService;
import com.codeit.modules.collaboration.dto.CreateRoomRequest;
import com.codeit.modules.collaboration.dto.RoomMemberResponse;
import com.codeit.modules.collaboration.dto.RoomMessageResponse;
import com.codeit.modules.collaboration.dto.RoomResponse;
import com.codeit.modules.collaboration.dto.RoomRunRequest;
import com.codeit.modules.collaboration.dto.RoomSubmitRequest;
import com.codeit.modules.collaboration.dto.SyncTokenResponse;
import com.codeit.modules.collaboration.events.CollaborationEventPublisher;
import com.codeit.modules.collaboration.repository.RoomMemberRepository;
import com.codeit.modules.collaboration.repository.RoomMessageRepository;
import com.codeit.modules.collaboration.repository.RoomRepository;
import com.codeit.modules.problems.Problem;
import com.codeit.modules.problems.ProblemService;
import com.codeit.modules.submission.Judge0Service;
import com.codeit.modules.submission.Submission;
import com.codeit.modules.submission.SubmissionService;
import com.codeit.modules.submission.dto.Judge0Result;
import com.codeit.modules.submission.dto.JudgeVerdictDTO;
import com.codeit.modules.user.User;
import com.codeit.modules.user.UserRepository;

@Service
public class CollaborationService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RoomMessageRepository roomMessageRepository;
    private final UserRepository userRepository;
    private final ProblemService problemService;
    private final CollaborationEventPublisher eventPublisher;
    private final JwtService jwtService;
    private final Judge0Service judge0Service;
    private final SubmissionService submissionService;

    public CollaborationService(
            RoomRepository roomRepository,
            RoomMemberRepository roomMemberRepository,
            RoomMessageRepository roomMessageRepository,
            UserRepository userRepository,
            ProblemService problemService,
            CollaborationEventPublisher eventPublisher,
            JwtService jwtService,
            Judge0Service judge0Service,
            SubmissionService submissionService) {
        this.roomRepository = roomRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.roomMessageRepository = roomMessageRepository;
        this.userRepository = userRepository;
        this.problemService = problemService;
        this.eventPublisher = eventPublisher;
        this.jwtService = jwtService;
        this.judge0Service = judge0Service;
        this.submissionService = submissionService;
    }

    @Transactional
    public RoomResponse createRoom(Integer hostUserId, CreateRoomRequest request) {
        if (request == null || request.getType() == null || request.getType().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "type is required");
        }

        RoomType type;
        try {
            type = RoomType.valueOf(request.getType().trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "type must be PROBLEM_COLLAB or CODEROOM");
        }

        Integer problemId = request.getProblemId();
        if (type == RoomType.PROBLEM_COLLAB) {
            if (problemId == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "problemId is required for PROBLEM_COLLAB");
            }
            Problem problem = problemService.getProblemById(problemId);
            if (problem == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found");
            }
        } else {
            problemId = null;
        }

        String language = request.getLanguage();
        if (language == null || language.isBlank()) {
            language = "java";
        }

        Room room = new Room();
        room.setId(UUID.randomUUID());
        room.setType(type.name());
        room.setProblemId(problemId);
        room.setHostUserId(hostUserId);
        room.setInviteToken(generateInviteToken());
        room.setActiveWorkspace(WorkspaceType.CODE.name());
        room.setLanguage(language.trim());
        room.setStatus(RoomStatus.ACTIVE.name());

        roomRepository.insert(room);

        RoomMember host = new RoomMember();
        host.setRoomId(room.getId());
        host.setUserId(hostUserId);
        host.setRole(RoomRole.HOST.name());
        roomMemberRepository.insert(host);

        return toRoomResponse(room);
    }

    @Transactional
    public RoomResponse joinByInviteToken(Integer userId, String inviteToken) {
        if (inviteToken == null || inviteToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "inviteToken is required");
        }

        Room room = roomRepository
                .findByInviteToken(inviteToken.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));

        if (!RoomStatus.ACTIVE.name().equals(room.getStatus())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Room is archived");
        }

        if (!roomMemberRepository.exists(room.getId(), userId)) {
            RoomMember member = new RoomMember();
            member.setRoomId(room.getId());
            member.setUserId(userId);
            member.setRole(RoomRole.EDITOR.name());
            roomMemberRepository.insert(member);
        }

        roomMemberRepository.updateLastSeen(room.getId(), userId);
        return toRoomResponse(room);
    }

    public RoomResponse getRoom(Integer userId, UUID roomId) {
        Room room = requireRoom(roomId);
        requireMember(roomId, userId);
        roomMemberRepository.updateLastSeen(roomId, userId);
        return toRoomResponse(room);
    }

    @Transactional
    public RoomResponse updateMemberRole(
            Integer actorUserId, UUID roomId, Integer targetUserId, String newRole) {
        requireHost(roomId, actorUserId);
        requireMember(roomId, targetUserId);

        RoomRole role;
        try {
            role = RoomRole.valueOf(newRole.trim().toUpperCase());
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "role must be HOST, EDITOR, or VIEWER");
        }

        if (role == RoomRole.HOST) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Use transfer-host to make someone HOST");
        }

        Room room = requireRoom(roomId);
        if (room.getHostUserId().equals(targetUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Cannot change the current host role this way");
        }

        roomMemberRepository.updateRole(roomId, targetUserId, role.name());
        return toRoomResponse(room);
    }

    @Transactional
    public RoomResponse removeMember(Integer actorUserId, UUID roomId, Integer targetUserId) {
        requireHost(roomId, actorUserId);

        Room room = requireRoom(roomId);
        if (room.getHostUserId().equals(targetUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot remove the host");
        }

        requireMember(roomId, targetUserId);
        roomMemberRepository.delete(roomId, targetUserId);
        return toRoomResponse(room);
    }

    @Transactional
    public RoomResponse transferHost(Integer actorUserId, UUID roomId, Integer newHostUserId) {
        requireHost(roomId, actorUserId);
        requireMember(roomId, newHostUserId);

        if (actorUserId.equals(newHostUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Already the host");
        }

        Room room = requireRoom(roomId);

        roomMemberRepository.updateRole(roomId, newHostUserId, RoomRole.HOST.name());
        roomMemberRepository.updateRole(roomId, actorUserId, RoomRole.EDITOR.name());
        roomRepository.updateHost(roomId, newHostUserId);

        room.setHostUserId(newHostUserId);
        return toRoomResponse(room);
    }

    @Transactional
    public RoomResponse updateWorkspace(Integer actorUserId, UUID roomId, String workspace) {
        requireHost(roomId, actorUserId);
        Room room = requireRoom(roomId);

        if (!RoomType.CODEROOM.name().equals(room.getType())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Workspace switch is only for CODEROOM");
        }

        WorkspaceType ws;
        try {
            ws = WorkspaceType.valueOf(workspace.trim().toUpperCase());
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "workspace must be CODE or WHITEBOARD");
        }

        roomRepository.updateWorkspace(roomId, ws.name());
        room.setActiveWorkspace(ws.name());
        eventPublisher.publishWorkspace(roomId, ws.name());
        return toRoomResponse(room);
    }

    public List<RoomMessageResponse> getMessages(Integer userId, UUID roomId, int limit) {
        requireMember(roomId, userId);
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        return roomMessageRepository.findRecentByRoomId(roomId, safeLimit).stream()
                .map(this::toMessageResponse)
                .toList();
    }

    @Transactional
    public RoomMessageResponse sendMessage(Integer userId, UUID roomId, String content) {
        requireMember(roomId, userId);

        if (content == null || content.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "content is required");
        }
        if (content.length() > 4000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "content too long");
        }

        RoomMessage saved = roomMessageRepository.insert(roomId, userId, content.trim());
        RoomMessageResponse response = toMessageResponse(saved);
        eventPublisher.publishChat(roomId, response);
        return response;
    }

    public SyncTokenResponse createSyncToken(Integer userId, UUID roomId) {
        requireMember(roomId, userId);
        requireRoom(roomId);

        String email = userRepository
                .getUserById(userId)
                .map(User::getEmail)
                .orElse(String.valueOf(userId));

        String token = jwtService.generateSyncToken(userId, email, roomId);
        SyncTokenResponse response = new SyncTokenResponse();
        response.setToken(token);
        response.setExpiresInMs(jwtService.getSyncTokenTtlMs());
        response.setCodeDocName("room:" + roomId + ":code");
        response.setWhiteboardDocName("room:" + roomId + ":whiteboard");
        return response;
    }

    public boolean canEdit(Integer userId, UUID roomId) {
        return roomMemberRepository
                .findByRoomIdAndUserId(roomId, userId)
                .map(m -> RoomRole.HOST.name().equals(m.getRole())
                        || RoomRole.EDITOR.name().equals(m.getRole()))
                .orElse(false);
    }

    public Judge0Result runShared(Integer userId, UUID roomId, RoomRunRequest request) {
        requireMember(roomId, userId);
        if (!canEdit(userId, roomId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Viewers cannot run code");
        }
        if (request == null || request.getLanguageId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "languageId is required");
        }
        eventPublisher.publishRun(roomId, java.util.Map.of(
                "status", "STARTED",
                "userId", userId,
                "roomId", roomId.toString()));

        Judge0Result result = judge0Service.executeCode(
                request.getSourceCode(),
                request.getLanguageId(),
                request.getStdin());

        java.util.Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("status", "COMPLETED");
        payload.put("userId", userId);
        payload.put("roomId", roomId.toString());
        payload.put("result", result);
        eventPublisher.publishRun(roomId, payload);
        return result;
    }

    public JudgeVerdictDTO submitShared(Integer userId, UUID roomId, RoomSubmitRequest request) {
        requireMember(roomId, userId);
        if (!canEdit(userId, roomId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Viewers cannot submit");
        }
        Room room = requireRoom(roomId);
        if (!RoomType.PROBLEM_COLLAB.name().equals(room.getType()) || room.getProblemId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Submit is only available for PROBLEM_COLLAB rooms");
        }
        if (request == null || request.getLanguageId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "languageId is required");
        }

        eventPublisher.publishSubmit(roomId, java.util.Map.of(
                "status", "STARTED",
                "userId", userId,
                "roomId", roomId.toString()));

        Submission submission = new Submission();
        submission.setUserId(userId);
        submission.setProblemId(room.getProblemId());
        submission.setCode(request.getCode());
        submission.setLanguageId(request.getLanguageId());

        JudgeVerdictDTO verdict = submissionService.submit(submission);

        java.util.Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("status", "COMPLETED");
        payload.put("userId", userId);
        payload.put("roomId", roomId.toString());
        payload.put("verdict", verdict);
        eventPublisher.publishSubmit(roomId, payload);
        return verdict;
    }

    // --- helpers ---

    private Room requireRoom(UUID roomId) {
        return roomRepository
                .findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
    }

    private void requireMember(UUID roomId, Integer userId) {
        if (!roomMemberRepository.exists(roomId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a room member");
        }
    }

    private void requireHost(UUID roomId, Integer userId) {
        RoomMember member = roomMemberRepository
                .findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a room member"));
        if (!RoomRole.HOST.name().equals(member.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host can do this");
        }
    }

    private String generateInviteToken() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private String resolveUsername(Integer userId) {
        return userRepository
                .getUserById(userId)
                .map(User::getUniqueUserId)
                .orElse("user-" + userId);
    }

    private RoomResponse toRoomResponse(Room room) {
        RoomResponse response = new RoomResponse();
        response.setId(room.getId());
        response.setType(room.getType());
        response.setProblemId(room.getProblemId());
        response.setHostUserId(room.getHostUserId());
        response.setInviteToken(room.getInviteToken());
        response.setActiveWorkspace(room.getActiveWorkspace());
        response.setLanguage(room.getLanguage());
        response.setStatus(room.getStatus());
        response.setCreatedAt(room.getCreatedAt());
        response.setUpdatedAt(room.getUpdatedAt());

        List<RoomMemberResponse> members = roomMemberRepository.findByRoomId(room.getId()).stream()
                .map(this::toMemberResponse)
                .toList();
        response.setMembers(members);
        return response;
    }

    private RoomMemberResponse toMemberResponse(RoomMember member) {
        RoomMemberResponse response = new RoomMemberResponse();
        response.setUserId(member.getUserId());
        response.setUsername(resolveUsername(member.getUserId()));
        response.setRole(member.getRole());
        response.setJoinedAt(member.getJoinedAt());
        return response;
    }

    private RoomMessageResponse toMessageResponse(RoomMessage message) {
        RoomMessageResponse response = new RoomMessageResponse();
        response.setId(message.getId());
        response.setUserId(message.getUserId());
        response.setUsername(resolveUsername(message.getUserId()));
        response.setContent(message.getContent());
        response.setCreatedAt(message.getCreatedAt());
        return response;
    }
}