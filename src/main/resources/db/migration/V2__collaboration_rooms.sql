-- Collaboration rooms: Problem Collab + CodeRoom
-- See docs/COLLABORATION_ARCHITECTURE.md

CREATE TABLE IF NOT EXISTS rooms (
    id               UUID PRIMARY KEY,
    type             VARCHAR(20)  NOT NULL,  -- PROBLEM_COLLAB | CODEROOM
    problem_id       BIGINT       NULL REFERENCES problems(id),
    host_user_id     BIGINT       NOT NULL REFERENCES users(id),
    invite_token     VARCHAR(64)  NOT NULL UNIQUE,
    active_workspace VARCHAR(20)  NOT NULL DEFAULT 'CODE',  -- CODE | WHITEBOARD
    language         VARCHAR(32)  NOT NULL DEFAULT 'java',
    status           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | ARCHIVED
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_invite_token ON rooms (invite_token);
CREATE INDEX IF NOT EXISTS idx_rooms_problem_id ON rooms (problem_id);
CREATE INDEX IF NOT EXISTS idx_rooms_host_user_id ON rooms (host_user_id);


CREATE TABLE IF NOT EXISTS room_members (
    room_id      UUID         NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role         VARCHAR(20)  NOT NULL,  -- HOST | EDITOR | VIEWER
    joined_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members (user_id);



CREATE TABLE IF NOT EXISTS room_messages (
    id         BIGSERIAL PRIMARY KEY,
    room_id    UUID         NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT         NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_messages_room_created
    ON room_messages (room_id, created_at ASC);



CREATE TABLE IF NOT EXISTS room_snapshots (
    id            BIGSERIAL PRIMARY KEY,
    room_id       UUID         NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    workspace     VARCHAR(20)  NOT NULL,  -- CODE | WHITEBOARD
    snapshot_data BYTEA        NOT NULL,  -- Yjs encoded state
    updated_by    BIGINT       NULL REFERENCES users(id) ON DELETE SET NULL,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_room_snapshots_room_workspace
    ON room_snapshots (room_id, workspace);




CREATE TABLE IF NOT EXISTS room_events (
    id         BIGSERIAL PRIMARY KEY,
    room_id    UUID         NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id    BIGINT       NULL REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(64)  NOT NULL,  -- e.g. MEMBER_JOINED, WORKSPACE_SWITCHED, RUN_STARTED
    payload    JSONB        NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_events_room_created
    ON room_events (room_id, created_at ASC);