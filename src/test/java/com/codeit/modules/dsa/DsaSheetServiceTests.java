package com.codeit.modules.dsa;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.modules.admin.AdminAuditService;
import com.codeit.modules.dsa.dto.CreateDsaFolderRequest;
import com.codeit.modules.dsa.dto.MoveFolderRequest;

@ExtendWith(MockitoExtension.class)
class DsaSheetServiceTests {

    @Mock
    private DsaSheetRepository repository;

    @Mock
    private AdminAuditService adminAuditService;

    private DsaSheetService service;

    @BeforeEach
    void setUp() {
        service = new DsaSheetService(repository, adminAuditService);
    }

    @Test
    void createFolderRejectsBlankName() {
        DsaSheet sheet = new DsaSheet();
        sheet.setId(1);
        when(repository.findSheet(1)).thenReturn(Optional.of(sheet));

        CreateDsaFolderRequest req = new CreateDsaFolderRequest();
        req.setName("   ");

        assertThrows(ResponseStatusException.class, () -> service.createFolder(1, req, null));
    }

    @Test
    void createFolderRejectsDuplicateSibling() {
        DsaSheet sheet = new DsaSheet();
        sheet.setId(1);
        when(repository.findSheet(1)).thenReturn(Optional.of(sheet));
        when(repository.siblingNameExists(eq(1), isNull(), eq("Arrays"), isNull())).thenReturn(true);

        CreateDsaFolderRequest req = new CreateDsaFolderRequest();
        req.setName("Arrays");

        assertThrows(ResponseStatusException.class, () -> service.createFolder(1, req, null));
    }

    @Test
    void moveFolderRejectsSelf() {
        DsaFolder folder = folder(10, 1, null, "Arrays");
        when(repository.findFolder(10)).thenReturn(Optional.of(folder));

        MoveFolderRequest req = new MoveFolderRequest();
        req.setParentId(10);

        assertThrows(ResponseStatusException.class, () -> service.moveFolder(10, req, null));
    }

    @Test
    void moveFolderRejectsDescendant() {
        DsaFolder folder = folder(10, 1, null, "Arrays");
        DsaFolder child = folder(11, 1, 10, "Basics");
        when(repository.findFolder(10)).thenReturn(Optional.of(folder));
        when(repository.findFolder(11)).thenReturn(Optional.of(child));
        when(repository.isDescendant(10, 11)).thenReturn(true);

        MoveFolderRequest req = new MoveFolderRequest();
        req.setParentId(11);

        assertThrows(ResponseStatusException.class, () -> service.moveFolder(10, req, null));
        verify(repository, never()).updateFolderParentAndPosition(anyInt(), any(), anyInt());
    }

    @Test
    void deleteUnassignDoesNotTouchProblemsTable() {
        DsaFolder folder = folder(10, 1, null, "Arrays");
        when(repository.findFolder(10)).thenReturn(Optional.of(folder));

        service.deleteFolder(10, DsaSheetService.DeleteMode.UNASSIGN, null);

        verify(repository).deleteFolder(10);
        verify(repository, never()).moveProblemsToFolder(anyInt(), anyInt());
    }

    @Test
    void isDescendantLogicDelegates() {
        when(repository.isDescendant(1, 2)).thenReturn(true);
        assertTrue(repository.isDescendant(1, 2));
        when(repository.isDescendant(1, 3)).thenReturn(false);
        assertFalse(repository.isDescendant(1, 3));
    }

    @Test
    void getTreeBuildsHierarchy() {
        DsaSheet sheet = new DsaSheet();
        sheet.setId(1);
        when(repository.findSheet(1)).thenReturn(Optional.of(sheet));

        DsaFolder root = folder(1, 1, null, "Arrays");
        root.setPosition(0);
        DsaFolder child = folder(2, 1, 1, "Basics");
        child.setPosition(0);
        when(repository.listFoldersForSheet(1)).thenReturn(List.of(root, child));
        when(repository.listFolderProblemRows(1)).thenReturn(List.of());

        var tree = service.getTree(1);
        assertEquals(1, tree.size());
        assertEquals("Arrays", tree.get(0).getName());
        assertEquals(1, tree.get(0).getChildren().size());
        assertEquals("Basics", tree.get(0).getChildren().get(0).getName());
    }

    private static DsaFolder folder(int id, int sheetId, Integer parentId, String name) {
        DsaFolder f = new DsaFolder();
        f.setId(id);
        f.setSheetId(sheetId);
        f.setParentId(parentId);
        f.setName(name);
        f.setPosition(0);
        return f;
    }
}
