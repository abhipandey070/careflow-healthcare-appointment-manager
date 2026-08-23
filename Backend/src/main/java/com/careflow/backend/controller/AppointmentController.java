package com.careflow.backend.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careflow.backend.entity.Appointment;
import com.careflow.backend.repository.AppointmentRepository;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    private final AppointmentRepository appointmentRepository;

    public AppointmentController(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    @PostMapping
    public ResponseEntity<Appointment> createAppointment(
            @RequestBody Appointment appointment) {

        if (appointment.getStatus() == null ||
                appointment.getStatus().isBlank()) {
            appointment.setStatus("BOOKED");
        }

        Appointment savedAppointment =
                appointmentRepository.save(appointment);

        return ResponseEntity.ok(savedAppointment);
    }

    @GetMapping
    public ResponseEntity<List<Appointment>> getAppointments() {

        return ResponseEntity.ok(
                appointmentRepository.findAll()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelAppointment(
            @PathVariable Long id) {

        Optional<Appointment> appointment =
                appointmentRepository.findById(id);

        if (appointment.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Appointment existingAppointment = appointment.get();

        existingAppointment.setStatus("CANCELLED");

        appointmentRepository.save(existingAppointment);

        return ResponseEntity.ok(existingAppointment);
    }
}