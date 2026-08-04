package com.codeit.config;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.codeit.security.ratelimit.AdminWriteRateLimitFilter;
import com.codeit.security.ratelimit.LoginRateLimitFilter;
import com.codeit.security.ratelimit.ProblemsReadRateLimitFilter;
import com.codeit.security.ratelimit.RegisterRateLimitFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        private final JwtAuthFilter jwtAuthFilter;
        private final LoginRateLimitFilter loginRateLimitFilter;
        private final RegisterRateLimitFilter registerRateLimitFilter;
        private final ProblemsReadRateLimitFilter problemsReadRateLimitFilter;
        private final AdminWriteRateLimitFilter adminWriteRateLimitFilter;

        public SecurityConfig(
                        JwtAuthFilter jwtAuthFilter,
                        LoginRateLimitFilter loginRateLimitFilter,
                        RegisterRateLimitFilter registerRateLimitFilter,
                        ProblemsReadRateLimitFilter problemsReadRateLimitFilter,
                        AdminWriteRateLimitFilter adminWriteRateLimitFilter) {
                this.jwtAuthFilter = jwtAuthFilter;
                this.loginRateLimitFilter = loginRateLimitFilter;
                this.registerRateLimitFilter = registerRateLimitFilter;
                this.problemsReadRateLimitFilter = problemsReadRateLimitFilter;
                this.adminWriteRateLimitFilter = adminWriteRateLimitFilter;
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOrigins(List.of(
                                "http://localhost:5173",
                                "http://127.0.0.1:5173",
                                "http://localhost:5174",
                                "http://127.0.0.1:5174",
                                "http://localhost:5175",
                                "http://127.0.0.1:5175"));
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(List.of("*"));
                config.setExposedHeaders(List.of(
                                "Retry-After",
                                "X-RateLimit-Limit",
                                "X-RateLimit-Remaining"));
                config.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);
                return source;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                PathPatternRequestMatcher.Builder paths = PathPatternRequestMatcher.withDefaults();

                http
                                .csrf(csrf -> csrf.disable())
                                .cors(Customizer.withDefaults())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .securityContext(securityContext -> securityContext
                                                .securityContextRepository(
                                                                new RequestAttributeSecurityContextRepository())
                                                .requireExplicitSave(true))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                paths.matcher("/api/auth/login"),
                                                                paths.matcher("/api/auth/verify-email"),
                                                                paths.matcher("/api/auth/verify-email/resend"),
                                                                paths.matcher("/api/auth/forgot-password"),
                                                                paths.matcher("/api/auth/forgot-password/verify"),
                                                                paths.matcher("/api/auth/forgot-password/reset"),
                                                                paths.matcher("/api/user/register"),
                                                                paths.matcher("/api/contact"),
                                                                paths.matcher("/api/captcha/config"),
                                                                paths.matcher("/api/crypto/public-key"),
                                                                paths.matcher("/api/health"),
                                                                paths.matcher("/api/health/**"),
                                                                paths.matcher("/ws"),
                                                                paths.matcher("/ws/**"))
                                                .permitAll()
                                                .requestMatchers(paths.matcher(HttpMethod.GET, "/api/problems"))
                                                .permitAll()
                                                .requestMatchers(paths.matcher(HttpMethod.GET, "/api/problems/**"))
                                                .permitAll()
                                                .requestMatchers(paths.matcher(HttpMethod.GET,
                                                                "/api/submissions/languages"))
                                                .permitAll()
                                                .requestMatchers(
                                                                paths.matcher("/api/profile/me"),
                                                                paths.matcher("/api/profile/me/**"))
                                                .authenticated()
                                                .requestMatchers(paths.matcher(HttpMethod.GET, "/api/profile/*"))
                                                .permitAll()
                                                .requestMatchers(paths.matcher("/api/user/**")).hasRole("ADMIN")
                                                .requestMatchers(paths.matcher(HttpMethod.POST, "/api/problems"))
                                                .hasRole("ADMIN")
                                                .requestMatchers(paths.matcher("/api/competitions/create"))
                                                .hasRole("ADMIN")
                                                .requestMatchers(paths.matcher("/api/competitions/addProblemsTo/**"))
                                                .hasRole("ADMIN")
                                                .requestMatchers(paths.matcher(HttpMethod.PATCH,
                                                                "/api/competitions/*/times"))
                                                .hasRole("ADMIN")
                                                .anyRequest().authenticated())
                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint(authenticationEntryPoint())
                                                .accessDeniedHandler(accessDeniedHandler()))
                                // Auth + public read limits before JWT; admin write after JWT (needs user id)
                                .addFilterBefore(loginRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                                .addFilterBefore(registerRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                                .addFilterBefore(problemsReadRateLimitFilter,
                                                UsernamePasswordAuthenticationFilter.class)
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                                .addFilterAfter(adminWriteRateLimitFilter, JwtAuthFilter.class);

                return http.build();
        }

        private AuthenticationEntryPoint authenticationEntryPoint() {
                return (request, response, authException) -> {
                        response.setStatus(401);
                        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                        response.getOutputStream().write(
                                        "{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}"
                                                        .getBytes(StandardCharsets.UTF_8));
                };
        }

        private AccessDeniedHandler accessDeniedHandler() {
                return (request, response, accessDeniedException) -> {
                        response.setStatus(403);
                        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                        response.getOutputStream().write(
                                        "{\"status\":403,\"error\":\"Forbidden\",\"message\":\"Access denied\"}"
                                                        .getBytes(StandardCharsets.UTF_8));
                };
        }
}
