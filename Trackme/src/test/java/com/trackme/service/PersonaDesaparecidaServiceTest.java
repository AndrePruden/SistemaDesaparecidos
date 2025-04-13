package com.trackme.service;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.repository.PersonaDesaparecidaRepository;
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
class PersonaDesaparecidaServiceTest {

    @Mock
    private PersonaDesaparecidaRepository personaDesaparecidaRepository;

    @InjectMocks
    private PersonaDesaparecidaService personaDesaparecidaService;

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
        when(personaDesaparecidaRepository.save(any(PersonaDesaparecida.class))).thenReturn(reporte);
        PersonaDesaparecida result = personaDesaparecidaService.crearReporte(reporte);

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
        when(personaDesaparecidaRepository.findByEmailReportaje("test@example.com")).thenReturn(reportes);

        List<PersonaDesaparecida> result = personaDesaparecidaService.obtenerReportesPorEmail("test@example.com");

        assertNotNull(result);
        assertFalse(result.isEmpty());
    }

    @Test
    void testObtenerTodosLosReportes_Vacio() {
        when(personaDesaparecidaRepository.findAll()).thenReturn(List.of());
    
        List<PersonaDesaparecida> result = personaDesaparecidaService.obtenerTodosLosReportes();
    
        assertNotNull(result);
        assertTrue(result.isEmpty(), "La lista debe estar vacía si no hay reportes en el sistema");
    }

    @Test
    void testCrearReporte_CamposNulos() {
    PersonaDesaparecida reporteParcial = new PersonaDesaparecida(); 
    when(personaDesaparecidaRepository.save(any(PersonaDesaparecida.class))).thenReturn(reporteParcial);

    PersonaDesaparecida result = personaDesaparecidaService.crearReporte(reporteParcial);

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
        when(personaDesaparecidaRepository.findAll()).thenReturn(reportes);

        List<PersonaDesaparecida> result = personaDesaparecidaService.obtenerTodosLosReportes();

        assertNotNull(result);
        assertFalse(result.isEmpty());
    }
    @Test
    void testObtenerReportesPorEmail_SinResultados() {
        
    when(personaDesaparecidaRepository.findByEmailReportaje("noexist@example.com"))
        .thenReturn(List.of());

    List<PersonaDesaparecida> resultados = 
        personaDesaparecidaService.obtenerReportesPorEmail("noexist@example.com");

    assertTrue(resultados.isEmpty());  // Verificar que la lista está vacía
    verify(personaDesaparecidaRepository, times(1))
        .findByEmailReportaje("noexist@example.com");
    }
    @Test
    void testCrearReporte_FechaNoNula() {
        when(personaDesaparecidaRepository.save(any(PersonaDesaparecida.class))).thenReturn(reporte);
        
        PersonaDesaparecida resultado = personaDesaparecidaService.crearReporte(reporte);
        
        assertNotNull(resultado.getFechaDesaparicion());  // Verificar que la fecha no es nula
        assertTrue(resultado.getFechaDesaparicion() instanceof Date);  // Verificar que es tipo Date
    }
}