package com.codeit.modules.user;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<User> userRowMapper = (rs, rowNum) -> mapUser(rs);

    public int createUser(User user) {
        String sql = """
                INSERT INTO users(name, uniqueuserid, email, password, role)
                VALUES (?, ?, ?, ?, ?)
                """;
        return jdbcTemplate.update(
                sql,
                user.getName(),
                user.getUniqueUserId(),
                user.getEmail(),
                user.getPassword(),
                user.getRole());
    }

    public List<User> getUsers() {
        String sql = """
                SELECT * FROM users
                """;
        return jdbcTemplate.query(sql, userRowMapper);
    }

    public int deleteUser(int id) {
        String sql = """
                DELETE FROM users WHERE id = ?
                """;
        return jdbcTemplate.update(sql, id);
    }

    public User getUserByEmail(String email) {
        String sql = """
                SELECT * FROM users WHERE email = ?
                """;
        try {
            return jdbcTemplate.queryForObject(sql, userRowMapper, email);
        } catch (EmptyResultDataAccessException e) {
            return null;
        } catch (Exception e) {
            System.err.println(e.getMessage());
            return null;
        }
    }

    public User getUserByUniqueUserId(String uniqueUserId) {
        String sql = """
                SELECT * FROM users WHERE LOWER(uniqueuserid) = LOWER(?)
                """;
        try {
            return jdbcTemplate.queryForObject(sql, userRowMapper, uniqueUserId);
        } catch (EmptyResultDataAccessException e) {
            return null;
        } catch (Exception e) {
            System.err.println(e.getMessage());
            return null;
        }
    }

    public Optional<User> getUserById(int id) {
        String sql = """
                SELECT * FROM users WHERE id = ?
                """;
        try {
            return Optional.of(jdbcTemplate.queryForObject(sql, userRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    private User mapUser(ResultSet rs) throws SQLException {
        User user = new User();
        user.setId(rs.getString("id"));
        user.setName(rs.getString("name"));
        user.setUniqueUserId(rs.getString("uniqueuserid"));
        user.setEmail(rs.getString("email"));
        user.setPassword(rs.getString("password"));
        user.setRole(rs.getString("role"));
        return user;
    }
}
