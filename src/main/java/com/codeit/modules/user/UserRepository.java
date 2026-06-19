package com.codeit.modules.user;
//import org.springframework.data.jpa.repository.JpaRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
// public interface UserRepository extends JpaRepository<User, Long> {
public class UserRepository {

    @Autowired

    private JdbcTemplate jdbcTemplate;

    public int createUser(User user) {
        String sql = """
                    INSERT INTO users(username,email,password)
                    VALUES(?,?,?)
                """;
try {
    int result = jdbcTemplate.update(
        sql,
        user.getUsername(),
        user.getEmail(),
        user.getPassword());
        return result;
} catch (Exception e) {
    System.err.println(e.getMessage());
    return 0;
}


    }

    public List<User> getUsers() {
        String sql = """
                    SELECT * FROM users;
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            User user = new User();
            user.setId(rs.getString("id"));
            user.setUsername(rs.getString("username"));
            user.setEmail(rs.getString("email"));
            user.setPassword(rs.getString("password"));
            return user;
        });
    }

    public int deleteUser(int id) {
        String sql = """
                delete from users where id = ?
                """;
        return jdbcTemplate.update(sql, id);
    }

    public User getUserByEmail(String email) {

        String sql = """
            SELECT * FROM users WHERE email = ?
        """;
        try {
            return jdbcTemplate.queryForObject(
                    sql,
                    (rs, rowNum) -> {
                        User user = new User();
                        user.setId(rs.getString("id"));
                        user.setUsername(rs.getString("username"));
                        user.setEmail(rs.getString("email"));
                        user.setPassword(rs.getString("password"));
                        return user;
                    },
                    email);
        } catch (Exception e) {
            System.err.println(e.getMessage());
            return null;
        }
    }

}