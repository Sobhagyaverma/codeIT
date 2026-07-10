package com.codeit.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;

import com.fasterxml.jackson.databind.ObjectMapper;

@Configuration
public class RedisConfig {
    @Bean
    public RedisJsonHelper redisJsonHelper(ObjectMapper objectMapper) {
        return new RedisJsonHelper(objectMapper);
    }

    public static class RedisJsonHelper {
        private final ObjectMapper objectMapper;

        public RedisJsonHelper(ObjectMapper objectMapper) {
            this.objectMapper = objectMapper;
        }

        public String toJson(Object value) {
            try {
                return objectMapper.writeValueAsString(value);
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Failed to serialize value to JSON", e);
            }
        }

        public <T> T fromJson(String json, Class<T> type) {
            if (json == null || json.isBlank()) {
                return null;
            }
            try {
                return objectMapper.readValue(json, type);
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Failed to deserialize JSON", e);
            }
        }

        public <T> T fromJson(String json, TypeReference<T> typeRef) {
            if (json == null || json.isBlank()) {
                return null;
            }
            try {
                return objectMapper.readValue(json, typeRef);
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Failed to deserialize JSON", e);
            }
        }

    }

}
