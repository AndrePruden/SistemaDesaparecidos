package com.trackme.controller;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.service.FeatureToggleService;
import com.trackme.service.PersonaDesaparecidaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/reportes")
@CrossOrigin(origins = "http://localhost:4200")
public class ReporteController {

    private static final int MIN_NOMBRE_LENGTH = 2;
    private static final int MAX_EDAD = 200;
    private static final int MIN_AÑO_DESAPARICION = 2024;

    @Value("${feature.create-reports.enabled}")
    public boolean createReportsEnabled;

    @Autowired
    private PersonaDesaparecidaService personaDesaparecidaService;
    private final FeatureToggleService featureToggleService;

    public ReporteController(PersonaDesaparecidaService personaDesaparecidaService,
                             FeatureToggleService featureToggleService) {
        this.personaDesaparecidaService = personaDesaparecidaService;
        this.featureToggleService = featureToggleService;
    }

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
        if (!createReportsEnabled) {
            return ResponseEntity.status(403).body("La funcionalidad de creación de reportes está deshabilitada.");
        }

        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre(nombre);
        reporte.setEdad(edad);
        reporte.setFechaDesaparicion(Date.from(fechaDesaparicion.atStartOfDay(ZoneId.systemDefault()).toInstant()));
        reporte.setLugarDesaparicion(lugarDesaparicion);
        reporte.setDescripcion(descripcion);
        reporte.setEmailReportaje(emailReportaje);

        // ✅ Guardar archivo en /uploads y generar URL
        if (file != null && !file.isEmpty()) {
            try {
                String nombreArchivo = System.currentTimeMillis() + "_" + StringUtils.cleanPath(file.getOriginalFilename());
                Path uploadDir = Paths.get("uploads");
                if (!Files.exists(uploadDir)) Files.createDirectories(uploadDir);

                Path rutaArchivo = uploadDir.resolve(nombreArchivo);
                Files.copy(file.getInputStream(), rutaArchivo, StandardCopyOption.REPLACE_EXISTING);

                String urlImagen = "http://localhost:8080/uploads/" + nombreArchivo;
                reporte.setImagen(urlImagen); // 👈 campo que se agregará abajo

            } catch (IOException e) {
                return ResponseEntity.status(500).body("Error al guardar imagen: " + e.getMessage());
            }
        }

        String validacion = validarReporte(reporte);
        if (validacion != null) {
            return ResponseEntity.badRequest().body(validacion);
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
