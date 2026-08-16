package com.codeit.modules.dsa;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.codeit.modules.dsa.dto.DsaSheetResponse;
import com.codeit.modules.dsa.dto.DsaTreeFolderNode;

/**
 * Public read API for the learner DSA sheet (Phase B).
 * Auth: permitAll GET — same posture as /api/problems.
 */
@RestController
@RequestMapping("/api/dsa")
public class DsaPublicController {

    private final DsaSheetService service;

    public DsaPublicController(DsaSheetService service) {
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
}
