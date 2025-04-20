package com.trackme.service;

import com.trackme.model.PersonaDesaparecida;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class ReporteValidationServiceTest {

    private ReporteValidationService reporteValidationService;

    @BeforeEach
    public void setUp() {
        reporteValidationService = new ReporteValidationService();
    }

    @Test
    public void testValidarReporte_Valido() {
        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre("Juan Perez");
        reporte.setEdad(30);
        reporte.setFechaDesaparicion(java.util.Date.from(java.time.LocalDate.of(2025, 4, 20).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()));
        reporte.setLugarDesaparicion("Plaza principal");
        reporte.setDescripcion("Desapareció mientras caminaba.");
        reporte.setEmailReportaje("juan@example.com");

        String resultado = reporteValidationService.validarReporte(reporte);

        assertNull(resultado, "El reporte es válido, no debería haber mensaje de error");
    }

    @Test
    public void testValidarReporte_NombreVacio() {
        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre("");
        reporte.setEdad(30);
        reporte.setFechaDesaparicion(java.util.Date.from(java.time.LocalDate.of(2025, 4, 20).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()));
        reporte.setLugarDesaparicion("Plaza principal");
        reporte.setDescripcion("Desapareció mientras caminaba.");
        reporte.setEmailReportaje("juan@example.com");

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("El nombre no puede estar vacío", resultado);
    }

    @Test
    public void testValidarReporte_NombreCorto() {
        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre("A");
        reporte.setEdad(30);
        reporte.setFechaDesaparicion(java.util.Date.from(java.time.LocalDate.of(2025, 4, 20).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()));
        reporte.setLugarDesaparicion("Plaza principal");
        reporte.setDescripcion("Desapareció mientras caminaba.");
        reporte.setEmailReportaje("juan@example.com");

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("El nombre debe tener al menos 2 caracteres", resultado);
    }

    @Test
    public void testValidarReporte_NombreConNumeros() {
        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre("Juan123");
        reporte.setEdad(30);
        reporte.setFechaDesaparicion(java.util.Date.from(java.time.LocalDate.of(2025, 4, 20).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()));
        reporte.setLugarDesaparicion("Plaza principal");
        reporte.setDescripcion("Desapareció mientras caminaba.");
        reporte.setEmailReportaje("juan@example.com");

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("El nombre no puede contener números", resultado);
    }

    @Test
    public void testValidarReporte_EdadInvalida() {
        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre("Juan Perez");
        reporte.setEdad(-1);  // Edad negativa
        reporte.setFechaDesaparicion(java.util.Date.from(java.time.LocalDate.of(2025, 4, 20).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()));
        reporte.setLugarDesaparicion("Plaza principal");
        reporte.setDescripcion("Desapareció mientras caminaba.");
        reporte.setEmailReportaje("juan@example.com");

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("La edad debe ser mayor a 0", resultado);
    }

    @Test
    public void testValidarReporte_EdadMayorQueMaximo() {
        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre("Juan Perez");
        reporte.setEdad(201);  // Edad mayor a 200
        reporte.setFechaDesaparicion(java.util.Date.from(java.time.LocalDate.of(2025, 4, 20).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()));
        reporte.setLugarDesaparicion("Plaza principal");
        reporte.setDescripcion("Desapareció mientras caminaba.");
        reporte.setEmailReportaje("juan@example.com");

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("La edad no puede ser mayor a 200", resultado);
    }

    @Test
    public void testValidarReporte_AnioDesaparicionInvalido() {
        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre("Juan Perez");
        reporte.setEdad(30);
        reporte.setFechaDesaparicion(java.util.Date.from(java.time.LocalDate.of(2023, 4, 20).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant())); // Año anterior a 2024
        reporte.setLugarDesaparicion("Plaza principal");
        reporte.setDescripcion("Desapareció mientras caminaba.");
        reporte.setEmailReportaje("juan@example.com");

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("El año de desaparición debe ser 2024 o superior", resultado);
    }

    @Test
    public void testValidarReporte_LugarDesaparicionVacio() {
        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre("Juan Perez");
        reporte.setEdad(30);
        reporte.setFechaDesaparicion(java.util.Date.from(java.time.LocalDate.of(2025, 4, 20).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()));
        reporte.setLugarDesaparicion(""); // Lugar vacío
        reporte.setDescripcion("Desapareció mientras caminaba.");
        reporte.setEmailReportaje("juan@example.com");

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("El lugar de desaparición no puede estar vacío", resultado);
    }

    @Test
    public void testValidarReporte_EmailVacio() {
        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre("Juan Perez");
        reporte.setEdad(30);
        reporte.setFechaDesaparicion(java.util.Date.from(java.time.LocalDate.of(2025, 4, 20).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()));
        reporte.setLugarDesaparicion("Plaza principal");
        reporte.setDescripcion("Desapareció mientras caminaba.");
        reporte.setEmailReportaje(""); // Email vacío

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("El email es requerido", resultado);
    }

    @Test
    public void testValidarReporte_DescripcionSoloEspacios() {
        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre("Juan Perez");
        reporte.setEdad(30);
        reporte.setFechaDesaparicion(java.util.Date.from(java.time.LocalDate.of(2025, 4, 20).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()));
        reporte.setLugarDesaparicion("Plaza principal");
        reporte.setDescripcion("   "); // Descripción con solo espacios
        reporte.setEmailReportaje("juan@example.com");

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("La descripción no puede contener solo espacios", resultado);
    }
}
