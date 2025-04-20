package com.trackme.service;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.repository.PersonaDesaparecidaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PersonaDesaparecidaService {

    @Autowired
    private PersonaDesaparecidaRepository personaDesaparecidaRepository;

    public PersonaDesaparecida crearReporte(PersonaDesaparecida reporte) {
        return personaDesaparecidaRepository.save(reporte);
    }

    public List<PersonaDesaparecida> obtenerReportesPorEmail(String email) {
        return personaDesaparecidaRepository.findByEmailReportaje(email);
    }

    public List<PersonaDesaparecida> obtenerTodosLosReportes() {
        return personaDesaparecidaRepository.findAll();
    }
}
