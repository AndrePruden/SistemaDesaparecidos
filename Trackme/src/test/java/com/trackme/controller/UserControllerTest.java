package com.trackme.controller;

import com.trackme.model.Usuario;
import com.trackme.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
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
        usuario.setNombre("Juan Perez");
        usuario.setEmail("juan@example.com");
        usuario.setPassword("password123");
    }

    @Test
    void registrarUsuario_Exitoso() {
        when(usuarioService.obtenerUsuarioPorEmail(anyString())).thenReturn(Optional.empty());
        when(usuarioService.crearUsuario(any(Usuario.class))).thenReturn(usuario);

        ResponseEntity<?> response = userController.registrarUsuario(usuario);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(usuario, response.getBody());
        verify(usuarioService, times(1)).crearUsuario(usuario);
    }

    @Test
    void registrarUsuario_EmailExistente() {
        when(usuarioService.obtenerUsuarioPorEmail(anyString())).thenReturn(Optional.of(usuario));

        ResponseEntity<?> response = userController.registrarUsuario(usuario);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("El correo ya está registrado.", ((ResponseMessage) response.getBody()).getMessage());
    }

    @Test
    void iniciarSesion_Exitoso() {
        when(usuarioService.obtenerUsuarioPorEmail(anyString())).thenReturn(Optional.of(usuario));
        when(usuarioService.verificarContraseña(anyString(), anyString())).thenReturn(true);

        ResponseEntity<?> response = userController.iniciarSesion(usuario);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Inicio de sesión exitoso.", ((ResponseMessage) response.getBody()).getMessage());
    }

    @Test
    void iniciarSesion_EmailNoRegistrado() {
        when(usuarioService.obtenerUsuarioPorEmail(anyString())).thenReturn(Optional.empty());

        ResponseEntity<?> response = userController.iniciarSesion(usuario);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("El correo electrónico no está registrado.", ((ResponseMessage) response.getBody()).getMessage());
    }

    @Test
    void iniciarSesion_ContraseñaIncorrecta() {
        when(usuarioService.obtenerUsuarioPorEmail(anyString())).thenReturn(Optional.of(usuario));
        when(usuarioService.verificarContraseña(anyString(), anyString())).thenReturn(false);

        ResponseEntity<?> response = userController.iniciarSesion(usuario);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Contraseña incorrecta.", ((ResponseMessage) response.getBody()).getMessage());
    }

    @Test
    void obtenerUsuarioPorEmail_Exitoso() {
        when(usuarioService.obtenerUsuarioPorEmail(anyString())).thenReturn(Optional.of(usuario));

        ResponseEntity<?> response = userController.obtenerUsuarioPorEmail("juan@example.com");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(usuario, response.getBody());
    }

    @Test
    void obtenerUsuarioPorEmail_NoEncontrado() {
        when(usuarioService.obtenerUsuarioPorEmail(anyString())).thenReturn(Optional.empty());

        ResponseEntity<?> response = userController.obtenerUsuarioPorEmail("noexiste@example.com");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Usuario no encontrado.", ((ResponseMessage) response.getBody()).getMessage());
    }

    @Test
    void actualizarUsuario_Exitoso() {
        when(usuarioService.obtenerUsuarioPorId(anyLong())).thenReturn(Optional.of(usuario));
        when(usuarioService.actualizarUsuario(any(Usuario.class))).thenReturn(usuario);

        ResponseEntity<?> response = userController.actualizarUsuario(1L, usuario);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(usuario, response.getBody());
    }

    @Test
    void actualizarUsuario_NoEncontrado() {
        when(usuarioService.obtenerUsuarioPorId(anyLong())).thenReturn(Optional.empty());

        ResponseEntity<?> response = userController.actualizarUsuario(99L, usuario);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Usuario no encontrado.", ((ResponseMessage) response.getBody()).getMessage());
    }

    @Test
    void eliminarUsuario_Exitoso() {
        when(usuarioService.obtenerUsuarioPorId(anyLong())).thenReturn(Optional.of(usuario));
        doNothing().when(usuarioService).eliminarUsuario(anyLong());

        ResponseEntity<?> response = userController.eliminarUsuario(1L);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(usuarioService, times(1)).eliminarUsuario(1L);
    }

    @Test
    void eliminarUsuario_NoEncontrado() {
        when(usuarioService.obtenerUsuarioPorId(anyLong())).thenReturn(Optional.empty());

        ResponseEntity<?> response = userController.eliminarUsuario(99L);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Usuario no encontrado.", ((ResponseMessage) response.getBody()).getMessage());
    }
}