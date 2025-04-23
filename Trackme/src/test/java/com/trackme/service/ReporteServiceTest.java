package com.trackme.service;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.repository.ReporteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;      
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReporteServiceTest {

    @Mock
    private ReporteRepository reporteRepository;

    @InjectMocks
    private ReporteService reporteService;

    private PersonaDesaparecida reporte;

    @BeforeEach
    void setUp() {
        reporte = new PersonaDesaparecida();
        reporte.setIdDesaparecido(1L);
        reporte.setEmailReportaje("test@example.com");
        reporte.setNombre("Juan Perez");
        reporte.setEdad(30);  // Asigna un valor para la edad
        reporte.setFechaDesaparicion(new Date());  // Establece la fecha actual
        reporte.setLugarDesaparicion("Ciudad X");  // Asigna un lugar
        reporte.setDescripcion("Descripción del caso");  // Agrega una descripción
    }

    @Test
    void testCrearReporte() {
        when(reporteRepository.save(any(PersonaDesaparecida.class))).thenReturn(reporte);
        PersonaDesaparecida result = reporteService.crearReporte(reporte);

        assertNotNull(result);
        assertEquals(reporte.getIdDesaparecido(), result.getIdDesaparecido());
        assertEquals(reporte.getNombre(), result.getNombre());
        assertEquals(reporte.getEdad(), result.getEdad());
        assertNotNull(result.getFechaDesaparicion());
        assertEquals(reporte.getLugarDesaparicion(), result.getLugarDesaparicion());
        assertEquals(reporte.getDescripcion(), result.getDescripcion());
    }

    @Test
    void testObtenerReportesPorEmail() {
        List<PersonaDesaparecida> reportes = Arrays.asList(reporte);
        when(reporteRepository.findByEmailReportaje("test@example.com")).thenReturn(reportes);

        List<PersonaDesaparecida> result = reporteService.obtenerReportesPorEmail("test@example.com");

        assertNotNull(result);
        assertFalse(result.isEmpty());
    }

    @Test
    void testObtenerTodosLosReportes_Vacio() {
        when(reporteRepository.findAll()).thenReturn(List.of());
    
        List<PersonaDesaparecida> result = reporteService.obtenerTodosLosReportes();
    
        assertNotNull(result);
        assertTrue(result.isEmpty(), "La lista debe estar vacía si no hay reportes en el sistema");
    }

    @Test
    void testCrearReporte_CamposNulos() {
    PersonaDesaparecida reporteParcial = new PersonaDesaparecida(); 
    when(reporteRepository.save(any(PersonaDesaparecida.class))).thenReturn(reporteParcial);

    PersonaDesaparecida result = reporteService.crearReporte(reporteParcial);

    assertNotNull(result);
    assertNull(result.getNombre());
    assertNull(result.getEmailReportaje());
    assertNull(result.getFechaDesaparicion());
    assertNull(result.getLugarDesaparicion());
    assertNull(result.getDescripcion());
    }

    @Test
    void testObtenerTodosLosReportes() {
        List<PersonaDesaparecida> reportes = Arrays.asList(reporte);
        when(reporteRepository.findAll()).thenReturn(reportes);

        List<PersonaDesaparecida> result = reporteService.obtenerTodosLosReportes();

        assertNotNull(result);
        assertFalse(result.isEmpty());
    }
    @Test
    void testObtenerReportesPorEmail_SinResultados() {
        
    when(reporteRepository.findByEmailReportaje("noexist@example.com"))
        .thenReturn(List.of());

    List<PersonaDesaparecida> resultados = 
        reporteService.obtenerReportesPorEmail("noexist@example.com");

    assertTrue(resultados.isEmpty());  // Verificar que la lista está vacía
    verify(reporteRepository, times(1))
        .findByEmailReportaje("noexist@example.com");
    }
    @Test
    void testCrearReporte_FechaNoNula() {
        when(reporteRepository.save(any(PersonaDesaparecida.class))).thenReturn(reporte);
        
        PersonaDesaparecida resultado = reporteService.crearReporte(reporte);
        
        assertNotNull(resultado.getFechaDesaparicion());  // Verificar que la fecha no es nula
        assertTrue(resultado.getFechaDesaparicion() instanceof Date);  // Verificar que es tipo Date
    }
}