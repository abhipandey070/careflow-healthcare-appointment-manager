package com.careflow.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.careflow.backend.entity.Appointment;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    boolean existsByDoctorNameAndDateAndTime(
            String doctorName,
            String date,
            String time
    );
}