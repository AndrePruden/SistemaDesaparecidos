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

    @Autowired
    private ScrapingService scrapingService;

    public PersonaDesaparecida crearReporte(PersonaDesaparecida reporte) {
        logger.info("Creando nuevo reporte para: {}", reporte.getNombre());
        boolean personaRegistrada = scrapingService.verificarPersonaDesaparecida(reporte.getNombre());

        if (!personaRegistrada) {
            logger.warn("La persona {} no está registrada oficialmente en la página de la Policía Boliviana", reporte.getNombre());
            throw new RuntimeException("La persona debe estar registrada oficialmente en la página de la Policía Boliviana.");
        }

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