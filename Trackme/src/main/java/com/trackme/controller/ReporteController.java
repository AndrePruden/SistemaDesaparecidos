package com.trackme.controller;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.service.FeatureToggleService;
import com.trackme.service.PersonaDesaparecidaService;
import com.trackme.service.ReporteValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${feature.create-reports.enabled}")
    public boolean createReportsEnabled;

    @Autowired
    private PersonaDesaparecidaService personaDesaparecidaService;

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

        // Guardar archivo en /uploads y generar URL
        if (file != null && !file.isEmpty()) {
            String urlImagen = guardarImagen(file);
            if (urlImagen == null) {
                return ResponseEntity.status(500).body("Error al guardar imagen.");
            }
            reporte.setImagen(urlImagen); // Campo de la imagen
        }

        // Validar el reporte
        String validacion = reporteValidationService.validarReporte(reporte);
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

    private String guardarImagen(MultipartFile file) {
        try {
            String nombreArchivo = System.currentTimeMillis() + "_" + StringUtils.cleanPath(file.getOriginalFilename());
            Path uploadDir = Paths.get("uploads");
            if (!Files.exists(uploadDir)) Files.createDirectories(uploadDir);

            Path rutaArchivo = uploadDir.resolve(nombreArchivo);
            Files.copy(file.getInputStream(), rutaArchivo, StandardCopyOption.REPLACE_EXISTING);

            return "http://localhost:8080/uploads/" + nombreArchivo;
        } catch (IOException e) {
            return null;
        }
    }

    @GetMapping("/filtrar")
    public ResponseEntity<List<PersonaDesaparecida>> obtenerReportesFiltrados(
            @RequestParam(value = "nombre", required = false) String nombre,
            @RequestParam(value = "edad", required = false) Integer edad,
            @RequestParam(value = "lugar", required = false) String lugar,
            @RequestParam(value = "fecha", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {

        List<PersonaDesaparecida> reportes = personaDesaparecidaService.obtenerTodosLosReportes();

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
        return ResponseEntity.ok(reportes);
    }

}
