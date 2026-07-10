package com.codeit.modules.submission;

import java.util.Arrays;
import java.util.Optional;

import com.codeit.modules.submission.dto.LanguageOption;

public enum SupportedLanguage {
    JAVA("java", 62, "Java"),
    PYTHON("python", 71, "Python"),
    JAVASCRIPT("javascript", 63, "JavaScript"),
    TYPESCRIPT("typescript", 74, "TypeScript"),
    CPP("cpp", 54, "C++"),
    C("c", 50, "C"),
    GO("go", 60, "Go"),
    RUST("rust", 73, "Rust"),
    CSHARP("csharp", 51, "C#"),
    RUBY("ruby", 72, "Ruby"),
    PHP("php", 68, "PHP");

    private final String slug;
    private final int judge0Id;
    private final String displayName;

    SupportedLanguage(String slug, int judge0Id, String displayName) {
        this.slug = slug;
        this.judge0Id = judge0Id;
        this.displayName = displayName;
    }

    public String getSlug() {
        return slug;
    }

    public int getJudge0Id() {
        return judge0Id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public LanguageOption toLanguageOption() {
        return new LanguageOption(slug, displayName, judge0Id);
    }

    public static Optional<SupportedLanguage> fromJudge0Id(int id) {
        return Arrays.stream(values())
                .filter(lang -> lang.judge0Id == id)
                .findFirst();
    }

    public static Optional<SupportedLanguage> fromSlug(String slug) {
        if (slug == null || slug.isBlank()) {
            return Optional.empty();
        }
        String normalized = slug.trim().toLowerCase();
        return Arrays.stream(values())
                .filter(lang -> lang.slug.equals(normalized))
                .findFirst();
    }

    public static boolean isSupported(int id) {
        return fromJudge0Id(id).isPresent();
    }

    public static SupportedLanguage resolve(int languageId, String slug) {
        SupportedLanguage byId = fromJudge0Id(languageId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Unsupported languageId: " + languageId));

        if (slug != null && !slug.isBlank()) {
            SupportedLanguage bySlug = fromSlug(slug)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Unsupported language: " + slug));
            if (bySlug != byId) {
                throw new IllegalArgumentException(
                        "language '" + slug + "' does not match languageId " + languageId);
            }
            return bySlug;
        }

        return byId;
    }
}
