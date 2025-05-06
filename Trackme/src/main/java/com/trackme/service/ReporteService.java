package com.trackme.service;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.repository.ReporteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReporteService {

    private static final Logger logger = LoggerFactory.getLogger(ReporteService.class);

    @Autowired
    private ReporteRepository reporteRepository;

    @Autowired
    private ScrapingService scrapingService;

    public PersonaDesaparecida crearReporte(String nombre, Integer edad, LocalDate fechaDesaparicion,
                                            String lugarDesaparicion, String descripcion, String emailReportaje,
                                            MultipartFile file) {
        if (!esPersonaValida(nombre)) {
            throw new RuntimeException("La persona no está registrada en la página de la policía boliviana de desaparecidos.");
        }

        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre(nombre);
        reporte.setEdad(edad);
        reporte.setFechaDesaparicion(Date.from(fechaDesaparicion.atStartOfDay(ZoneId.systemDefault()).toInstant()));
        reporte.setLugarDesaparicion(lugarDesaparicion);
        reporte.setDescripcion(descripcion);
        reporte.setEmailReportaje(emailReportaje);

        if (file != null && !file.isEmpty()) {
            String urlImagen = guardarImagen(file);
            if (urlImagen != null) {
                reporte.setImagen(urlImagen);
            } else {
                throw new RuntimeException("Error al guardar imagen.");
            }
        }

        return reporteRepository.save(reporte);
    }

    private boolean esPersonaValida(String nombre) {
        boolean personaRegistrada = scrapingService.verificarPersonaDesaparecida(nombre);
        if (!personaRegistrada) {
            logger.warn("La persona {} no está registrada oficialmente en la página de la Policía Boliviana", nombre);
        }
        return personaRegistrada;
    }

    private String guardarImagen(MultipartFile file) {
        try {
            String nombreArchivo = System.currentTimeMillis() + "_" + StringUtils.cleanPath(file.getOriginalFilename());
            Path uploadDir = Paths.get("uploads");
            if (!Files.exists(uploadDir)) Files.createDirectories(uploadDir);

            Path rutaArchivo = uploadDir.resolve(nombreArchivo);
            Files.copy(file.getInputStream(), rutaArchivo, StandardCopyOption.REPLACE_EXISTING);

            return "http://localhost:8080/uploads/" + nombreArchivo;
        } catch (IOException e) {
            logger.error("Error al guardar imagen: {}", e.getMessage(), e);
            return null;
        }
    }

    public List<PersonaDesaparecida> obtenerReportesPorEmail(String email) {
        return reporteRepository.findByEmailReportaje(email);
    }

    public List<PersonaDesaparecida> obtenerTodosLosReportes() {
        return reporteRepository.findAll();
    }

    public List<PersonaDesaparecida> obtenerReportesFiltrados(String nombre, Integer edad, String lugar, LocalDate fecha) {
        List<PersonaDesaparecida> reportes = obtenerTodosLosReportes();

        if (nombre != null && !nombre.isEmpty()) {
            reportes = reportes.stream()
                    .filter(r -> r.getNombre().toLowerCase().contains(nombre.toLowerCase()))
                    .collect(Collectors.toList());
        }
        if (edad != null) {
            reportes = reportes.stream()
                    .filter(r -> r.getEdad().equals(edad))
                    .collect(Collectors.toList());
        }
        if (lugar != null && !lugar.isEmpty()) {
            reportes = reportes.stream()
                    .filter(r -> r.getLugarDesaparicion().toLowerCase().contains(lugar.toLowerCase()))
                    .collect(Collectors.toList());
        }
        if (fecha != null) {
            reportes = reportes.stream()
                    .filter(r -> r.getFechaDesaparicion().toInstant().atZone(ZoneId.systemDefault()).toLocalDate().equals(fecha))
                    .collect(Collectors.toList());
        }

        return reportes;
    }
}