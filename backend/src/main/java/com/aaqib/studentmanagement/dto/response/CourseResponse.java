package com.aaqib.studentmanagement.dto.response;

import com.aaqib.studentmanagement.entity.Course;
import java.time.OffsetDateTime;

public record CourseResponse(
        Long id,
        String courseCode,
        String name,
        String description,
        Integer credits,
        OffsetDateTime createdAt
) {
    public static CourseResponse from(Course course) {
        return new CourseResponse(
                course.getId(),
                course.getCourseCode(),
                course.getName(),
                course.getDescription(),
                course.getCredits(),
                course.getCreatedAt()
        );
    }
}