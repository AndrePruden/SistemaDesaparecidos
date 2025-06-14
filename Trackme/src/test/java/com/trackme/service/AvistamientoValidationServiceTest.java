package com.trackme.service;

import com.trackme.model.Avistamiento;
import com.trackme.model.PersonaDesaparecida;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ValidationServicesTest {

    @InjectMocks
    private AvistamientoValidationService avistamientoValidationService;

    @InjectMocks
    private ReporteValidationService reporteValidationService;

    // PRUEBAS PARA AvistamientoValidationService
    @Test
    void validarAvistamiento_Valido_RetornaNull() {
        Avistamiento avistamiento = new Avistamiento();
        avistamiento.setUbicacion("Parque Central");
        avistamiento.setDescripcion("Descripción válida");
        avistamiento.setEmailUsuario("user@test.com");
        avistamiento.setFecha(new Date());

        String resultado = avistamientoValidationService.validarAvistamiento(avistamiento);

        assertNull(resultado);
    }

    @Test
    void validarAvistamiento_Null_RetornaMensajeError() {
        String resultado = avistamientoValidationService.validarAvistamiento(null);

        assertEquals("El avistamiento no puede ser nulo.", resultado);
    }

    @Test
    void validarAvistamiento_UbicacionVacia_RetornaMensajeError() {
        Avistamiento avistamiento = new Avistamiento();
        avistamiento.setUbicacion("");
        avistamiento.setDescripcion("Descripción");
        avistamiento.setEmailUsuario("user@test.com");
        avistamiento.setFecha(new Date());

        String resultado = avistamientoValidationService.validarAvistamiento(avistamiento);

        assertEquals("La ubicación es obligatoria.", resultado);
    }

    @Test
    void validarAvistamiento_DescripcionVacia_RetornaMensajeError() {
        Avistamiento avistamiento = new Avistamiento();
        avistamiento.setUbicacion("Ubicación");
        avistamiento.setDescripcion("");
        avistamiento.setEmailUsuario("user@test.com");
        avistamiento.setFecha(new Date());

        String resultado = avistamientoValidationService.validarAvistamiento(avistamiento);

        assertEquals("La descripción es obligatoria.", resultado);
    }

    @Test
    void validarAvistamiento_EmailVacio_RetornaMensajeError() {
        Avistamiento avistamiento = new Avistamiento();
        avistamiento.setUbicacion("Ubicación");
        avistamiento.setDescripcion("Descripción");
        avistamiento.setEmailUsuario("");
        avistamiento.setFecha(new Date());

        String resultado = avistamientoValidationService.validarAvistamiento(avistamiento);

        assertEquals("El email del reportante es obligatorio.", resultado);
    }

    @Test
    void validarAvistamiento_FechaNull_RetornaMensajeError() {
        Avistamiento avistamiento = new Avistamiento();
        avistamiento.setUbicacion("Ubicación");
        avistamiento.setDescripcion("Descripción");
        avistamiento.setEmailUsuario("user@test.com");
        avistamiento.setFecha(null);

        String resultado = avistamientoValidationService.validarAvistamiento(avistamiento);

        assertEquals("La fecha es obligatoria.", resultado);
    }

    // PRUEBAS PARA ReporteValidationService
    @Test
    void validarReporte_Valido_RetornaNull() {
        PersonaDesaparecida reporte = crearReporteValido();

        String resultado = reporteValidationService.validarReporte(reporte);

        assertNull(resultado);
    }

    @Test
    void validarReporte_NombreNull_RetornaMensajeError() {
        PersonaDesaparecida reporte = crearReporteValido();
        reporte.setNombre(null);

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("El nombre no puede estar vacío", resultado);
    }

    @Test
    void validarReporte_NombreVacio_RetornaMensajeError() {
        PersonaDesaparecida reporte = crearReporteValido();
        reporte.setNombre("");

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("El nombre no puede estar vacío", resultado);
    }

    @Test
    void validarReporte_NombreMuyCorto_RetornaMensajeError() {
        PersonaDesaparecida reporte = crearReporteValido();
        reporte.setNombre("A");

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("El nombre debe tener al menos 2 caracteres", resultado);
    }

    @Test
    void validarReporte_NombreConNumeros_RetornaMensajeError() {
        PersonaDesaparecida reporte = crearReporteValido();
        reporte.setNombre("Juan123");

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("El nombre no puede contener números", resultado);
    }

    @Test
    void validarReporte_EdadNull_RetornaMensajeError() {
        PersonaDesaparecida reporte = crearReporteValido();
        reporte.setEdad(null);

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("La edad no puede estar vacía", resultado);
    }

    @Test
    void validarReporte_EdadCero_RetornaMensajeError() {
        PersonaDesaparecida reporte = crearReporteValido();
        reporte.setEdad(0);

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("La edad debe ser mayor a 0", resultado);
    }

    @Test
    void validarReporte_EdadNegativa_RetornaMensajeError() {
        PersonaDesaparecida reporte = crearReporteValido();
        reporte.setEdad(-5);

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("La edad debe ser mayor a 0", resultado);
    }

    @Test
    void validarReporte_EdadMuyAlta_RetornaMensajeError() {
        PersonaDesaparecida reporte = crearReporteValido();
        reporte.setEdad(250);

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("La edad no puede ser mayor a 200", resultado);
    }

    @Test
    void validarReporte_FechaAnteriorA2024_RetornaMensajeError() {
        PersonaDesaparecida reporte = crearReporteValido();
        LocalDate fechaAntigua = LocalDate.of(2023, 1, 1);
        reporte.setFechaDesaparicion(Date.from(fechaAntigua.atStartOfDay(ZoneId.systemDefault()).toInstant()));

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("El año de desaparición debe ser 2024 o superior", resultado);
    }

    @Test
    void validarReporte_LugarDesaparicionVacio_RetornaMensajeError() {
        PersonaDesaparecida reporte = crearReporteValido();
        reporte.setLugarDesaparicion("");

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("El lugar de desaparición no puede estar vacío", resultado);
    }

    @Test
    void validarReporte_LugarDesaparicionNull_RetornaMensajeError() {
        PersonaDesaparecida reporte = crearReporteValido();
        reporte.setLugarDesaparicion(null);

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("El lugar de desaparición no puede estar vacío", resultado);
    }

    @Test
    void validarReporte_DescripcionSoloEspacios_RetornaMensajeError() {
        PersonaDesaparecida reporte = crearReporteValido();
        reporte.setDescripcion("   ");

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("La descripción no puede contener solo espacios", resultado);
    }

    @Test
    void validarReporte_EmailVacio_RetornaMensajeError() {
        PersonaDesaparecida reporte = crearReporteValido();
        reporte.setEmailReportaje("");

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("El email es requerido", resultado);
    }

    @Test
    void validarReporte_EmailNull_RetornaMensajeError() {
        PersonaDesaparecida reporte = crearReporteValido();
        reporte.setEmailReportaje(null);

        String resultado = reporteValidationService.validarReporte(reporte);

        assertEquals("El email es requerido", resultado);
    }

    private PersonaDesaparecida crearReporteValido() {
        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre("Juan Pérez");
        reporte.setEdad(25);
        reporte.setFechaDesaparicion(Date.from(LocalDate.of(2024, 1, 1).atStartOfDay(ZoneId.systemDefault()).toInstant()));
        reporte.setLugarDesaparicion("La Paz");
        reporte.setDescripcion("Descripción válida");
        reporte.setEmailReportaje("test@example.com");
        return reporte;
    }
}