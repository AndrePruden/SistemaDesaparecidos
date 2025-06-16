package com.trackme.service;

import com.trackme.model.Avistamiento;
import com.trackme.model.DesaparecidoOficial;
import com.trackme.model.PersonaDesaparecida;
import com.trackme.repository.AvistamientoRepository;
import com.trackme.repository.DesaparecidoOficialRepository;
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
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ReporteService {

    private static final Logger logger = LoggerFactory.getLogger(ReporteService.class);

    @Autowired
    private ReporteRepository reporteRepository;

    @Autowired
    private DesaparecidoOficialRepository desaparecidoOficialRepository;

    @Autowired
    private AvistamientoRepository avistamientoRepository;

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

        // Guardar el reporte
        PersonaDesaparecida reporteGuardado = reporteRepository.save(reporte);

        // Crear avistamiento inicial (sin notificación)
        this.crearAvistamientoInicial(reporteGuardado, emailReportaje);

        return reporteGuardado;
    }

    private void crearAvistamientoInicial(PersonaDesaparecida reporte, String emailUsuario) {
        try {
            Avistamiento avistamientoInicial = new Avistamiento();
            avistamientoInicial.setPersonaDesaparecida(reporte);
            avistamientoInicial.setEmailUsuario(emailUsuario);
            avistamientoInicial.setFecha(reporte.getFechaDesaparicion());
            avistamientoInicial.setUbicacion(reporte.getLugarDesaparicion());
            avistamientoInicial.setDescripcion("Reporte inicial - " + reporte.getDescripcion());

            avistamientoRepository.save(avistamientoInicial);

            logger.info("Avistamiento inicial creado para reporte ID: {}", reporte.getIdDesaparecido());
        } catch (Exception e) {
            logger.error("Error al crear avistamiento inicial para reporte ID: {} - {}",
                    reporte.getIdDesaparecido(), e.getMessage());
            // No lanzamos excepción para no afectar la creación del reporte
        }
    }

    private boolean esPersonaValida(String nombre) {
        List<DesaparecidoOficial> coincidencias = desaparecidoOficialRepository.findByNombreContainingIgnoreCase(nombre);
        boolean encontrada = !coincidencias.isEmpty();
        if (!encontrada) {
            logger.warn("La persona '{}' no está registrada oficialmente en la base local de desaparecidos", nombre);
        } else {
            logger.info("Persona '{}' validada contra desaparecidos oficiales", nombre);
        }
        return encontrada;
    }

    private String guardarImagen(MultipartFile file) {
        try {
            String nombreArchivo = System.currentTimeMillis() + "_" + StringUtils.cleanPath(file.getOriginalFilename());
            Path uploadDir = Paths.get("uploads");
            if (!Files.exists(uploadDir)) Files.createDirectories(uploadDir);

            Path rutaArchivo = uploadDir.resolve(nombreArchivo);
            Files.copy(file.getInputStream(), rutaArchivo, StandardCopyOption.REPLACE_EXISTING);

            return "http://sistemadesaparecidos-production-6b5e.up.railway.app/uploads/" + nombreArchivo;
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

    public void archivarReporte(Long id) {
        Optional<PersonaDesaparecida> optionalReporte = reporteRepository.findById(id);
        if (optionalReporte.isPresent()) {
            PersonaDesaparecida reporte = optionalReporte.get();
            reporte.setEstado(false);
            reporteRepository.save(reporte);
        } else {
            throw new RuntimeException("Reporte no encontrado con ID: " + id);
        }
    }
}