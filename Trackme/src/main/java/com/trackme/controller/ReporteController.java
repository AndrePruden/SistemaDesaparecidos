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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

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
    public ResponseEntity<?> crearReporte(
            @RequestParam("nombre") String nombre,
            @RequestParam("edad") Integer edad,
            @RequestParam("fechaDesaparicion") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesaparicion,
            @RequestParam("lugarDesaparicion") String lugarDesaparicion,
            @RequestParam("descripcion") String descripcion,
            @RequestParam("emailReportaje") String emailReportaje,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) {
        if (featureToggleService.isCreateReportsEnabled() || emailReportaje !=null) {
            try {
                PersonaDesaparecida reporte = reporteService.crearReporte(nombre, edad, fechaDesaparicion, lugarDesaparicion, descripcion, emailReportaje, file);
                String validacion = reporteValidationService.validarReporte(reporte);
                if (validacion != null) {
                    return ResponseEntity.badRequest().body(validacion);
                }
                return ResponseEntity.ok(reporte);
            } catch (Exception e) {
                logger.error("Error al crear el reporte", e);
                return ResponseEntity.status(500).body(e.getMessage());
            }
        } else {
            logger.warn("Intento de crear reporte por usuario no logueado mientras el feature toggle está desactivado.");
            return ResponseEntity.status(403).body("La creación de reportes está deshabilitada para usuarios no logueados.");
        }
    }

    @GetMapping("/usuario/{email}")
    public ResponseEntity<List<PersonaDesaparecida>> obtenerReportesPorUsuario(@PathVariable String email) {
        List<PersonaDesaparecida> reportes = reporteService.obtenerReportesPorEmail(email);
        return ResponseEntity.ok(reportes);
    }

    @GetMapping("/todos")
    public ResponseEntity<List<PersonaDesaparecida>> obtenerTodosLosReportes() {
        List<PersonaDesaparecida> reportes = reporteService.obtenerTodosLosReportes();
        return ResponseEntity.ok(reportes);
    }

    @GetMapping("/filtrar")
    public ResponseEntity<List<PersonaDesaparecida>> obtenerReportesFiltrados(
            @RequestParam(value = "nombre", required = false) String nombre,
            @RequestParam(value = "edad", required = false) Integer edad,
            @RequestParam(value = "lugar", required = false) String lugar,
            @RequestParam(value = "fecha", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {

        List<PersonaDesaparecida> reportes = reporteService.obtenerReportesFiltrados(nombre, edad, lugar, fecha);
        return ResponseEntity.ok(reportes);
    }
}
