package com.trackme.controller;

import com.trackme.model.Usuario;
import com.trackme.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private UserController userController;

    private Usuario usuario;

    @BeforeEach
    void setUp() {
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setEmail("test@example.com");
        usuario.setNombre("Test User");
        usuario.setPassword("password123");
    }

    @Test
    void testObtenerUsuarioPorId_UsuarioExistente() {
        when(usuarioService.obtenerPorId(1L)).thenReturn(Optional.of(usuario));
        ResponseEntity<Usuario> response = userController.obtenerUsuarioPorId(1L);
        assertEquals(200, response.getStatusCodeValue());
        assertEquals(usuario, response.getBody());
    }

    @Test
    void testObtenerUsuarioPorId_UsuarioNoExistente() {
        when(usuarioService.obtenerPorId(1L)).thenReturn(Optional.empty());
        ResponseEntity<Usuario> response = userController.obtenerUsuarioPorId(1L);
        assertEquals(404, response.getStatusCodeValue());
    }

    @Test
    void testRegistrarUsuario_Exitoso() {
        when(usuarioService.obtenerPorEmail(usuario.getEmail())).thenReturn(Optional.empty());
        ResponseEntity<String> response = userController.registrarUsuario(usuario);
        assertEquals(200, response.getStatusCodeValue());
        assertEquals("Usuario registrado con éxito.", response.getBody());
    }

    @Test
    void testRegistrarUsuario_EmailExistente() {
        when(usuarioService.obtenerPorEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));
        ResponseEntity<String> response = userController.registrarUsuario(usuario);
        assertEquals(400, response.getStatusCodeValue());
        assertEquals("El correo ya está registrado.", response.getBody());
    }

    @Test
    void testActualizarUsuario_Exitoso() {
        when(usuarioService.obtenerPorId(1L)).thenReturn(Optional.of(usuario));
        ResponseEntity<Usuario> response = userController.actualizarUsuario(1L, usuario);
        assertEquals(200, response.getStatusCodeValue());
        assertEquals(usuario, response.getBody());
    }

    @Test
    void testActualizarUsuario_NoExistente() {
        when(usuarioService.obtenerPorId(1L)).thenReturn(Optional.empty());
        ResponseEntity<Usuario> response = userController.actualizarUsuario(1L, usuario);
        assertEquals(404, response.getStatusCodeValue());
    }

    @Test
    void testEliminarUsuario_Exitoso() {
        when(usuarioService.obtenerPorId(1L)).thenReturn(Optional.of(usuario));
        ResponseEntity<Void> response = userController.eliminarUsuario(1L);
        assertEquals(204, response.getStatusCodeValue());
    }

    @Test
    void testEliminarUsuario_NoExistente() {
        when(usuarioService.obtenerPorId(1L)).thenReturn(Optional.empty());
        ResponseEntity<Void> response = userController.eliminarUsuario(1L);
        assertEquals(404, response.getStatusCodeValue());
    }

    @Test
    void testIniciarSesion_Exitoso() {
        when(usuarioService.obtenerPorEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));
        ResponseEntity<Boolean> response = userController.iniciarSesion(usuario);
        assertTrue(response.getBody());
    }

    @Test
    void testIniciarSesion_Fallido() {
        when(usuarioService.obtenerPorEmail(usuario.getEmail())).thenReturn(Optional.empty());
        ResponseEntity<Boolean> response = userController.iniciarSesion(usuario);
        assertFalse(response.getBody());
    }
}
