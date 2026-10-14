package com.aaqib.studentmanagement.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.nio.charset.StandardCharsets;

public record RegisterRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 150, message = "Name must not exceed 150 characters")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 254, message = "Email must not exceed 254 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(
                min = 8,
                max = 72,
                message = "Password must contain between 8 and 72 characters"
        )
        String password
) {
    @AssertTrue(message = "Password must not exceed 72 UTF-8 bytes")
    public boolean isPasswordWithinByteLimit() {
        return password == null
                || password.getBytes(StandardCharsets.UTF_8).length <= 72;
    }
}