package com.aaqib.studentmanagement.dto;

import com.aaqib.studentmanagement.entity.Student;
import java.time.OffsetDateTime;

public record StudentResponse(
        Long id,
        String studentNumber,
        String firstName,
        String lastName,
        String email,
        String phone,
        OffsetDateTime createdAt
) {
    public static StudentResponse from(Student student) {
        return new StudentResponse(
                student.getId(),
                student.getStudentNumber(),
                student.getFirstName(),
                student.getLastName(),
                student.getEmail(),
                student.getPhone(),
                student.getCreatedAt()
        );
    }
}