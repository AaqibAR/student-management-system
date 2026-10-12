package com.aaqib.studentmanagement.controller;

import com.aaqib.studentmanagement.dto.request.StudentRequest;
import com.aaqib.studentmanagement.dto.response.StudentResponse;
import com.aaqib.studentmanagement.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService service;

    public StudentController(StudentService service) {
        this.service = service;
    }

    @GetMapping
    public List<StudentResponse> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public StudentResponse getById(@PathVariable("id") Long id) {
        return service.getById(id);
    }

    @PostMapping
    public ResponseEntity<StudentResponse> create(
            @Valid @RequestBody StudentRequest request
    ) {
        StudentResponse response = service.create(request);

        return ResponseEntity
                .created(URI.create("/api/students/" + response.id()))
                .body(response);
    }

    @PutMapping("/{id}")
    public StudentResponse update(
            @PathVariable("id") Long id,
            @Valid @RequestBody StudentRequest request
    ) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}