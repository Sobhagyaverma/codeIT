package com.codeit.config;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JudgeExecutorConfig {

    @Bean(destroyMethod = "shutdown")
    public ExecutorService judgeExecutor(
            @Value("${codeit.judge.max-parallelism:8}") int maxParallelism) {
        return Executors.newFixedThreadPool(maxParallelism);
    }
}
