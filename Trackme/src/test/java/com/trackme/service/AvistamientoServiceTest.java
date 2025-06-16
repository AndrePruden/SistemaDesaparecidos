package com.trackme.service;

import com.trackme.model.Avistamiento;
import com.trackme.model.PersonaDesaparecida;
import com.trackme.repository.AvistamientoRepository;
import com.trackme.repository.ReporteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AvistamientoServiceTest {

    @Mock
    private AvistamientoRepository avistamientoRepository;

    @Mock
    private ReporteRepository reporteRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AvistamientoService avistamientoService;

    private Avistamiento avistamiento;
    private PersonaDesaparecida personaDesaparecida;

    @BeforeEach
    void setUp() {
        personaDesaparecida = new PersonaDesaparecida();
        personaDesaparecida.setIdDesaparecido(1L);
        personaDesaparecida.setNombre("Juan Pérez");
        personaDesaparecida.setEmailReportaje("reporter@test.com");

        avistamiento = new Avistamiento();
        avistamiento.setIdAvistamiento(1L);
        avistamiento.setDescripcion("Visto en el parque");
        avistamiento.setEmailUsuario("user@test.com");
        avistamiento.setUbicacion("Parque Central");
        avistamiento.setFecha(new Date());
        avistamiento.setPersonaDesaparecida(personaDesaparecida);
    }

    // PRUEBAS PARA crearAvistamiento()
    @Test
    void crearAvistamiento_ConDescripcionNormal_EnviaNotificacion() {
        when(avistamientoRepository.save(any(Avistamiento.class))).thenReturn(avistamiento);
        when(reporteRepository.findById(1L)).thenReturn(Optional.of(personaDesaparecida));

        Avistamiento resultado = avistamientoService.crearAvistamiento(avistamiento);

        assertNotNull(resultado);
        assertEquals(1L, resultado.getIdAvistamiento());
        verify(avistamientoRepository).save(avistamiento);
        verify(emailService).sendSightingNotification(personaDesaparecida, avistamiento);
    }

    @Test
    void crearAvistamiento_ConDescripcionReporteInicial_NoEnviaNotificacion() {
        avistamiento.setDescripcion("Reporte inicial - descripción");
        when(avistamientoRepository.save(any(Avistamiento.class))).thenReturn(avistamiento);

        Avistamiento resultado = avistamientoService.crearAvistamiento(avistamiento);

        assertNotNull(resultado);
        verify(avistamientoRepository).save(avistamiento);
        verify(emailService, never()).sendSightingNotification(any(), any());
    }

    @Test
    void crearAvistamiento_ConDescripcionNull_NoEnviaNotificacion() {
        avistamiento.setDescripcion(null);
        when(avistamientoRepository.save(any(Avistamiento.class))).thenReturn(avistamiento);

        Avistamiento resultado = avistamientoService.crearAvistamiento(avistamiento);

        assertNotNull(resultado);
        verify(avistamientoRepository).save(avistamiento);
        verify(emailService, never()).sendSightingNotification(any(), any());
    }

    @Test
    void crearAvistamiento_PersonaDesaparecidaNull_NoEnviaNotificacion() {
        avistamiento.setPersonaDesaparecida(null);
        when(avistamientoRepository.save(any(Avistamiento.class))).thenReturn(avistamiento);

        Avistamiento resultado = avistamientoService.crearAvistamiento(avistamiento);

        assertNotNull(resultado);
        verify(avistamientoRepository).save(avistamiento);
        verify(emailService, never()).sendSightingNotification(any(), any());
    }

    @Test
    void crearAvistamiento_ReporteNoEncontrado_NoEnviaNotificacion() {
        when(avistamientoRepository.save(any(Avistamiento.class))).thenReturn(avistamiento);
        when(reporteRepository.findById(1L)).thenReturn(Optional.empty());

        Avistamiento resultado = avistamientoService.crearAvistamiento(avistamiento);

        assertNotNull(resultado);
        verify(avistamientoRepository).save(avistamiento);
        verify(emailService, never()).sendSightingNotification(any(), any());
    }

    @Test
    void crearAvistamiento_ErrorEnEmail_NoLanzaExcepcion() {
        when(avistamientoRepository.save(any(Avistamiento.class))).thenReturn(avistamiento);
        when(reporteRepository.findById(1L)).thenReturn(Optional.of(personaDesaparecida));
        doThrow(new RuntimeException("Error email")).when(emailService)
                .sendSightingNotification(any(), any());

        assertDoesNotThrow(() -> avistamientoService.crearAvistamiento(avistamiento));
        verify(avistamientoRepository).save(avistamiento);
    }

    // PRUEBAS PARA obtenerAvistamientoPorId()
    @Test
    void obtenerAvistamientoPorId_Existente_RetornaAvistamiento() {
        when(avistamientoRepository.findById(1L)).thenReturn(Optional.of(avistamiento));

        Optional<Avistamiento> resultado = avistamientoService.obtenerAvistamientoPorId(1L);

        assertTrue(resultado.isPresent());
        assertEquals(1L, resultado.get().getIdAvistamiento());
    }

    @Test
    void obtenerAvistamientoPorId_NoExistente_RetornaEmpty() {
        when(avistamientoRepository.findById(1L)).thenReturn(Optional.empty());

        Optional<Avistamiento> resultado = avistamientoService.obtenerAvistamientoPorId(1L);

        assertFalse(resultado.isPresent());
    }

    // PRUEBAS PARA obtenerAvistamientosPorUsuario()
    @Test
    void obtenerAvistamientosPorUsuario_ConResultados_RetornaLista() {
        List<Avistamiento> avistamientos = Arrays.asList(avistamiento);
        when(avistamientoRepository.findByEmailUsuario("user@test.com")).thenReturn(avistamientos);

        List<Avistamiento> resultado = avistamientoService.obtenerAvistamientosPorUsuario("user@test.com");

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        assertEquals("user@test.com", resultado.get(0).getEmailUsuario());
    }

    @Test
    void obtenerAvistamientosPorUsuario_SinResultados_RetornaListaVacia() {
        when(avistamientoRepository.findByEmailUsuario("user@test.com")).thenReturn(Collections.emptyList());

        List<Avistamiento> resultado = avistamientoService.obtenerAvistamientosPorUsuario("user@test.com");

        assertNotNull(resultado);
        assertTrue(resultado.isEmpty());
    }

    // PRUEBAS PARA obtenerUltimoAvistamiento()
    @Test
    void obtenerUltimoAvistamiento_ConResultados_RetornaPrimero() {
        List<Avistamiento> avistamientos = Arrays.asList(avistamiento);
        when(avistamientoRepository.findUltimoAvistamientoPorReporte(1L)).thenReturn(avistamientos);

        Optional<Avistamiento> resultado = avistamientoService.obtenerUltimoAvistamiento(1L);

        assertTrue(resultado.isPresent());
        assertEquals(1L, resultado.get().getIdAvistamiento());
    }

    @Test
    void obtenerUltimoAvistamiento_SinResultados_RetornaEmpty() {
        when(avistamientoRepository.findUltimoAvistamientoPorReporte(1L)).thenReturn(Collections.emptyList());

        Optional<Avistamiento> resultado = avistamientoService.obtenerUltimoAvistamiento(1L);

        assertFalse(resultado.isPresent());
    }

    // PRUEBAS PARA obtenerAvistamientosFiltrados()
    @Test
    void obtenerAvistamientosFiltrados_PorNombre_FuncionaCorrectamente() {
        List<Avistamiento> todosAvistamientos = Arrays.asList(avistamiento);
        when(avistamientoRepository.findAll()).thenReturn(todosAvistamientos);

        List<Avistamiento> resultado = avistamientoService.obtenerAvistamientosFiltrados("juan", null, null);

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
    }

    @Test
    void obtenerAvistamientosFiltrados_PorUbicacion_FuncionaCorrectamente() {
        List<Avistamiento> todosAvistamientos = Arrays.asList(avistamiento);
        when(avistamientoRepository.findAll()).thenReturn(todosAvistamientos);

        List<Avistamiento> resultado = avistamientoService.obtenerAvistamientosFiltrados(null, "parque", null);

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
    }

    @Test
    void obtenerAvistamientosFiltrados_PorFecha_FuncionaCorrectamente() {
        LocalDate hoy = LocalDate.now();
        avistamiento.setFecha(Date.from(hoy.atStartOfDay(ZoneId.systemDefault()).toInstant()));
        List<Avistamiento> todosAvistamientos = Arrays.asList(avistamiento);
        when(avistamientoRepository.findAll()).thenReturn(todosAvistamientos);

        List<Avistamiento> resultado = avistamientoService.obtenerAvistamientosFiltrados(null, null, hoy);

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
    }

    // PRUEBAS PARA actualizarAvistamiento()
    @Test
    void actualizarAvistamiento_Existente_ActualizaCorrectamente() {
        Avistamiento actualizado = new Avistamiento();
        actualizado.setDescripcion("Nueva descripción");
        actualizado.setUbicacion("Nueva ubicación");
        actualizado.setFecha(new Date());

        when(avistamientoRepository.findById(1L)).thenReturn(Optional.of(avistamiento));
        when(avistamientoRepository.save(any(Avistamiento.class))).thenReturn(avistamiento);

        Avistamiento resultado = avistamientoService.actualizarAvistamiento(1L, actualizado);

        assertNotNull(resultado);
        verify(avistamientoRepository).save(any(Avistamiento.class));
    }

    @Test
    void actualizarAvistamiento_NoExistente_LanzaExcepcion() {
        Avistamiento actualizado = new Avistamiento();
        when(avistamientoRepository.findById(1L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                avistamientoService.actualizarAvistamiento(1L, actualizado));

        assertTrue(exception.getMessage().contains("Avistamiento no encontrado con ID: 1"));
    }

    @Test
    void actualizarAvistamiento_ConPersonaDesaparecida_ActualizaReferencia() {
        Avistamiento actualizado = new Avistamiento();
        PersonaDesaparecida nuevaPersona = new PersonaDesaparecida();
        nuevaPersona.setIdDesaparecido(2L);
        actualizado.setPersonaDesaparecida(nuevaPersona);

        when(avistamientoRepository.findById(1L)).thenReturn(Optional.of(avistamiento));
        when(avistamientoRepository.save(any(Avistamiento.class))).thenReturn(avistamiento);

        Avistamiento resultado = avistamientoService.actualizarAvistamiento(1L, actualizado);

        assertNotNull(resultado);
        verify(avistamientoRepository).save(any(Avistamiento.class));
    }
}