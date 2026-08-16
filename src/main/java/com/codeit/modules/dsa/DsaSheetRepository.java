package com.codeit.modules.dsa;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import com.codeit.modules.dsa.dto.DsaTreeProblemNode;

@Repository
public class DsaSheetRepository {

    private final JdbcTemplate jdbc;

    public DsaSheetRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<DsaSheet> listSheets() {
        return jdbc.query(
                """
                        SELECT id, name, description, created_at, updated_at
                        FROM dsa_sheets
                        ORDER BY id ASC
                        """,
                (rs, rowNum) -> mapSheet(rs));
    }

    public Optional<DsaSheet> findSheet(int id) {
        try {
            return Optional.ofNullable(jdbc.queryForObject(
                    """
                            SELECT id, name, description, created_at, updated_at
                            FROM dsa_sheets WHERE id = ?
                            """,
                    (rs, rowNum) -> mapSheet(rs),
                    id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<DsaFolder> findFolder(int id) {
        try {
            return Optional.ofNullable(jdbc.queryForObject(
                    """
                            SELECT id, sheet_id, parent_id, name, description, position, created_at, updated_at
                            FROM dsa_folders WHERE id = ?
                            """,
                    (rs, rowNum) -> mapFolder(rs),
                    id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<DsaFolder> listFoldersForSheet(int sheetId) {
        return jdbc.query(
                """
                        SELECT id, sheet_id, parent_id, name, description, position, created_at, updated_at
                        FROM dsa_folders
                        WHERE sheet_id = ?
                        ORDER BY position ASC, id ASC
                        """,
                (rs, rowNum) -> mapFolder(rs),
                sheetId);
    }

    /** Returns [folderId, problem node] rows for tree assembly. */
    public List<FolderProblemRow> listFolderProblemRows(int sheetId) {
        return jdbc.query(
                """
                        SELECT fp.folder_id, fp.problem_id, fp.position,
                               p.title, p.difficulty, p.topics::text AS topics
                        FROM dsa_folder_problems fp
                        JOIN dsa_folders f ON f.id = fp.folder_id
                        JOIN problems p ON p.id = fp.problem_id
                        WHERE f.sheet_id = ?
                        ORDER BY fp.folder_id ASC, fp.position ASC, fp.problem_id ASC
                        """,
                (rs, rowNum) -> {
                    DsaTreeProblemNode node = new DsaTreeProblemNode();
                    node.setId(rs.getInt("problem_id"));
                    node.setTitle(rs.getString("title"));
                    node.setDifficulty(rs.getString("difficulty"));
                    node.setTopics(rs.getString("topics"));
                    node.setPosition(rs.getInt("position"));
                    return new FolderProblemRow(rs.getInt("folder_id"), node);
                },
                sheetId);
    }

    public boolean siblingNameExists(int sheetId, Integer parentId, String name, Integer excludeFolderId) {
        // Branch on null parent — binding NULL into "parent_id = ?" breaks PostgreSQL type inference.
        if (parentId == null) {
            if (excludeFolderId != null) {
                Integer count = jdbc.queryForObject(
                        """
                                SELECT COUNT(*) FROM dsa_folders
                                WHERE sheet_id = ?
                                  AND parent_id IS NULL
                                  AND LOWER(TRIM(name)) = LOWER(TRIM(?))
                                  AND id <> ?
                                """,
                        Integer.class,
                        sheetId,
                        name,
                        excludeFolderId);
                return count != null && count > 0;
            }
            Integer count = jdbc.queryForObject(
                    """
                            SELECT COUNT(*) FROM dsa_folders
                            WHERE sheet_id = ?
                              AND parent_id IS NULL
                              AND LOWER(TRIM(name)) = LOWER(TRIM(?))
                            """,
                    Integer.class,
                    sheetId,
                    name);
            return count != null && count > 0;
        }

        if (excludeFolderId != null) {
            Integer count = jdbc.queryForObject(
                    """
                            SELECT COUNT(*) FROM dsa_folders
                            WHERE sheet_id = ?
                              AND parent_id = ?
                              AND LOWER(TRIM(name)) = LOWER(TRIM(?))
                              AND id <> ?
                            """,
                    Integer.class,
                    sheetId,
                    parentId,
                    name,
                    excludeFolderId);
            return count != null && count > 0;
        }
        Integer count = jdbc.queryForObject(
                """
                        SELECT COUNT(*) FROM dsa_folders
                        WHERE sheet_id = ?
                          AND parent_id = ?
                          AND LOWER(TRIM(name)) = LOWER(TRIM(?))
                        """,
                Integer.class,
                sheetId,
                parentId,
                name);
        return count != null && count > 0;
    }

    public int nextFolderPosition(int sheetId, Integer parentId) {
        Integer max;
        if (parentId == null) {
            max = jdbc.queryForObject(
                    """
                            SELECT COALESCE(MAX(position), -1) FROM dsa_folders
                            WHERE sheet_id = ? AND parent_id IS NULL
                            """,
                    Integer.class,
                    sheetId);
        } else {
            max = jdbc.queryForObject(
                    """
                            SELECT COALESCE(MAX(position), -1) FROM dsa_folders
                            WHERE sheet_id = ? AND parent_id = ?
                            """,
                    Integer.class,
                    sheetId,
                    parentId);
        }
        return (max == null ? -1 : max) + 1;
    }

    public int nextProblemPosition(int folderId) {
        Integer max = jdbc.queryForObject(
                """
                        SELECT COALESCE(MAX(position), -1) FROM dsa_folder_problems
                        WHERE folder_id = ?
                        """,
                Integer.class,
                folderId);
        return (max == null ? -1 : max) + 1;
    }

    public DsaFolder insertFolder(int sheetId, Integer parentId, String name, String description, int position) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    """
                            INSERT INTO dsa_folders (sheet_id, parent_id, name, description, position)
                            VALUES (?, ?, ?, ?, ?)
                            """,
                    new String[] { "id" });
            ps.setInt(1, sheetId);
            if (parentId == null) {
                ps.setNull(2, Types.INTEGER);
            } else {
                ps.setInt(2, parentId);
            }
            ps.setString(3, name);
            ps.setString(4, description);
            ps.setInt(5, position);
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Failed to create folder");
        }
        return findFolder(key.intValue()).orElseThrow();
    }

    public void updateFolder(int id, String name, String description) {
        jdbc.update(
                """
                        UPDATE dsa_folders
                        SET name = ?, description = ?, updated_at = NOW()
                        WHERE id = ?
                        """,
                name,
                description,
                id);
    }

    public void touchFolder(int id) {
        jdbc.update("UPDATE dsa_folders SET updated_at = NOW() WHERE id = ?", id);
    }

    public void touchSheet(int sheetId) {
        jdbc.update("UPDATE dsa_sheets SET updated_at = NOW() WHERE id = ?", sheetId);
    }

    public void deleteFolder(int id) {
        jdbc.update("DELETE FROM dsa_folders WHERE id = ?", id);
    }

    public int countDirectChildren(int folderId) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM dsa_folders WHERE parent_id = ?",
                Integer.class,
                folderId);
        return n == null ? 0 : n;
    }

    public int countDirectProblems(int folderId) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM dsa_folder_problems WHERE folder_id = ?",
                Integer.class,
                folderId);
        return n == null ? 0 : n;
    }

    public int countDescendantProblems(int folderId) {
        Integer n = jdbc.queryForObject(
                """
                        WITH RECURSIVE subtree AS (
                            SELECT id FROM dsa_folders WHERE id = ?
                            UNION ALL
                            SELECT f.id FROM dsa_folders f
                            JOIN subtree s ON f.parent_id = s.id
                        )
                        SELECT COUNT(*) FROM dsa_folder_problems fp
                        JOIN subtree s ON s.id = fp.folder_id
                        """,
                Integer.class,
                folderId);
        return n == null ? 0 : n;
    }

    public int countDescendantFolders(int folderId) {
        Integer n = jdbc.queryForObject(
                """
                        WITH RECURSIVE subtree AS (
                            SELECT id FROM dsa_folders WHERE parent_id = ?
                            UNION ALL
                            SELECT f.id FROM dsa_folders f
                            JOIN subtree s ON f.parent_id = s.id
                        )
                        SELECT COUNT(*) FROM subtree
                        """,
                Integer.class,
                folderId);
        return n == null ? 0 : n;
    }

    public boolean isDescendant(int ancestorId, int possibleDescendantId) {
        Integer n = jdbc.queryForObject(
                """
                        WITH RECURSIVE subtree AS (
                            SELECT id FROM dsa_folders WHERE parent_id = ?
                            UNION ALL
                            SELECT f.id FROM dsa_folders f
                            JOIN subtree s ON f.parent_id = s.id
                        )
                        SELECT COUNT(*) FROM subtree WHERE id = ?
                        """,
                Integer.class,
                ancestorId,
                possibleDescendantId);
        return n != null && n > 0;
    }

    public void updateFolderParentAndPosition(int id, Integer parentId, int position) {
        jdbc.update(
                """
                        UPDATE dsa_folders
                        SET parent_id = ?, position = ?, updated_at = NOW()
                        WHERE id = ?
                        """,
                parentId,
                position,
                id);
    }

    public void updateFolderPosition(int id, int position) {
        jdbc.update(
                "UPDATE dsa_folders SET position = ?, updated_at = NOW() WHERE id = ?",
                position,
                id);
    }

    public List<DsaFolder> listSiblings(int sheetId, Integer parentId) {
        if (parentId == null) {
            return jdbc.query(
                    """
                            SELECT id, sheet_id, parent_id, name, description, position, created_at, updated_at
                            FROM dsa_folders
                            WHERE sheet_id = ? AND parent_id IS NULL
                            ORDER BY position ASC, id ASC
                            """,
                    (rs, rowNum) -> mapFolder(rs),
                    sheetId);
        }
        return jdbc.query(
                """
                        SELECT id, sheet_id, parent_id, name, description, position, created_at, updated_at
                        FROM dsa_folders
                        WHERE sheet_id = ? AND parent_id = ?
                        ORDER BY position ASC, id ASC
                        """,
                (rs, rowNum) -> mapFolder(rs),
                sheetId,
                parentId);
    }

    public void reparentChildrenTo(int fromFolderId, Integer newParentId) {
        jdbc.update(
                """
                        UPDATE dsa_folders
                        SET parent_id = ?, updated_at = NOW()
                        WHERE parent_id = ?
                        """,
                newParentId,
                fromFolderId);
    }

    public List<Integer> listProblemIdsInFolder(int folderId) {
        return jdbc.query(
                "SELECT problem_id FROM dsa_folder_problems WHERE folder_id = ? ORDER BY position ASC",
                (rs, rowNum) -> rs.getInt("problem_id"),
                folderId);
    }

    public void moveProblemsToFolder(int fromFolderId, int toFolderId) {
        List<Integer> ids = listProblemIdsInFolder(fromFolderId);
        for (Integer problemId : ids) {
            boolean exists = Boolean.TRUE.equals(jdbc.queryForObject(
                    """
                            SELECT EXISTS(
                              SELECT 1 FROM dsa_folder_problems
                              WHERE folder_id = ? AND problem_id = ?
                            )
                            """,
                    Boolean.class,
                    toFolderId,
                    problemId));
            if (exists) {
                jdbc.update(
                        "DELETE FROM dsa_folder_problems WHERE folder_id = ? AND problem_id = ?",
                        fromFolderId,
                        problemId);
            } else {
                int pos = nextProblemPosition(toFolderId);
                jdbc.update(
                        """
                                UPDATE dsa_folder_problems
                                SET folder_id = ?, position = ?
                                WHERE folder_id = ? AND problem_id = ?
                                """,
                        toFolderId,
                        pos,
                        fromFolderId,
                        problemId);
            }
        }
    }

    public boolean problemExists(int problemId) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM problems WHERE id = ?",
                Integer.class,
                problemId);
        return n != null && n > 0;
    }

    public boolean folderHasProblem(int folderId, int problemId) {
        Integer n = jdbc.queryForObject(
                """
                        SELECT COUNT(*) FROM dsa_folder_problems
                        WHERE folder_id = ? AND problem_id = ?
                        """,
                Integer.class,
                folderId,
                problemId);
        return n != null && n > 0;
    }

    public void insertFolderProblem(int folderId, int problemId, int position) {
        jdbc.update(
                """
                        INSERT INTO dsa_folder_problems (folder_id, problem_id, position)
                        VALUES (?, ?, ?)
                        ON CONFLICT DO NOTHING
                        """,
                folderId,
                problemId,
                position);
    }

    public int deleteFolderProblem(int folderId, int problemId) {
        return jdbc.update(
                "DELETE FROM dsa_folder_problems WHERE folder_id = ? AND problem_id = ?",
                folderId,
                problemId);
    }

    public void updateProblemPosition(int folderId, int problemId, int position) {
        jdbc.update(
                """
                        UPDATE dsa_folder_problems SET position = ?
                        WHERE folder_id = ? AND problem_id = ?
                        """,
                position,
                folderId,
                problemId);
    }

    public void moveProblemLink(int fromFolderId, int problemId, int toFolderId, int position) {
        if (fromFolderId == toFolderId) {
            updateProblemPosition(fromFolderId, problemId, position);
            return;
        }
        jdbc.update(
                "DELETE FROM dsa_folder_problems WHERE folder_id = ? AND problem_id = ?",
                fromFolderId,
                problemId);
        jdbc.update(
                """
                        INSERT INTO dsa_folder_problems (folder_id, problem_id, position)
                        VALUES (?, ?, ?)
                        ON CONFLICT (folder_id, problem_id) DO UPDATE SET position = EXCLUDED.position
                        """,
                toFolderId,
                problemId,
                position);
    }

    public record FolderProblemRow(int folderId, DsaTreeProblemNode problem) {
    }

    private static DsaSheet mapSheet(ResultSet rs) throws SQLException {
        DsaSheet s = new DsaSheet();
        s.setId(rs.getInt("id"));
        s.setName(rs.getString("name"));
        s.setDescription(rs.getString("description"));
        s.setCreatedAt(toInstant(rs.getTimestamp("created_at")));
        s.setUpdatedAt(toInstant(rs.getTimestamp("updated_at")));
        return s;
    }

    private static DsaFolder mapFolder(ResultSet rs) throws SQLException {
        DsaFolder f = new DsaFolder();
        f.setId(rs.getInt("id"));
        f.setSheetId(rs.getInt("sheet_id"));
        int parent = rs.getInt("parent_id");
        f.setParentId(rs.wasNull() ? null : parent);
        f.setName(rs.getString("name"));
        f.setDescription(rs.getString("description"));
        f.setPosition(rs.getInt("position"));
        f.setCreatedAt(toInstant(rs.getTimestamp("created_at")));
        f.setUpdatedAt(toInstant(rs.getTimestamp("updated_at")));
        return f;
    }

    private static Instant toInstant(Timestamp ts) {
        return ts == null ? null : ts.toInstant();
    }
}
