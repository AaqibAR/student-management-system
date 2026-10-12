package com.aaqib.studentmanagement.dto.request;

import jakarta.validation.constraints.*;

public record StudentRequest(
        @NotBlank @Size(max = 30)
        String studentNumber,

        @NotBlank @Size(max = 100)
        String firstName,

        @NotBlank @Size(max = 100)
        String lastName,

        @NotBlank @Email @Size(max = 254)
        String email,

        @Size(max = 30)
        String phone
) {
}