package com.trackme.controller;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.service.FeatureToggleService;
import com.trackme.service.ReporteService;
import com.trackme.service.ReporteValidationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/reportes")
@CrossOrigin(origins = "http://localhost:4200")
public class ReporteController {

    private static final Logger logger = LoggerFactory.getLogger(ReporteController.class);

    @Autowired
    private ReporteService reporteService;

    @Autowired
    private ReporteValidationService reporteValidationService;

    @Autowired
    private FeatureToggleService featureToggleService;

    @PostMapping("/crear")
    public ResponseEntity<?> crearReporteConImagen(
            @RequestParam("nombre") String nombre,
            @RequestParam("edad") Integer edad,
            @RequestParam("fechaDesaparicion") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesaparicion,
            @RequestParam("lugarDesaparicion") String lugarDesaparicion,
            @RequestParam("descripcion") String descripcion,
            @RequestParam("emailReportaje") String emailReportaje,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) {
        logger.info("Intentando crear un nuevo reporte para: {}", nombre);

        if (!featureToggleService.isCreateReportsEnabled()) {
            logger.warn("Intento de crear reporte mientras el feature toggle está desactivado.");
            return ResponseEntity.status(403).body("La funcionalidad de creación de reportes está deshabilitada.");
        }

        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre(nombre);
        reporte.setEdad(edad);
        reporte.setFechaDesaparicion(Date.from(fechaDesaparicion.atStartOfDay(ZoneId.systemDefault()).toInstant()));
        reporte.setLugarDesaparicion(lugarDesaparicion);
        reporte.setDescripcion(descripcion);
        reporte.setEmailReportaje(emailReportaje);

        if (file != null && !file.isEmpty()) {
            logger.info("Se recibió un archivo: {}", file.getOriginalFilename());
            String urlImagen = guardarImagen(file);
            if (urlImagen == null) {
                logger.error("Error al guardar imagen para el reporte de {}", nombre);
                return ResponseEntity.status(500).body("Error al guardar imagen.");
            }
            reporte.setImagen(urlImagen);
            logger.debug("Imagen guardada correctamente: {}", urlImagen);
        }

        String validacion = reporteValidationService.validarReporte(reporte);
        if (validacion != null) {
            logger.warn("Validación fallida para reporte de {}: {}", nombre, validacion);
            return ResponseEntity.badRequest().body(validacion);
        }

        PersonaDesaparecida nuevoReporte = reporteService.crearReporte(reporte);
        logger.info("Reporte creado exitosamente con ID: {}", nuevoReporte.getIdDesaparecido());
        return ResponseEntity.ok(nuevoReporte);
    }

    @GetMapping("/usuario/{email}")
    public ResponseEntity<List<PersonaDesaparecida>> obtenerReportesPorUsuario(@PathVariable String email) {
        logger.info("Obteniendo reportes para el usuario con email: {}", email);
        List<PersonaDesaparecida> reportes = reporteService.obtenerReportesPorEmail(email);
        logger.debug("Se encontraron {} reportes para el usuario {}", reportes.size(), email);
        return ResponseEntity.ok(reportes);
    }

    @GetMapping("/todos")
    public ResponseEntity<List<PersonaDesaparecida>> obtenerTodosLosReportes() {
        logger.info("Solicitud para obtener todos los reportes");
        List<PersonaDesaparecida> reportes = reporteService.obtenerTodosLosReportes();
        logger.debug("Total de reportes encontrados: {}", reportes.size());
        return ResponseEntity.ok(reportes);
    }

    @GetMapping("/filtrar")
    public ResponseEntity<List<PersonaDesaparecida>> obtenerReportesFiltrados(
            @RequestParam(value = "nombre", required = false) String nombre,
            @RequestParam(value = "edad", required = false) Integer edad,
            @RequestParam(value = "lugar", required = false) String lugar,
            @RequestParam(value = "fecha", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {

        logger.info("Aplicando filtros a los reportes: nombre={}, edad={}, lugar={}, fecha={}", nombre, edad, lugar, fecha);

        List<PersonaDesaparecida> reportes = reporteService.obtenerTodosLosReportes();

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
        logger.debug("Total de reportes después del filtrado: {}", reportes.size());
        return ResponseEntity.ok(reportes);
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

}