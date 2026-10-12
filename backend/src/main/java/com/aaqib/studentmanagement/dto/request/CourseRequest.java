package com.aaqib.studentmanagement.dto.request;

import jakarta.validation.constraints.*;

public record CourseRequest(
        @NotBlank @Size(max = 30)
        String courseCode,

        @NotBlank @Size(max = 150)
        String name,

        @Size(max = 5000)
        String description,

        @NotNull @Min(1) @Max(30)
        Integer credits
) {
}