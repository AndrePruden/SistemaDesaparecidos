package com.trackme.service;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.repository.ReporteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PersonaDesaparecidaService {

    @Autowired
    private ReporteRepository reporteRepository;

    public PersonaDesaparecida crearReporte(PersonaDesaparecida reporte) {
        return reporteRepository.save(reporte);
    }

    public List<PersonaDesaparecida> obtenerReportesPorEmail(String email) {
        return reporteRepository.findByEmailReportaje(email);
    }

    public List<PersonaDesaparecida> obtenerTodosLosReportes() {
        return reporteRepository.findAll();
    }
}
