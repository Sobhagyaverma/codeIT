package com.codeit.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;

@Configuration
public class RedisConfig {
    @Bean
    public RedisJsonHelper redisJsonHelper(ObjectMapper objectMapper){
        return new RedisJsonHelper(objectMapper);
    }
    public static class RedisJsonHelper {
        private final ObjectMapper objectMapper;

        public RedisJsonHelper(ObjectMapper objectMapper){
            this.objectMapper=objectMapper;
        }
        public String toJson(Object value) { ... }
        public <T> T fromJson(String json, Class<T> type) { ... }
        public <T> T fromJson(String json, TypeReference<T> typeRef) { ... }
        
    }
    
}
