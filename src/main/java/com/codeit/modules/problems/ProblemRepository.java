package com.codeit.modules.problems;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public class ProblemRepository {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Problem> getAllProblems() {

        String sql = """
                SELECT * FROM problems
                ORDER BY id ASC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Problem problem = new Problem();
            problem.setId(rs.getInt("id"));
            problem.setTitle(rs.getString("title"));
            problem.setDescription(rs.getString("description"));
            problem.setDifficulty(rs.getString("difficulty"));
            problem.setTopics(rs.getString("topics"));
            problem.setExamples(rs.getString("examples"));
            problem.setConstraintsData(rs.getString("constraints_data"));
            problem.setTestCases(rs.getString("test_cases"));
            return problem;
        });
    }

    public boolean existsById(Integer id) {
        String sql = "SELECT 1 FROM problems WHERE id = ? LIMIT 1";
        return Boolean.TRUE.equals(jdbcTemplate.query(sql, rs -> rs.next() ? true : null, id));
    }

    /** Returns ids from the input list that do not exist in problems. */
    public List<Integer> findMissingIds(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        String placeholders = String.join(",", java.util.Collections.nCopies(ids.size(), "?"));
        String sql = "SELECT id FROM problems WHERE id IN (" + placeholders + ")";
        List<Integer> found = jdbcTemplate.query(
                sql,
                ids.toArray(),
                (rs, rowNum) -> rs.getInt("id"));
        java.util.Set<Integer> foundSet = new java.util.HashSet<>(found);
        return ids.stream().filter(id -> id != null && !foundSet.contains(id)).distinct().toList();
    }

    public Problem getProblemById(Integer id) {
        String sql = """
                SELECT * FROM problems
                WHERE id = ?
                """;
        return jdbcTemplate.queryForObject(
                sql,
                (rs, rowNum) -> {
                    Problem problem = new Problem();
                    problem.setId(rs.getInt("id"));
                    problem.setTitle(rs.getString("title"));
                    problem.setDescription(rs.getString("description"));
                    problem.setDifficulty(rs.getString("difficulty"));
                    problem.setTopics(rs.getString("topics"));
                    problem.setExamples(rs.getString("examples"));
                    problem.setConstraintsData(rs.getString("constraints_data"));
                    problem.setTestCases(rs.getString("test_cases"));
                    return problem;
                },
                id);
    }

    public int createProblem(Problem problem) {

        String sql = """
                    INSERT INTO problems
                    (
                        title,
                        description,
                        difficulty,
                        topics,
                        examples,
                        constraints_data,
                        test_cases
                    )
                    VALUES (?, ?, ?, ?::jsonb, ?::jsonb, ?::jsonb, ?::jsonb)
                """;

        return jdbcTemplate.update(
                sql,
                problem.getTitle(),
                problem.getDescription(),
                problem.getDifficulty(),
                problem.getTopics(),
                problem.getExamples(),
                problem.getConstraintsData(),
                problem.getTestCases());
    }

    public List<Problem> getProblemsByDifficulty(
            String difficulty) {

        String sql = """
                    SELECT *
                    FROM problems
                    WHERE difficulty = ?
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> {

                    Problem p = new Problem();

                    p.setId(rs.getInt("id"));
                    p.setTitle(rs.getString("title"));
                    p.setDifficulty(rs.getString("difficulty"));
                    p.setTopics(rs.getString("topics"));

                    return p;
                },
                difficulty);
    }

    public List<Problem> getProblemsByTopic(
            String topic) {

        String sql = """
                    SELECT *
                    FROM problems
                    WHERE jsonb_exists(topics, ?)
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> {

                    Problem p = new Problem();

                    p.setId(rs.getInt("id"));
                    p.setTitle(rs.getString("title"));
                    p.setDifficulty(rs.getString("difficulty"));
                    p.setTopics(rs.getString("topics"));

                    return p;
                },
                topic);
    }

    public List<Problem> searchProblems(String keyword) {

        String sql = """
                    SELECT *
                    FROM problems
                    WHERE LOWER(title) LIKE LOWER(?)
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> {

                    Problem p = new Problem();

                    p.setId(rs.getInt("id"));
                    p.setTitle(rs.getString("title"));
                    p.setDifficulty(rs.getString("difficulty"));
                    p.setTopics(rs.getString("topics"));

                    return p;
                },
                "%" + keyword + "%");
    }
}
