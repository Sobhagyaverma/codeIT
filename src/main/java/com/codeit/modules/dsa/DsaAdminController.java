package com.codeit.modules.dsa;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.modules.dsa.dto.AssignProblemsRequest;
import com.codeit.modules.dsa.dto.AssignProblemsResponse;
import com.codeit.modules.dsa.dto.CreateDsaFolderRequest;
import com.codeit.modules.dsa.dto.DsaSheetResponse;
import com.codeit.modules.dsa.dto.DsaTreeFolderNode;
import com.codeit.modules.dsa.dto.MoveFolderRequest;
import com.codeit.modules.dsa.dto.MoveProblemRequest;
import com.codeit.modules.dsa.dto.ReorderFoldersRequest;
import com.codeit.modules.dsa.dto.ReorderProblemsRequest;
import com.codeit.modules.dsa.dto.UpdateDsaFolderRequest;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/dsa")
@Validated
public class DsaAdminController {

    private final DsaSheetService service;

    public DsaAdminController(DsaSheetService service) {
        this.service = service;
    }

    @GetMapping("/sheets")
    public List<DsaSheetResponse> listSheets() {
        return service.listSheets();
    }

    @GetMapping("/sheets/{sheetId}/tree")
    public List<DsaTreeFolderNode> getTree(@PathVariable int sheetId) {
        return service.getTree(sheetId);
    }

    @PostMapping("/sheets/{sheetId}/folders")
    public DsaTreeFolderNode createFolder(
            @PathVariable int sheetId,
            @Valid @RequestBody CreateDsaFolderRequest request,
            HttpServletRequest http) {
        return service.createFolder(sheetId, request, http);
    }

    @PatchMapping("/folders/{id}")
    public DsaTreeFolderNode updateFolder(
            @PathVariable int id,
            @Valid @RequestBody UpdateDsaFolderRequest request,
            HttpServletRequest http) {
        return service.updateFolder(id, request, http);
    }

    @DeleteMapping("/folders/{id}")
    public Map<String, Object> deleteFolder(
            @PathVariable int id,
            @RequestParam(defaultValue = "UNASSIGN") String mode,
            HttpServletRequest http) {
        DsaSheetService.DeleteMode deleteMode;
        try {
            deleteMode = DsaSheetService.DeleteMode.valueOf(mode.trim().toUpperCase(Locale.ROOT));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "mode must be UNASSIGN or MOVE_TO_PARENT");
        }
        service.deleteFolder(id, deleteMode, http);
        return Map.of("ok", true);
    }

    @PostMapping("/folders/{id}/problems")
    public AssignProblemsResponse assignProblems(
            @PathVariable int id,
            @Valid @RequestBody AssignProblemsRequest request,
            HttpServletRequest http) {
        return service.assignProblems(id, request, http);
    }

    @DeleteMapping("/folders/{folderId}/problems/{problemId}")
    public Map<String, Object> removeProblem(
            @PathVariable int folderId,
            @PathVariable int problemId,
            HttpServletRequest http) {
        service.removeProblem(folderId, problemId, http);
        return Map.of("ok", true);
    }

    @PatchMapping("/folders/{id}/move")
    public Map<String, Object> moveFolder(
            @PathVariable int id,
            @RequestBody MoveFolderRequest request,
            HttpServletRequest http) {
        service.moveFolder(id, request, http);
        return Map.of("ok", true);
    }

    @PatchMapping("/folders/{folderId}/problems/{problemId}/move")
    public Map<String, Object> moveProblem(
            @PathVariable int folderId,
            @PathVariable int problemId,
            @Valid @RequestBody MoveProblemRequest request,
            HttpServletRequest http) {
        service.moveProblem(folderId, problemId, request, http);
        return Map.of("ok", true);
    }

    @PatchMapping("/folders/reorder")
    public Map<String, Object> reorderFolders(
            @Valid @RequestBody ReorderFoldersRequest request,
            HttpServletRequest http) {
        service.reorderFolders(request, http);
        return Map.of("ok", true);
    }

    @PatchMapping("/folders/{folderId}/problems/reorder")
    public Map<String, Object> reorderProblems(
            @PathVariable int folderId,
            @Valid @RequestBody ReorderProblemsRequest request,
            HttpServletRequest http) {
        service.reorderProblems(folderId, request, http);
        return Map.of("ok", true);
    }
}
