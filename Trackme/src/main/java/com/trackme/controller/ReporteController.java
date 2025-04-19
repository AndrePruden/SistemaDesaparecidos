package com.trackme.controller;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.service.FeatureToggleService;
import com.trackme.service.PersonaDesaparecidaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/reportes")
//@CrossOrigin(origins = "http://localhost:4200")
public class ReporteController {
    private static final int MIN_NOMBRE_LENGTH = 2;
    private static final int MAX_EDAD = 200;
    private static final int MIN_AÑO_DESAPARICION = 2024;

    private PersonaDesaparecidaService personaDesaparecidaService;
    private final FeatureToggleService featureToggleService;

<<<<<<< HEAD
    public ReporteController(PersonaDesaparecidaService personaDesaparecidaService, FeatureToggleService featureToggleService) {
        this.personaDesaparecidaService = personaDesaparecidaService;
        this.featureToggleService = featureToggleService;
    }

    @PostMapping("/crear")
    public ResponseEntity<?> crearReporte(@RequestBody PersonaDesaparecida reporte) {
        if (!featureToggleService.isFeatureEnabled("reportes")) {
=======
    public ReporteController(PersonaDesaparecidaService personaDesaparecidaService,
                             FeatureToggleService featureToggleService) {
        this.personaDesaparecidaService = personaDesaparecidaService;
        this.featureToggleService = featureToggleService;
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("Backend activo y funcionando");
    }


    @PostMapping("/crear")
    public ResponseEntity<?> crearReporte(@RequestBody PersonaDesaparecida reporte) {
        if (!featureToggleService.isCreateReportsEnabled()) {
>>>>>>> 4bbb349 (Fix: configuración de CORS y seguridad)
            return ResponseEntity.status(403).body("La funcionalidad de creación de reportes está deshabilitada.");
        }

        // Validaciones
        String validacion = validarReporte(reporte);
        if (validacion != null) {
            return ResponseEntity.badRequest().body(validacion);
        }

        // Asignar fecha actual si no hay fecha
        if (reporte.getFechaDesaparicion() == null) {
            reporte.setFechaDesaparicion(Date.from(LocalDate.now()
                    .atStartOfDay(ZoneId.systemDefault()).toInstant()));
        }

        PersonaDesaparecida nuevoReporte = personaDesaparecidaService.crearReporte(reporte);
        return ResponseEntity.ok(nuevoReporte);
    }

    @GetMapping("/usuario/{email}")
    public ResponseEntity<List<PersonaDesaparecida>> obtenerReportesPorUsuario(@PathVariable String email) {
        List<PersonaDesaparecida> reportes = personaDesaparecidaService.obtenerReportesPorEmail(email);
        return ResponseEntity.ok(reportes);
    }

    @GetMapping("/todos")
    public ResponseEntity<List<PersonaDesaparecida>> obtenerTodosLosReportes() {
        List<PersonaDesaparecida> reportes = personaDesaparecidaService.obtenerTodosLosReportes();
        return ResponseEntity.ok(reportes);
    }

    private String validarReporte(PersonaDesaparecida reporte) {
        if (reporte.getNombre() == null || reporte.getNombre().trim().isEmpty()) {
            return "El nombre no puede estar vacío";
        }
        if (reporte.getNombre().length() < MIN_NOMBRE_LENGTH) {
            return "El nombre debe tener al menos " + MIN_NOMBRE_LENGTH + " caracteres";
        }
        if (Pattern.compile("[0-9]").matcher(reporte.getNombre()).find()) {
            return "El nombre no puede contener números";
        }

        if (reporte.getEdad() == null) {
            return "La edad no puede estar vacía";
        }
        if (reporte.getEdad() <= 0) {
            return "La edad debe ser mayor a 0";
        }
        if (reporte.getEdad() > MAX_EDAD) {
            return "La edad no puede ser mayor a " + MAX_EDAD;
        }

        if (reporte.getFechaDesaparicion() != null) {
            LocalDate fecha = reporte.getFechaDesaparicion().toInstant()
                    .atZone(ZoneId.systemDefault()).toLocalDate();
            if (fecha.getYear() < MIN_AÑO_DESAPARICION) {
                return "El año de desaparición debe ser " + MIN_AÑO_DESAPARICION + " o superior";
            }
        }

        if (reporte.getLugarDesaparicion() == null || reporte.getLugarDesaparicion().trim().isEmpty()) {
            return "El lugar de desaparición no puede estar vacío";
        }

        if (reporte.getDescripcion() != null && reporte.getDescripcion().trim().isEmpty()) {
            return "La descripción no puede contener solo espacios";
        }

        if (reporte.getEmailReportaje() == null || reporte.getEmailReportaje().trim().isEmpty()) {
            return "El email es requerido";
        }

        return null;
    }
}
