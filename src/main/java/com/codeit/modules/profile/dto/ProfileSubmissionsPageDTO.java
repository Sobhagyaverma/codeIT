package com.codeit.modules.profile.dto;

import java.util.List;

import com.codeit.modules.profile.dto.ProfileResponseDTO.SubmissionRowDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileSubmissionsPageDTO {
    private List<SubmissionRowDTO> items;
    private Integer nextCursor;
}
