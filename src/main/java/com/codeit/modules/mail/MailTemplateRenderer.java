package com.codeit.modules.mail;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * Loads classpath HTML templates under {@code mail/} and replaces {@code {{key}}} placeholders.
 * Values are HTML-escaped unless the key ends with {@code Html} (trusted fragments only).
 */
@Component
public class MailTemplateRenderer {

    private static final Logger log = LoggerFactory.getLogger(MailTemplateRenderer.class);

    public String render(String classpathRelative, Map<String, String> vars) {
        String template = load("mail/" + classpathRelative);
        String out = template;
        if (vars != null) {
            for (Map.Entry<String, String> e : vars.entrySet()) {
                String key = e.getKey();
                String value = e.getValue() == null ? "" : e.getValue();
                String replacement = key.endsWith("Html") ? value : escapeHtml(value);
                out = out.replace("{{" + key + "}}", replacement);
            }
        }
        return out;
    }

    private String load(String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            try (InputStream in = resource.getInputStream()) {
                return new String(in.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (IOException ex) {
            log.error("Failed to load mail template {}", path, ex);
            throw new IllegalStateException("Missing mail template: " + path, ex);
        }
    }

    static String escapeHtml(String s) {
        StringBuilder sb = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '&' -> sb.append("&amp;");
                case '<' -> sb.append("&lt;");
                case '>' -> sb.append("&gt;");
                case '"' -> sb.append("&quot;");
                case '\'' -> sb.append("&#39;");
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }
}
