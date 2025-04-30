package com.trackme.controller;

import com.trackme.model.Avistamiento;
import com.trackme.model.PersonaDesaparecida;
import com.trackme.service.AvistamientoService;
import com.trackme.service.FeatureToggleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.http.ResponseEntity;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AvistamientoControllerTest {

    @InjectMocks
    private AvistamientoController controller;

    @Mock
    private AvistamientoService avistamientoService;

    @Mock
    private FeatureToggleService featureToggleService;

    private AutoCloseable closeable;

    @BeforeEach
    void setup() {
        closeable = MockitoAnnotations.openMocks(this);
        when(featureToggleService.isCreateSightingsEnabled()).thenReturn(true);
    }

    @Test
    void crearAvistamiento_DeberiaRetornar400_SiEmailEsNull() {
        Avistamiento avistamiento = new Avistamiento();
        PersonaDesaparecida persona = new PersonaDesaparecida();
        persona.setIdDesaparecido(1L);
        avistamiento.setPersonaDesaparecida(persona);

        ResponseEntity<Avistamiento> response = controller.crearAvistamiento(avistamiento);

        assertEquals(400, response.getStatusCodeValue());
        verify(avistamientoService, never()).crearAvistamiento(any());
    }

    @Test
    void crearAvistamiento_DeberiaRetornar400_SiPersonaDesaparecidaEsNull() {
        Avistamiento avistamiento = new Avistamiento();
        avistamiento.setEmailUsuario("test@example.com");

        ResponseEntity<Avistamiento> response = controller.crearAvistamiento(avistamiento);

        assertEquals(400, response.getStatusCodeValue());
        verify(avistamientoService, never()).crearAvistamiento(any());
    }
//Test
    @Test
    void crearAvistamiento_DeberiaRetornar403_SiFeatureToggleDesactivado() {
        when(featureToggleService.isCreateSightingsEnabled()).thenReturn(false);

        Avistamiento avistamiento = new Avistamiento();
        avistamiento.setEmailUsuario("test@example.com");

        PersonaDesaparecida persona = new PersonaDesaparecida();
        persona.setIdDesaparecido(1L);
        avistamiento.setPersonaDesaparecida(persona);

        ResponseEntity<Avistamiento> response = controller.crearAvistamiento(avistamiento);

        assertEquals(403, response.getStatusCodeValue());
        verify(avistamientoService, never()).crearAvistamiento(any());
    }

    @Test
    void crearAvistamiento_DeberiaAsignarFechaSiNoExiste() {
        Avistamiento avistamiento = new Avistamiento();
        avistamiento.setEmailUsuario("test@example.com");

        PersonaDesaparecida persona = new PersonaDesaparecida();
        persona.setIdDesaparecido(1L);
        avistamiento.setPersonaDesaparecida(persona);

        when(avistamientoService.crearAvistamiento(any())).thenAnswer(i -> i.getArgument(0));

        ResponseEntity<Avistamiento> response = controller.crearAvistamiento(avistamiento);

        assertEquals(200, response.getStatusCodeValue());
        assertNotNull(response.getBody().getFecha());
        verify(avistamientoService, times(1)).crearAvistamiento(any());
    }

    @Test
    void crearAvistamiento_DeberiaConservarFechaSiYaExiste() {
        Date fecha = new Date();
        Avistamiento avistamiento = new Avistamiento();
        avistamiento.setEmailUsuario("test@example.com");
        avistamiento.setFecha(fecha);

        PersonaDesaparecida persona = new PersonaDesaparecida();
        persona.setIdDesaparecido(1L);
        avistamiento.setPersonaDesaparecida(persona);

        when(avistamientoService.crearAvistamiento(any())).thenAnswer(i -> i.getArgument(0));

        ResponseEntity<Avistamiento> response = controller.crearAvistamiento(avistamiento);

        assertEquals(200, response.getStatusCodeValue());
        assertEquals(fecha, response.getBody().getFecha());
    }

    @Test
    void obtenerAvistamientosPorReporte_DeberiaRetornarListaCorrecta() {
        Long id = 42L;
        List<Avistamiento> lista = List.of(new Avistamiento());
        when(avistamientoService.obtenerAvistamientosPorReporte(id)).thenReturn(lista);

        ResponseEntity<List<Avistamiento>> response = controller.obtenerAvistamientosPorReporte(id);

        assertEquals(200, response.getStatusCodeValue());
        assertEquals(1, response.getBody().size());
    }

    @Test
    void obtenerTodosLosAvistamientos_DeberiaRetornarTodosLosRegistros() {
        List<Avistamiento> lista = new ArrayList<>();
        lista.add(new Avistamiento());
        lista.add(new Avistamiento());
        when(avistamientoService.obtenerTodosLosAvistamientos()).thenReturn(lista);

        ResponseEntity<List<Avistamiento>> response = controller.obtenerTodosLosAvistamientos();

        assertEquals(200, response.getStatusCodeValue());
        assertEquals(2, response.getBody().size());
    }
}