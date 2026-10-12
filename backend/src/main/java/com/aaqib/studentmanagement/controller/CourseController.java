package com.aaqib.studentmanagement.controller;

import com.aaqib.studentmanagement.dto.request.CourseRequest;
import com.aaqib.studentmanagement.dto.response.CourseResponse;
import com.aaqib.studentmanagement.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService service;

    public CourseController(CourseService service) {
        this.service = service;
    }

    @GetMapping
    public List<CourseResponse> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public CourseResponse getById(@PathVariable("id") Long id) {
        return service.getById(id);
    }

    @PostMapping
    public ResponseEntity<CourseResponse> create(
            @Valid @RequestBody CourseRequest request
    ) {
        CourseResponse response = service.create(request);

        return ResponseEntity
                .created(URI.create("/api/courses/" + response.id()))
                .body(response);
    }

    @PutMapping("/{id}")
    public CourseResponse update(
            @PathVariable("id") Long id,
            @Valid @RequestBody CourseRequest request
    ) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}