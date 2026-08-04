package com.codeit.modules.mail;

import java.util.Properties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
@ConditionalOnClass(name = "jakarta.mail.MessagingException")
public class MailConfig {

    private static final Logger log = LoggerFactory.getLogger(MailConfig.class);

    /**
     * Fallback sender when Boot does not auto-create one (e.g. empty username locally).
     * {@link MailService} still no-ops when {@code codeit.mail.enabled=false}.
     */
    @Bean
    @ConditionalOnMissingBean(JavaMailSender.class)
    public JavaMailSender javaMailSender(Environment env) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(env.getProperty("spring.mail.host", "localhost"));
        sender.setPort(env.getProperty("spring.mail.port", Integer.class, 587));
        String username = env.getProperty("spring.mail.username", "");
        String password = env.getProperty("spring.mail.password", "");
        if (!username.isBlank()) {
            sender.setUsername(username);
        }
        if (!password.isBlank()) {
            sender.setPassword(password);
        }
        Properties props = sender.getJavaMailProperties();
        props.put("mail.smtp.auth", env.getProperty("spring.mail.properties.mail.smtp.auth", "true"));
        props.put(
                "mail.smtp.starttls.enable",
                env.getProperty("spring.mail.properties.mail.smtp.starttls.enable", "true"));
        log.info(
                "JavaMailSender configured host={} port={} usernameSet={}",
                sender.getHost(),
                sender.getPort(),
                !username.isBlank());
        return sender;
    }
}
