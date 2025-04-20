package com.trackme.controller;

import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;



import com.trackme.model.PersonaDesaparecida;
import com.trackme.service.PersonaDesaparecidaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReporteControllerTest {
//    @Mock
//    private PersonaDesaparecidaService personaDesaparecidaService;
//
//    @InjectMocks
//    private ReporteController reporteController;
//
//    private PersonaDesaparecida reporte1;
//    private PersonaDesaparecida reporte2;
//    private PersonaDesaparecida reporte3;
//    private List<PersonaDesaparecida> reportesList;
//
//    @BeforeEach
//    void setUp() {
//        MockitoAnnotations.openMocks(this);
//
//        reporte1 = crearReporteEjemplo(1L, "test@example.com", "Juan Pérez");
//        reporte2 = crearReporteEjemplo(2L, "test2@example.com", "María García");
//        reporte3 = crearReporteEjemplo(2L, "test2@example.com", "Walter Rocha");
//        reportesList = Arrays.asList(reporte1, reporte2, reporte3);
//    }
//
//    private PersonaDesaparecida crearReporteEjemplo(Long id, String email, String nombre) {
//        PersonaDesaparecida reporte = new PersonaDesaparecida();
//        reporte.setIdDesaparecido(id);
//        reporte.setEmailReportaje(email);
//        reporte.setNombre(nombre);
//        reporte.setEdad(30);
//        reporte.setLugarDesaparicion("Ciudad Ejemplo");
//        reporte.setDescripcion("Descripción de ejemplo");
//        return reporte;
//    }
//
//    @Test
//    void crearReporte_DeberiaRetornarReporteCreado() {
//        when(personaDesaparecidaService.crearReporte(any(PersonaDesaparecida.class))).thenReturn(reporte1);
//
//        ResponseEntity<PersonaDesaparecida> response = (ResponseEntity<PersonaDesaparecida>) reporteController.crearReporte(reporte1);
//
//        assertAll(
//            () -> assertNotNull(response, "La respuesta no debería ser nula"),
//            () -> assertEquals(HttpStatus.OK, response.getStatusCode(), "El código de estado debería ser OK"),
//            () -> assertNotNull(response.getBody(), "El cuerpo de la respuesta no debería ser nulo"),
//            () -> assertEquals(reporte1, response.getBody(), "El reporte devuelto no coincide con el esperado")
//        );
//        verify(personaDesaparecidaService, times(1)).crearReporte(any(PersonaDesaparecida.class));
//    }
//
//    @Test
//    void obtenerReportesPorUsuario_DeberiaRetornarListaDeReportes() {
//        String email = "test@example.com";
//        when(personaDesaparecidaService.obtenerReportesPorEmail(email)).thenReturn(reportesList);
//
//        ResponseEntity<List<PersonaDesaparecida>> response = reporteController.obtenerReportesPorUsuario(email);
//
//        assertAll(
//            () -> assertNotNull(response, "La respuesta no debería ser nula"),
//            () -> assertEquals(HttpStatus.OK, response.getStatusCode(), "El código de estado debería ser OK"),
//            () -> assertNotNull(response.getBody(), "El cuerpo de la respuesta no debería ser nulo"),
//            () -> assertEquals(2, response.getBody().size(), "Deberían devolverse 2 reportes")
//        );
//        verify(personaDesaparecidaService, times(1)).obtenerReportesPorEmail(email);
//    }
//
//    @Test
//    void obtenerReportesPorUsuario_ConEmailInexistente_DeberiaRetornarListaVacia() {
//        String email = "noexiste@example.com";
//        when(personaDesaparecidaService.obtenerReportesPorEmail(email)).thenReturn(Collections.emptyList());
//
//        ResponseEntity<List<PersonaDesaparecida>> response = reporteController.obtenerReportesPorUsuario(email);
//
//        assertAll(
//            () -> assertNotNull(response, "La respuesta no debería ser nula"),
//            () -> assertEquals(HttpStatus.OK, response.getStatusCode(), "El código de estado debería ser OK"),
//            () -> assertNotNull(response.getBody(), "El cuerpo de la respuesta no debería ser nulo"),
//            () -> assertTrue(response.getBody().isEmpty(), "La lista debería estar vacía")
//        );
//        verify(personaDesaparecidaService, times(1)).obtenerReportesPorEmail(email);
//    }
//
//    @Test
//    void obtenerTodosLosReportes_DeberiaRetornarTodosLosReportes() {
//        when(personaDesaparecidaService.obtenerTodosLosReportes()).thenReturn(reportesList);
//
//        ResponseEntity<List<PersonaDesaparecida>> response = reporteController.obtenerTodosLosReportes();
//
//        assertAll(
//            () -> assertNotNull(response, "La respuesta no debería ser nula"),
//            () -> assertEquals(HttpStatus.OK, response.getStatusCode(), "El código de estado debería ser OK"),
//            () -> assertNotNull(response.getBody(), "El cuerpo de la respuesta no debería ser nulo"),
//            () -> assertEquals(2, response.getBody().size(), "Deberían devolverse todos los reportes")
//        );
//        verify(personaDesaparecidaService, times(1)).obtenerTodosLosReportes();
//    }
//
//    @Test
//    void obtenerTodosLosReportes_SinReportes_DeberiaRetornarListaVacia() {
//        when(personaDesaparecidaService.obtenerTodosLosReportes()).thenReturn(Collections.emptyList());
//
//        ResponseEntity<List<PersonaDesaparecida>> response = reporteController.obtenerTodosLosReportes();
//
//        assertAll(
//            () -> assertNotNull(response, "La respuesta no debería ser nula"),
//            () -> assertEquals(HttpStatus.OK, response.getStatusCode(), "El código de estado debería ser OK"),
//            () -> assertNotNull(response.getBody(), "El cuerpo de la respuesta no debería ser nulo"),
//            () -> assertTrue(response.getBody().isEmpty(), "La lista debería estar vacía")
//        );
//        verify(personaDesaparecidaService, times(1)).obtenerTodosLosReportes();
//    }
//
//// PruebasUnitariasSalma - 1
//    @Test
//    void crearReporte_ConNombreInvalido_DeberiaRetornarBadRequest() {
//        reporteController.createReportsEnabled = true;
//        PersonaDesaparecida reporteInvalido = crearReporteEjemplo(null, "test@example.com", "1");
//        ResponseEntity<?> response = reporteController.crearReporte(reporteInvalido);
//        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode(), "Debería retornar BAD_REQUEST");
//    }
//// PruebasUnitariasSalma - 2
//    @Test
//    void crearReporte_FuncionalidadDeshabilitada_DeberiaRetornarForbidden() throws Exception {
//        reporteController = new ReporteController() {{
//            personaDesaparecidaService = ReporteControllerTest.this.personaDesaparecidaService;
//            createReportsEnabled = false;
//        }};
//        PersonaDesaparecida reporteValido = crearReporteEjemplo(4L, "usuario@example.com", "Carlos López");
//        ResponseEntity<?> response = reporteController.crearReporte(reporteValido);
//        assertAll(
//                () -> assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode(), "Debería retornar FORBIDDEN"),
//                () -> assertEquals("La funcionalidad de creación de reportes está deshabilitada.", response.getBody())
//        );
//        verify(personaDesaparecidaService, never()).crearReporte(any());
//    }
//
//
//    @Test //PRUEBA UNITARIA #1 - ANDRE PRUDENCIO
//    void obtenerReportesPorUsuario_DeberiaRetornarReporteCuandoEmailEsValido() {
//        String email = "test@example.com";
//        when(personaDesaparecidaService.obtenerReportesPorEmail(email)).thenReturn(reportesList);
//
//        ResponseEntity<List<PersonaDesaparecida>> response = reporteController.obtenerReportesPorUsuario(email);
//
//        assertAll(
//                () -> assertNotNull(response, "La respuesta no debería ser nula"),
//                () -> assertEquals(HttpStatus.OK, response.getStatusCode(), "El código de estado debería ser OK"),
//                () -> assertNotNull(response.getBody(), "El cuerpo de la respuesta no debería ser nulo"),
//                () -> assertEquals(3, response.getBody().size(), "Deberían devolverse 2 reportes")
//        );
//
//        // Verificamos que el servicio fue llamado una vez con el email correcto
//        verify(personaDesaparecidaService, times(1)).obtenerReportesPorEmail(email);
//    }
//
//    @Test //PRUEBA UNITARIA #2 - ANDRE PRUDENCIO
//    void obtenerReportesPorUsuario_ConEmailNulo_DeberiaRetornarListaVacia() {
//        String email = null;
//        when(personaDesaparecidaService.obtenerReportesPorEmail(email)).thenReturn(Collections.emptyList());
//
//        ResponseEntity<List<PersonaDesaparecida>> response = reporteController.obtenerReportesPorUsuario(email);
//
//        assertAll(
//                () -> assertNotNull(response, "La respuesta no debería ser nula"),
//                () -> assertEquals(HttpStatus.OK, response.getStatusCode(), "El código de estado debería ser OK"),
//                () -> assertNotNull(response.getBody(), "El cuerpo de la respuesta no debería ser nulo"),
//                () -> assertTrue(response.getBody().isEmpty(), "La lista debería estar vacía")
//        );
//
//        verify(personaDesaparecidaService, times(1)).obtenerReportesPorEmail(email);
//    }
}