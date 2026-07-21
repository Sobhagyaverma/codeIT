package com.codeit.modules.ai;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class AiSchemaStartupRunner implements ApplicationRunner {

    private final AiSchemaInitializer schemaInitializer;

    public AiSchemaStartupRunner(AiSchemaInitializer schemaInitializer) {
        this.schemaInitializer = schemaInitializer;
    }

    @Override
    public void run(ApplicationArguments args) {
        schemaInitializer.ensureSchema();
    }
}
