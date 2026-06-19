package com.codeit.modules.submission;

import org.springframework.stereotype.Component;

@Component
public class OutputComparator {

    public boolean matches(String actual, String expected) {
        return normalize(actual).equals(normalize(expected));
    }

    private String normalize(String s) {
        if (s == null) {
            return "";
        }
        String[] lines = s.stripTrailing().split("\n", -1);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < lines.length; i++) {
            if (i > 0) {
                sb.append("\n");
            }
            sb.append(lines[i].stripTrailing());
        }
        return sb.toString();
    }
}
