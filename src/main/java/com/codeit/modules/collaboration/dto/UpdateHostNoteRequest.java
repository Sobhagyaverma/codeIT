package com.codeit.modules.collaboration.dto;

import lombok.Data;

@Data
public class UpdateHostNoteRequest {
    /** Short note from the host; empty/null clears it. Max 280 chars. */
    private String hostNote;
}
