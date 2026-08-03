package com.codeit.modules.collaboration;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import com.codeit.config.CollaborationLimitsProperties;

@Configuration
@EnableConfigurationProperties(CollaborationLimitsProperties.class)
public class CollaborationConfig {
}
