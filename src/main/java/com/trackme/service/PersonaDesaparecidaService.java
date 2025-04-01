package com.trackme.service;

import java.util.List;
import com.trackme.model.PersonaDesaparecida;
import com.trackme.repository.PersonaDesaparecidaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class PersonaDesaparecidaService {

    private final PersonaDesaparecidaRepository personaDesaparecidaRepository;

    @Autowired
    public PersonaDesaparecidaService(PersonaDesaparecidaRepository personaDesaparecidaRepository) {
        this.personaDesaparecidaRepository = personaDesaparecidaRepository;
    }

    public PersonaDesaparecida crearReporte(PersonaDesaparecida personaDesaparecida) {
        // Aquí podrías realizar validaciones adicionales si es necesario
        return personaDesaparecidaRepository.save(personaDesaparecida);
    }

    public Optional<PersonaDesaparecida> obtenerReportePorId(Long id) {
        return personaDesaparecidaRepository.findById(id);
    }

    public List<PersonaDesaparecida> obtenerReportesPorEmail(String email) {
        return personaDesaparecidaRepository.findByEmailReportaje(email);
    }

    public List<PersonaDesaparecida> obtenerTodosLosReportes() {
        return personaDesaparecidaRepository.findAll();
    }

    // Otros métodos relevantes si es necesario...
}
