package com.aaqib.studentmanagement.service;

import com.aaqib.studentmanagement.dto.request.CourseRequest;
import com.aaqib.studentmanagement.dto.response.CourseResponse;
import com.aaqib.studentmanagement.entity.Course;
import com.aaqib.studentmanagement.repository.CourseRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class CourseService {

    private final CourseRepository repository;

    public CourseService(CourseRepository repository) {
        this.repository = repository;
    }

    public List<CourseResponse> getAll() {
        return repository.findAll(Sort.by("id")).stream()
                .map(CourseResponse::from)
                .toList();
    }

    public CourseResponse getById(Long id) {
        return CourseResponse.from(findCourse(id));
    }

    public CourseResponse create(CourseRequest request) {
        String code = normalizeCode(request.courseCode());

        if (repository.existsByCourseCode(code)) {
            throw conflict("Course code already exists");
        }

        Course course = new Course();
        applyRequest(course, request, code);

        return save(course);
    }

    public CourseResponse update(Long id, CourseRequest request) {
        Course course = findCourse(id);
        String code = normalizeCode(request.courseCode());

        if (repository.existsByCourseCodeAndIdNot(code, id)) {
            throw conflict("Course code already exists");
        }

        applyRequest(course, request, code);

        return save(course);
    }

    public void delete(Long id) {
        repository.delete(findCourse(id));
    }

    private Course findCourse(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Course not found"
                ));
    }

    private void applyRequest(
            Course course,
            CourseRequest request,
            String code
    ) {
        course.setCourseCode(code);
        course.setName(request.name().trim());
        course.setDescription(
                request.description() == null
                        ? null : request.description().trim()
        );
        course.setCredits(request.credits());
    }

    private CourseResponse save(Course course) {
        try {
            return CourseResponse.from(repository.saveAndFlush(course));
        } catch (DataIntegrityViolationException exception) {
            throw conflict("Course data conflicts with an existing record");
        }
    }

    private String normalizeCode(String value) {
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}