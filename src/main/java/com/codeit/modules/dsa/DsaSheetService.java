package com.codeit.modules.dsa;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.modules.admin.AdminAuditService;
import com.codeit.modules.auth.SecurityUtils;
import com.codeit.modules.dsa.dto.AssignProblemsRequest;
import com.codeit.modules.dsa.dto.AssignProblemsResponse;
import com.codeit.modules.dsa.dto.CreateDsaFolderRequest;
import com.codeit.modules.dsa.dto.DsaSheetResponse;
import com.codeit.modules.dsa.dto.DsaTreeFolderNode;
import com.codeit.modules.dsa.dto.DsaTreeProblemNode;
import com.codeit.modules.dsa.dto.MoveFolderRequest;
import com.codeit.modules.dsa.dto.MoveProblemRequest;
import com.codeit.modules.dsa.dto.ReorderFoldersRequest;
import com.codeit.modules.dsa.dto.ReorderProblemsRequest;
import com.codeit.modules.dsa.dto.UpdateDsaFolderRequest;
import com.codeit.security.ratelimit.ClientIpResolver;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class DsaSheetService {

    public enum DeleteMode {
        UNASSIGN,
        MOVE_TO_PARENT
    }

    private final DsaSheetRepository repository;
    private final AdminAuditService adminAuditService;

    public DsaSheetService(DsaSheetRepository repository, AdminAuditService adminAuditService) {
        this.repository = repository;
        this.adminAuditService = adminAuditService;
    }

    public List<DsaSheetResponse> listSheets() {
        return repository.listSheets().stream().map(this::toSheetResponse).toList();
    }

    public List<DsaTreeFolderNode> getTree(int sheetId) {
        requireSheet(sheetId);
        List<DsaFolder> folders = repository.listFoldersForSheet(sheetId);
        List<DsaSheetRepository.FolderProblemRow> problemRows = repository.listFolderProblemRows(sheetId);

        Map<Integer, DsaTreeFolderNode> nodes = new LinkedHashMap<>();
        for (DsaFolder f : folders) {
            nodes.put(f.getId(), toFolderNode(f));
        }

        Map<Integer, List<DsaTreeProblemNode>> problemsByFolder = new HashMap<>();
        for (DsaSheetRepository.FolderProblemRow row : problemRows) {
            problemsByFolder
                    .computeIfAbsent(row.folderId(), k -> new ArrayList<>())
                    .add(row.problem());
        }

        for (DsaTreeFolderNode node : nodes.values()) {
            List<DsaTreeProblemNode> probs = problemsByFolder.getOrDefault(node.getId(), List.of());
            node.setProblems(new ArrayList<>(probs));
            node.setDirectProblemCount(probs.size());
        }

        List<DsaTreeFolderNode> roots = new ArrayList<>();
        for (DsaFolder f : folders) {
            DsaTreeFolderNode node = nodes.get(f.getId());
            if (f.getParentId() == null) {
                roots.add(node);
            } else {
                DsaTreeFolderNode parent = nodes.get(f.getParentId());
                if (parent != null) {
                    parent.getChildren().add(node);
                } else {
                    roots.add(node);
                }
            }
        }

        for (DsaTreeFolderNode root : roots) {
            computeAggregates(root);
        }
        return roots;
    }

    @Transactional
    public DsaTreeFolderNode createFolder(int sheetId, CreateDsaFolderRequest request, HttpServletRequest http) {
        requireSheet(sheetId);
        String name = normalizeName(request.getName());
        Integer parentId = request.getParentId();

        if (parentId != null) {
            DsaFolder parent = requireFolder(parentId);
            if (!Objects.equals(parent.getSheetId(), sheetId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent folder is on a different sheet");
            }
        }

        if (repository.siblingNameExists(sheetId, parentId, name, null)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A folder with this name already exists here");
        }

        int position = repository.nextFolderPosition(sheetId, parentId);
        String description = blankToNull(request.getDescription());
        DsaFolder created = repository.insertFolder(sheetId, parentId, name, description, position);
        repository.touchSheet(sheetId);
        audit(http, "DSA_FOLDER_CREATE", created.getId(), "name=" + name);

        DsaTreeFolderNode node = toFolderNode(created);
        computeAggregates(node);
        return node;
    }

    @Transactional
    public DsaTreeFolderNode updateFolder(int folderId, UpdateDsaFolderRequest request, HttpServletRequest http) {
        DsaFolder folder = requireFolder(folderId);
        String name = request.getName() != null ? normalizeName(request.getName()) : folder.getName();
        String description = request.getDescription() != null
                ? blankToNull(request.getDescription())
                : folder.getDescription();

        if (repository.siblingNameExists(folder.getSheetId(), folder.getParentId(), name, folderId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A folder with this name already exists here");
        }

        repository.updateFolder(folderId, name, description);
        repository.touchSheet(folder.getSheetId());
        audit(http, "DSA_FOLDER_UPDATE", folderId, "name=" + name);

        return getTree(folder.getSheetId()).stream()
                .map(n -> findNode(n, folderId))
                .filter(Objects::nonNull)
                .findFirst()
                .orElseGet(() -> {
                    DsaFolder refreshed = requireFolder(folderId);
                    DsaTreeFolderNode node = toFolderNode(refreshed);
                    computeAggregates(node);
                    return node;
                });
    }

    @Transactional
    public void deleteFolder(int folderId, DeleteMode mode, HttpServletRequest http) {
        DsaFolder folder = requireFolder(folderId);
        int sheetId = folder.getSheetId();

        if (mode == DeleteMode.MOVE_TO_PARENT) {
            Integer parentId = folder.getParentId();
            List<DsaFolder> children = repository.listSiblings(sheetId, folderId);

            for (DsaFolder child : children) {
                if (repository.siblingNameExists(sheetId, parentId, child.getName(), child.getId())) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Cannot move contents to parent: name conflict for \"" + child.getName() + "\"");
                }
            }

            int basePos = repository.nextFolderPosition(sheetId, parentId);
            int i = 0;
            for (DsaFolder child : children) {
                repository.updateFolderParentAndPosition(child.getId(), parentId, basePos + i);
                i++;
            }

            if (parentId != null) {
                repository.moveProblemsToFolder(folderId, parentId);
            } else {
                // Root delete with MOVE_TO_PARENT: problems have nowhere to go — unassign
                for (Integer problemId : repository.listProblemIdsInFolder(folderId)) {
                    repository.deleteFolderProblem(folderId, problemId);
                }
            }
        }
        // UNASSIGN: cascade deletes child folders + links via FK; problems table untouched

        repository.deleteFolder(folderId);
        repository.touchSheet(sheetId);
        audit(http, "DSA_FOLDER_DELETE", folderId, "mode=" + mode);
    }

    @Transactional
    public AssignProblemsResponse assignProblems(
            int folderId, AssignProblemsRequest request, HttpServletRequest http) {
        DsaFolder folder = requireFolder(folderId);
        List<Integer> already = new ArrayList<>();
        List<Integer> missing = new ArrayList<>();
        int added = 0;

        for (Integer problemId : request.getProblemIds()) {
            if (problemId == null) {
                continue;
            }
            if (!repository.problemExists(problemId)) {
                missing.add(problemId);
                continue;
            }
            if (repository.folderHasProblem(folderId, problemId)) {
                already.add(problemId);
                continue;
            }
            int pos = repository.nextProblemPosition(folderId);
            repository.insertFolderProblem(folderId, problemId, pos);
            added++;
        }

        if (added > 0) {
            repository.touchFolder(folderId);
            repository.touchSheet(folder.getSheetId());
            audit(http, "DSA_PROBLEM_ASSIGN", folderId, "added=" + added);
        }

        return new AssignProblemsResponse(added, already, missing);
    }

    @Transactional
    public void removeProblem(int folderId, int problemId, HttpServletRequest http) {
        requireFolder(folderId);
        int deleted = repository.deleteFolderProblem(folderId, problemId);
        if (deleted == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem is not in this folder");
        }
        repository.touchFolder(folderId);
        audit(http, "DSA_PROBLEM_REMOVE", folderId, "problemId=" + problemId);
    }

    @Transactional
    public void moveFolder(int folderId, MoveFolderRequest request, HttpServletRequest http) {
        DsaFolder folder = requireFolder(folderId);
        Integer newParentId = request.getParentId();

        if (Objects.equals(folderId, newParentId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot move a folder into itself");
        }
        if (newParentId != null) {
            DsaFolder newParent = requireFolder(newParentId);
            if (!Objects.equals(newParent.getSheetId(), folder.getSheetId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot move across sheets");
            }
            if (repository.isDescendant(folderId, newParentId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Cannot move a folder into one of its descendants");
            }
        }

        if (repository.siblingNameExists(folder.getSheetId(), newParentId, folder.getName(), folderId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A folder with this name already exists there");
        }

        Integer oldParentId = folder.getParentId();
        int position = request.getPosition() != null
                ? request.getPosition()
                : repository.nextFolderPosition(folder.getSheetId(), newParentId);

        repository.updateFolderParentAndPosition(folderId, newParentId, position);
        renumberSiblings(folder.getSheetId(), oldParentId);
        renumberSiblings(folder.getSheetId(), newParentId);
        repository.touchSheet(folder.getSheetId());
        audit(http, "DSA_FOLDER_MOVE", folderId, "parentId=" + newParentId);
    }

    @Transactional
    public void moveProblem(int folderId, int problemId, MoveProblemRequest request, HttpServletRequest http) {
        DsaFolder from = requireFolder(folderId);
        DsaFolder to = requireFolder(request.getTargetFolderId());
        if (!Objects.equals(from.getSheetId(), to.getSheetId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot move across sheets");
        }
        if (!repository.folderHasProblem(folderId, problemId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem is not in this folder");
        }
        if (!Objects.equals(folderId, to.getId()) && repository.folderHasProblem(to.getId(), problemId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Problem is already in the destination folder");
        }

        int position = request.getPosition() != null
                ? request.getPosition()
                : repository.nextProblemPosition(to.getId());

        repository.moveProblemLink(folderId, problemId, to.getId(), position);
        renumberProblems(folderId);
        if (!Objects.equals(folderId, to.getId())) {
            renumberProblems(to.getId());
        }
        repository.touchFolder(folderId);
        repository.touchFolder(to.getId());
        audit(http, "DSA_PROBLEM_MOVE", problemId, "from=" + folderId + " to=" + to.getId());
    }

    @Transactional
    public void reorderFolders(ReorderFoldersRequest request, HttpServletRequest http) {
        requireSheet(request.getSheetId());
        List<DsaFolder> siblings = repository.listSiblings(request.getSheetId(), request.getParentId());
        if (siblings.size() != request.getFolderIds().size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reorder list must include all siblings");
        }
        Map<Integer, DsaFolder> byId = new HashMap<>();
        for (DsaFolder f : siblings) {
            byId.put(f.getId(), f);
        }
        for (Integer id : request.getFolderIds()) {
            if (!byId.containsKey(id)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Folder is not a sibling in this group");
            }
        }
        int pos = 0;
        for (Integer id : request.getFolderIds()) {
            repository.updateFolderPosition(id, pos++);
        }
        repository.touchSheet(request.getSheetId());
        audit(http, "DSA_FOLDER_REORDER", request.getSheetId(), "parentId=" + request.getParentId());
    }

    @Transactional
    public void reorderProblems(int folderId, ReorderProblemsRequest request, HttpServletRequest http) {
        requireFolder(folderId);
        List<Integer> existing = repository.listProblemIdsInFolder(folderId);
        if (existing.size() != request.getProblemIds().size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reorder list must include all problems");
        }
        for (Integer id : request.getProblemIds()) {
            if (!existing.contains(id)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Problem is not in this folder");
            }
        }
        int pos = 0;
        for (Integer id : request.getProblemIds()) {
            repository.updateProblemPosition(folderId, id, pos++);
        }
        repository.touchFolder(folderId);
        audit(http, "DSA_PROBLEM_REORDER", folderId, null);
    }

    private void renumberSiblings(int sheetId, Integer parentId) {
        List<DsaFolder> siblings = repository.listSiblings(sheetId, parentId);
        int pos = 0;
        for (DsaFolder f : siblings) {
            repository.updateFolderPosition(f.getId(), pos++);
        }
    }

    private void renumberProblems(int folderId) {
        List<Integer> ids = repository.listProblemIdsInFolder(folderId);
        int pos = 0;
        for (Integer id : ids) {
            repository.updateProblemPosition(folderId, id, pos++);
        }
    }

    private int computeAggregates(DsaTreeFolderNode node) {
        int total = node.getProblems().size();
        node.setSubfolderCount(node.getChildren().size());
        for (DsaTreeFolderNode child : node.getChildren()) {
            total += computeAggregates(child);
        }
        node.setTotalProblemCount(total);
        return total;
    }

    private DsaTreeFolderNode findNode(DsaTreeFolderNode node, int id) {
        if (Objects.equals(node.getId(), id)) {
            return node;
        }
        for (DsaTreeFolderNode child : node.getChildren()) {
            DsaTreeFolderNode found = findNode(child, id);
            if (found != null) {
                return found;
            }
        }
        return null;
    }

    private DsaSheet requireSheet(int sheetId) {
        return repository.findSheet(sheetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "DSA sheet not found"));
    }

    private DsaFolder requireFolder(int folderId) {
        return repository.findFolder(folderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Folder not found"));
    }

    private static String normalizeName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Folder name is required");
        }
        String trimmed = name.trim();
        if (trimmed.length() > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Folder name is too long");
        }
        return trimmed;
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private DsaSheetResponse toSheetResponse(DsaSheet sheet) {
        DsaSheetResponse r = new DsaSheetResponse();
        r.setId(sheet.getId());
        r.setName(sheet.getName());
        r.setDescription(sheet.getDescription());
        r.setCreatedAt(sheet.getCreatedAt());
        r.setUpdatedAt(sheet.getUpdatedAt());
        return r;
    }

    private DsaTreeFolderNode toFolderNode(DsaFolder f) {
        DsaTreeFolderNode n = new DsaTreeFolderNode();
        n.setId(f.getId());
        n.setSheetId(f.getSheetId());
        n.setParentId(f.getParentId());
        n.setName(f.getName());
        n.setDescription(f.getDescription());
        n.setPosition(f.getPosition());
        n.setCreatedAt(f.getCreatedAt());
        n.setUpdatedAt(f.getUpdatedAt());
        return n;
    }

    private void audit(HttpServletRequest http, String action, Integer entityId, String detail) {
        Integer adminId = null;
        try {
            adminId = SecurityUtils.currentUserId();
        } catch (Exception ignored) {
            // best-effort
        }
        String ip = http != null ? ClientIpResolver.resolve(http) : null;
        adminAuditService.log(
                adminId,
                action,
                "dsa",
                entityId == null ? null : String.valueOf(entityId),
                detail,
                ip,
                true);
    }
}
