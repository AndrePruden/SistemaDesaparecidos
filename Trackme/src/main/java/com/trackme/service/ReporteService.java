package com.trackme.service;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.repository.ReporteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReporteService {

    private static final Logger logger = LoggerFactory.getLogger(ReporteService.class);

    @Autowired
    private ReporteRepository reporteRepository;

    public PersonaDesaparecida crearReporte(PersonaDesaparecida reporte) {
        logger.info("Creando nuevo reporte para: {}", reporte.getNombre());
        return reporteRepository.save(reporte);
    }

    public List<PersonaDesaparecida> obtenerReportesPorEmail(String email) {
        logger.debug("Obteniendo reportes para el email: {}", email);
        return reporteRepository.findByEmailReportaje(email);
    }

    public List<PersonaDesaparecida> obtenerTodosLosReportes() {
        logger.debug("Obteniendo todos los reportes");
        return reporteRepository.findAll();
    }
}