package com.codeit.modules.collaboration.service;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.config.CollaborationLimitsProperties;
import com.codeit.modules.collaboration.Room;
import com.codeit.modules.collaboration.RoomMember;
import com.codeit.modules.collaboration.RoomMessage;
import com.codeit.modules.collaboration.RoomRole;
import com.codeit.modules.collaboration.RoomStatus;
import com.codeit.modules.collaboration.RoomType;
import com.codeit.modules.collaboration.UserRoomMembership;
import com.codeit.modules.collaboration.WorkspaceType;
import com.codeit.modules.auth.JwtService;
import com.codeit.modules.collaboration.dto.CreateRoomRequest;
import com.codeit.modules.collaboration.dto.RoomMemberResponse;
import com.codeit.modules.collaboration.dto.RoomMessageResponse;
import com.codeit.modules.collaboration.dto.RoomResponse;
import com.codeit.modules.collaboration.dto.RoomRunRequest;
import com.codeit.modules.collaboration.dto.RoomSubmitRequest;
import com.codeit.modules.collaboration.dto.RoomSummaryResponse;
import com.codeit.modules.collaboration.dto.SyncTokenResponse;
import com.codeit.modules.collaboration.events.CollaborationEventPublisher;
import com.codeit.modules.collaboration.events.RoomPresenceTracker;
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
import com.codeit.security.ratelimit.JudgeExecRateLimiter;
import com.codeit.security.ratelimit.RoomRestRateLimiter;

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
    private final JudgeExecRateLimiter judgeExecRateLimiter;
    private final RoomRestRateLimiter roomRestRateLimiter;
    private final CollaborationLimitsProperties collaborationLimits;
    private final RoomPresenceTracker presenceTracker;
    private final RoomExecutionGate roomExecutionGate;

    public CollaborationService(
            RoomRepository roomRepository,
            RoomMemberRepository roomMemberRepository,
            RoomMessageRepository roomMessageRepository,
            UserRepository userRepository,
            ProblemService problemService,
            CollaborationEventPublisher eventPublisher,
            JwtService jwtService,
            Judge0Service judge0Service,
            SubmissionService submissionService,
            JudgeExecRateLimiter judgeExecRateLimiter,
            RoomRestRateLimiter roomRestRateLimiter,
            CollaborationLimitsProperties collaborationLimits,
            RoomPresenceTracker presenceTracker,
            RoomExecutionGate roomExecutionGate) {
        this.roomRepository = roomRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.roomMessageRepository = roomMessageRepository;
        this.userRepository = userRepository;
        this.problemService = problemService;
        this.eventPublisher = eventPublisher;
        this.jwtService = jwtService;
        this.judge0Service = judge0Service;
        this.submissionService = submissionService;
        this.judgeExecRateLimiter = judgeExecRateLimiter;
        this.roomRestRateLimiter = roomRestRateLimiter;
        this.collaborationLimits = collaborationLimits;
        this.presenceTracker = presenceTracker;
        this.roomExecutionGate = roomExecutionGate;
    }

    @Transactional
    public RoomResponse createRoom(Integer hostUserId, CreateRoomRequest request) {
        roomRestRateLimiter.checkInvite(hostUserId);
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

        // Host may only have one ACTIVE room — resume when Invite targets the same one;
        // otherwise archive leftovers so Invite is never stuck outside a room.
        Optional<Room> existingActive = roomRepository.findActiveByHostUserId(hostUserId);
        if (existingActive.isPresent()) {
            Room existing = existingActive.get();
            boolean sameType = type.name().equals(existing.getType());
            boolean sameProblem =
                    type == RoomType.CODEROOM
                            || (existing.getProblemId() != null
                                    && existing.getProblemId().equals(problemId));
            if (sameType && sameProblem) {
                return toRoomResponse(existing);
            }
            roomRepository.archiveAllActiveByHostUserId(hostUserId);
        }

        // User may only belong to one ACTIVE room — leave others as non-host
        ensureSingleActiveMembership(hostUserId, null);

        String language = request.getLanguage();
        if (language == null || language.isBlank()) {
            language = "java";
        }

        String hostNote = normalizeHostNote(request.getHostNote());

        Room room = new Room();
        room.setId(UUID.randomUUID());
        room.setType(type.name());
        room.setProblemId(problemId);
        room.setHostUserId(hostUserId);
        room.setInviteToken(generateInviteToken());
        room.setActiveWorkspace(WorkspaceType.CODE.name());
        room.setLanguage(language.trim());
        room.setStatus(RoomStatus.ACTIVE.name());
        room.setHostNote(hostNote);

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

        // Leave+rejoin spam (same room): 10 / min
        roomRestRateLimiter.checkJoin(userId, room.getId());

        // Already a member of this room — just refresh presence timestamp
        if (roomMemberRepository.exists(room.getId(), userId)) {
            roomMemberRepository.updateLastSeen(room.getId(), userId);
            return toRoomResponse(room);
        }

        // Cannot join another room while hosting an active one
        roomRepository
                .findActiveByHostUserId(userId)
                .filter(hosted -> !hosted.getId().equals(room.getId()))
                .ifPresent(hosted -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "End your active room before joining another");
                });

        // One room at a time — leave other ACTIVE memberships (non-host)
        ensureSingleActiveMembership(userId, room.getId());

        int members = roomMemberRepository.countByRoomId(room.getId());
        if (members >= collaborationLimits.getMaxMembersPerRoom()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Room is full (max " + collaborationLimits.getMaxMembersPerRoom() + " participants)");
        }

        RoomMember member = new RoomMember();
        member.setRoomId(room.getId());
        member.setUserId(userId);
        member.setRole(RoomRole.EDITOR.name());
        roomMemberRepository.insert(member);

        roomMemberRepository.updateLastSeen(room.getId(), userId);
        return toRoomResponse(room);
    }

    /**
     * Host ends (archives) the room. Members are cleared; sync tokens stop working
     * because createSyncToken requires ACTIVE status.
     */
    @Transactional
    public RoomResponse endRoom(Integer actorUserId, UUID roomId) {
        requireHost(roomId, actorUserId);
        Room room = requireActiveRoom(roomId);

        roomRepository.updateStatus(roomId, RoomStatus.ARCHIVED.name());
        roomMemberRepository.deleteAllMembers(roomId);
        room.setStatus(RoomStatus.ARCHIVED.name());

        eventPublisher.publishRoomEnded(roomId, actorUserId);
        return toRoomResponse(room);
    }

    /**
     * Non-host leaves the room. Hosts must end or transfer first.
     */
    @Transactional
    public RoomResponse leaveRoom(Integer userId, UUID roomId) {
        Room room = requireActiveRoom(roomId);
        RoomMember member = roomMemberRepository
                .findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a room member"));

        if (RoomRole.HOST.name().equals(member.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Host cannot leave — end the room or transfer host first");
        }

        roomMemberRepository.delete(roomId, userId);
        return toRoomResponse(room);
    }

    public RoomResponse getRoom(Integer userId, UUID roomId) {
        Room room = requireRoom(roomId);
        requireMember(roomId, userId);
        roomMemberRepository.updateLastSeen(roomId, userId);
        return toRoomResponse(room);
    }

    public List<RoomSummaryResponse> listMyRooms(
            Integer userId, String type, String status, int limit) {
        String resolvedStatus =
                status == null || status.isBlank()
                        ? RoomStatus.ACTIVE.name()
                        : status.trim().toUpperCase();
        try {
            RoomStatus.valueOf(resolvedStatus);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "status must be ACTIVE or ARCHIVED");
        }

        String resolvedType = null;
        if (type != null && !type.isBlank()) {
            try {
                resolvedType = RoomType.valueOf(type.trim().toUpperCase()).name();
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "type must be PROBLEM_COLLAB or CODEROOM");
            }
        }

        int safeLimit = Math.min(Math.max(limit, 1), 50);
        return roomMemberRepository
                .findMembershipsByUserId(userId, resolvedStatus, resolvedType, safeLimit)
                .stream()
                .map(this::toRoomSummaryResponse)
                .toList();
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
        roomRestRateLimiter.checkTransferHost(actorUserId);
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
    public RoomResponse updateHostNote(Integer actorUserId, UUID roomId, String hostNote) {
        roomRestRateLimiter.checkRename(actorUserId);
        requireHost(roomId, actorUserId);
        Room room = requireActiveRoom(roomId);
        String normalized = normalizeHostNote(hostNote);
        roomRepository.updateHostNote(roomId, normalized);
        room.setHostNote(normalized);
        room.setUpdatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
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
        roomRestRateLimiter.checkChat(userId);
        requireMember(roomId, userId);

        if (content == null || content.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "content is required");
        }
        int maxChars = collaborationLimits.getMaxChatMessageChars();
        if (content.length() > maxChars) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "content too long (max " + maxChars + " characters)");
        }

        RoomMessage saved = roomMessageRepository.insert(roomId, userId, content.trim());
        RoomMessageResponse response = toMessageResponse(saved);
        eventPublisher.publishChat(roomId, response);
        return response;
    }

    public SyncTokenResponse createSyncToken(Integer userId, UUID roomId) {
        roomRestRateLimiter.checkSyncToken(userId);
        requireActiveRoom(roomId);
        requireMember(roomId, userId);

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
        judgeExecRateLimiter.checkRun(userId);
        if (request == null || request.getLanguageId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "languageId is required");
        }

        try (RoomExecutionGate.Handle ignored = roomExecutionGate.acquire(roomId)) {
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

        try (RoomExecutionGate.Handle ignored = roomExecutionGate.acquire(roomId)) {
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
    }

    // --- helpers ---

    /**
     * Enforce one ACTIVE membership at a time.
     * If the user is HOST of a different ACTIVE room, reject.
     * Otherwise leave non-host memberships (optionally keeping {@code keepRoomId}).
     */
    private void ensureSingleActiveMembership(Integer userId, UUID keepRoomId) {
        for (UserRoomMembership membership : roomMemberRepository.findActiveMembershipsByUserId(userId)) {
            if (keepRoomId != null && keepRoomId.equals(membership.getId())) {
                continue;
            }
            if (RoomRole.HOST.name().equals(membership.getRole())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "End your active room before joining or creating another");
            }
        }
        roomMemberRepository.deleteNonHostActiveMembershipsExcept(userId, keepRoomId);
    }

    private Room requireActiveRoom(UUID roomId) {
        Room room = requireRoom(roomId);
        if (!RoomStatus.ACTIVE.name().equals(room.getStatus())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Room is archived");
        }
        return room;
    }

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
        response.setHostNote(room.getHostNote());
        response.setCreatedAt(room.getCreatedAt());
        response.setUpdatedAt(room.getUpdatedAt());

        List<RoomMember> memberRows = roomMemberRepository.findByRoomId(room.getId());
        List<RoomMemberResponse> members = memberRows.stream()
                .map(this::toMemberResponse)
                .toList();
        response.setMembers(members);
        response.setMemberCount(members.size());

        RoomMember hostRow = memberRows.stream()
                .filter(m -> room.getHostUserId() != null && room.getHostUserId().equals(m.getUserId()))
                .findFirst()
                .orElse(null);
        String hostUsername = hostRow != null && hostRow.getUsername() != null
                ? hostRow.getUsername()
                : resolveUsername(room.getHostUserId());
        String hostName = hostRow != null && hostRow.getDisplayName() != null
                ? hostRow.getDisplayName()
                : (hostUsername != null ? hostUsername : "user-" + room.getHostUserId());
        response.setHostUsername(hostUsername);
        response.setHostName(hostName);
        return response;
    }

    private RoomSummaryResponse toRoomSummaryResponse(UserRoomMembership row) {
        RoomSummaryResponse response = new RoomSummaryResponse();
        response.setId(row.getId());
        response.setType(row.getType());
        response.setProblemId(row.getProblemId());
        response.setLanguage(row.getLanguage());
        response.setStatus(row.getStatus());
        response.setActiveWorkspace(row.getActiveWorkspace());
        response.setInviteToken(row.getInviteToken());
        response.setRole(row.getRole());
        response.setJoinedAt(row.getJoinedAt());
        response.setLastSeenAt(row.getLastSeenAt());
        response.setUpdatedAt(row.getUpdatedAt());
        response.setCreatedAt(row.getCreatedAt());
        response.setHostUserId(row.getHostUserId());
        response.setHostUsername(row.getHostUsername());
        String display = row.getHostName();
        if (display == null || display.isBlank()) {
            display = row.getHostUsername();
        }
        response.setHostName(display);
        response.setHostNote(row.getHostNote());
        response.setMemberCount(row.getMemberCount());
        response.setOnlineCount(presenceTracker.getOnlineUserIds(row.getId()).size());
        return response;
    }

    private String normalizeHostNote(String hostNote) {
        if (hostNote == null) {
            return null;
        }
        String trimmed = hostNote.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.length() > 280) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "hostNote must be at most 280 characters");
        }
        return trimmed;
    }

    private RoomMemberResponse toMemberResponse(RoomMember member) {
        RoomMemberResponse response = new RoomMemberResponse();
        response.setUserId(member.getUserId());
        String username = member.getUsername();
        if (username == null || username.isBlank()) {
            username = resolveUsername(member.getUserId());
        }
        response.setUsername(username);
        response.setRole(member.getRole());
        response.setJoinedAt(member.getJoinedAt());
        return response;
    }

    private RoomMessageResponse toMessageResponse(RoomMessage message) {
        RoomMessageResponse response = new RoomMessageResponse();
        response.setId(message.getId());
        response.setUserId(message.getUserId());
        String username = message.getUsername();
        if (username == null || username.isBlank()) {
            username = resolveUsername(message.getUserId());
        }
        response.setUsername(username);
        response.setContent(message.getContent());
        response.setCreatedAt(message.getCreatedAt());
        return response;
    }
}