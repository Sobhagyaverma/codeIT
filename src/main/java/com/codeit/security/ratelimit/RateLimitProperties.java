package com.codeit.security.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Tunable rate-limit settings (small-VM friendly defaults).
 *
 * Run / submit use three tiers (all must pass):
 *   burst     — short window, stops sudden spikes
 *   sustained — medium window, stops continuous abuse
 *   daily     — long window, stops bots / account sharing / excessive usage
 */
@ConfigurationProperties(prefix = "codeit.ratelimit")
public class RateLimitProperties {

    /** Master switch. When false, all checks are skipped (allow). */
    private boolean enabled = true;

    private final EndpointLimit login = new EndpointLimit(5, 900);
    private final EndpointLimit register = new EndpointLimit(3, 3600);
    private final EndpointLimit changePassword = new EndpointLimit(5, 3600);
    /** OTP / email reset request — very strict (Email + IP both checked). */
    private final EndpointLimit forgotPassword = new EndpointLimit(1, 86400);

    /** Judge0 run — burst + sustained + daily. */
    private final TieredEndpointLimit run = new TieredEndpointLimit(
            new EndpointLimit(3, 10),
            new EndpointLimit(8, 60),
            new EndpointLimit(300, 86400));

    /** Full test-suite submit — stricter tiers than run. */
    private final TieredEndpointLimit submit = new TieredEndpointLimit(
            new EndpointLimit(2, 10),
            new EndpointLimit(5, 60),
            new EndpointLimit(150, 86400));

    /**
     * AI coach / LLM calls — very strict (API cost + CPU).
     * burst 1/10s, sustained 5/min, daily 40.
     */
    private final TieredEndpointLimit ai = new TieredEndpointLimit(
            new EndpointLimit(1, 10),
            new EndpointLimit(5, 60),
            new EndpointLimit(40, 86400));

    /** Room create (invite token mint) — stops room spam. */
    private final EndpointLimit roomInvite = new EndpointLimit(10, 60);
    /** Room chat POST — soft spam cap. */
    private final EndpointLimit roomChat = new EndpointLimit(30, 60);
    /** Leave+rejoin same room spam. */
    private final EndpointLimit roomJoin = new EndpointLimit(10, 60);
    /** Sync-token mint (Yjs JWT). */
    private final EndpointLimit roomSyncToken = new EndpointLimit(20, 60);
    /** Transfer host — stop rapid host flip-flopping. */
    private final EndpointLimit roomTransferHost = new EndpointLimit(3, 60);
    /** Rename / host-note update. */
    private final EndpointLimit roomRename = new EndpointLimit(10, 60);
    /** Public problem list/search/read — by IP (scraping). */
    private final EndpointLimit problemsRead = new EndpointLimit(90, 60);
    /** Admin mutating APIs — strict per admin user. */
    private final EndpointLimit adminWrite = new EndpointLimit(15, 60);

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public EndpointLimit getLogin() {
        return login;
    }

    public EndpointLimit getRegister() {
        return register;
    }

    public EndpointLimit getChangePassword() {
        return changePassword;
    }

    public EndpointLimit getForgotPassword() {
        return forgotPassword;
    }

    public TieredEndpointLimit getRun() {
        return run;
    }

    public TieredEndpointLimit getSubmit() {
        return submit;
    }

    public TieredEndpointLimit getAi() {
        return ai;
    }

    public EndpointLimit getRoomInvite() {
        return roomInvite;
    }

    public EndpointLimit getRoomChat() {
        return roomChat;
    }

    public EndpointLimit getRoomJoin() {
        return roomJoin;
    }

    public EndpointLimit getRoomSyncToken() {
        return roomSyncToken;
    }

    public EndpointLimit getRoomTransferHost() {
        return roomTransferHost;
    }

    public EndpointLimit getRoomRename() {
        return roomRename;
    }

    public EndpointLimit getProblemsRead() {
        return problemsRead;
    }

    public EndpointLimit getAdminWrite() {
        return adminWrite;
    }

    /** Single fixed-window limit. */
    public static class EndpointLimit {
        private int limit;
        private int windowSeconds;

        public EndpointLimit() {
        }

        public EndpointLimit(int limit, int windowSeconds) {
            this.limit = limit;
            this.windowSeconds = windowSeconds;
        }

        public int getLimit() {
            return limit;
        }

        public void setLimit(int limit) {
            this.limit = limit;
        }

        public int getWindowSeconds() {
            return windowSeconds;
        }

        public void setWindowSeconds(int windowSeconds) {
            this.windowSeconds = windowSeconds;
        }
    }

    /**
     * Three nested windows. Spring binds e.g.
     * codeit.ratelimit.run.burst.limit=3
     * codeit.ratelimit.run.sustained.window-seconds=60
     */
    public static class TieredEndpointLimit {
        private final EndpointLimit burst;
        private final EndpointLimit sustained;
        private final EndpointLimit daily;

        public TieredEndpointLimit() {
            this(new EndpointLimit(), new EndpointLimit(), new EndpointLimit());
        }

        public TieredEndpointLimit(EndpointLimit burst, EndpointLimit sustained, EndpointLimit daily) {
            this.burst = burst;
            this.sustained = sustained;
            this.daily = daily;
        }

        public EndpointLimit getBurst() {
            return burst;
        }

        public EndpointLimit getSustained() {
            return sustained;
        }

        public EndpointLimit getDaily() {
            return daily;
        }
    }
}
