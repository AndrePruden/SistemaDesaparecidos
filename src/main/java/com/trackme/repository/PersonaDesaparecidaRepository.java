package com.trackme.repository;

import com.trackme.model.PersonaDesaparecida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PersonaDesaparecidaRepository extends JpaRepository<PersonaDesaparecida, Long> {
    List<PersonaDesaparecida> findByEmailReportaje(String emailReportaje);
}