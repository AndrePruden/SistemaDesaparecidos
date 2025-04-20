package com.trackme.service;

import com.trackme.model.Avistamiento;
import com.trackme.model.PersonaDesaparecida;
import com.trackme.repository.AvistamientoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AvistamientoServiceTest {

    @Mock
    private AvistamientoRepository avistamientoRepository;

    @InjectMocks
    private AvistamientoService avistamientoService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void crearAvistamiento_deberiaGuardarYRetornarElAvistamiento() {
        Avistamiento avistamiento = new Avistamiento();
        when(avistamientoRepository.save(avistamiento)).thenReturn(avistamiento);

        Avistamiento resultado = avistamientoService.crearAvistamiento(avistamiento);

        assertNotNull(resultado);
        verify(avistamientoRepository).save(avistamiento);
    }

    @Test
    void obtenerAvistamientosPorUsuario_deberiaRetornarListaDeAvistamientos() {
        String email = "test@correo.com";
        List<Avistamiento> listaMock = Arrays.asList(new Avistamiento(), new Avistamiento());

        when(avistamientoRepository.findByEmailUsuario(email)).thenReturn(listaMock);

        List<Avistamiento> resultado = avistamientoService.obtenerAvistamientosPorUsuario(email);

        assertEquals(2, resultado.size());
        verify(avistamientoRepository).findByEmailUsuario(email);
    }

    @Test
    void obtenerAvistamientosPorReporte_deberiaRetornarListaDeAvistamientos() {
        Long idReporte = 1L;
        List<Avistamiento> listaMock = Arrays.asList(new Avistamiento());

        when(avistamientoRepository.findByPersonaDesaparecida_IdDesaparecido(idReporte)).thenReturn(listaMock);

        List<Avistamiento> resultado = avistamientoService.obtenerAvistamientosPorReporte(idReporte);

        assertEquals(1, resultado.size());
        verify(avistamientoRepository).findByPersonaDesaparecida_IdDesaparecido(idReporte);
    }

    @Test
    void obtenerTodosLosAvistamientos_deberiaRetornarTodos() {
        List<Avistamiento> listaMock = Arrays.asList(new Avistamiento(), new Avistamiento(), new Avistamiento());

        when(avistamientoRepository.findAll()).thenReturn(listaMock);

        List<Avistamiento> resultado = avistamientoService.obtenerTodosLosAvistamientos();

        assertEquals(3, resultado.size());
        verify(avistamientoRepository).findAll();
    }
}
