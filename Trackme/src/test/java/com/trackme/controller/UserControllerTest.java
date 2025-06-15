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
        usuario.setEmail("test@email.com");
        usuario.setPassword("password123");
        usuario.setNombre("Test User");
    }

    @Test
    void registrarUsuario_Success() {
        when(usuarioService.obtenerUsuarioPorEmail("test@email.com")).thenReturn(Optional.empty());
        when(usuarioService.crearUsuario(any(Usuario.class))).thenReturn(usuario);

        ResponseEntity<?> response = userController.registrarUsuario(usuario);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(usuario, response.getBody());
        verify(usuarioService, times(1)).obtenerUsuarioPorEmail("test@email.com");
        verify(usuarioService, times(1)).crearUsuario(any(Usuario.class));
    }

    @Test
    void registrarUsuario_EmailYaRegistrado_BadRequest() {
        when(usuarioService.obtenerUsuarioPorEmail("test@email.com")).thenReturn(Optional.of(usuario));

        ResponseEntity<?> response = userController.registrarUsuario(usuario);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        ResponseMessage responseMessage = (ResponseMessage) response.getBody();
        assertEquals("El correo ya está registrado.", responseMessage.getMessage());
        verify(usuarioService, times(1)).obtenerUsuarioPorEmail("test@email.com");
        verify(usuarioService, never()).crearUsuario(any(Usuario.class));
    }

    @Test
    void registrarUsuario_ValidationError_BadRequest() {
        when(usuarioService.obtenerUsuarioPorEmail("test@email.com")).thenReturn(Optional.empty());
        when(usuarioService.crearUsuario(any(Usuario.class)))
                .thenThrow(new IllegalArgumentException("Datos inválidos"));

        ResponseEntity<?> response = userController.registrarUsuario(usuario);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        ResponseMessage responseMessage = (ResponseMessage) response.getBody();
        assertEquals("Datos inválidos", responseMessage.getMessage());
    }

    @Test
    void registrarUsuario_InternalError_InternalServerError() {
        when(usuarioService.obtenerUsuarioPorEmail("test@email.com")).thenReturn(Optional.empty());
        when(usuarioService.crearUsuario(any(Usuario.class)))
                .thenThrow(new RuntimeException("Error interno"));

        ResponseEntity<?> response = userController.registrarUsuario(usuario);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        ResponseMessage responseMessage = (ResponseMessage) response.getBody();
        assertEquals("Error interno al registrar usuario.", responseMessage.getMessage());
    }

    @Test
    void iniciarSesion_Success() {
        Usuario usuarioLogin = new Usuario();
        usuarioLogin.setEmail("test@email.com");
        usuarioLogin.setPassword("password123");

        when(usuarioService.obtenerUsuarioPorEmail("test@email.com")).thenReturn(Optional.of(usuario));
        when(usuarioService.verificarContraseña("password123", "password123")).thenReturn(true);

        ResponseEntity<?> response = userController.iniciarSesion(usuarioLogin);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        ResponseMessage responseMessage = (ResponseMessage) response.getBody();
        assertEquals("Inicio de sesión exitoso.", responseMessage.getMessage());
        verify(usuarioService, times(1)).obtenerUsuarioPorEmail("test@email.com");
        verify(usuarioService, times(1)).verificarContraseña("password123", "password123");
    }

    @Test
    void iniciarSesion_EmailNoRegistrado_NotFound() {
        Usuario usuarioLogin = new Usuario();
        usuarioLogin.setEmail("noexiste@email.com");
        usuarioLogin.setPassword("password123");

        when(usuarioService.obtenerUsuarioPorEmail("noexiste@email.com")).thenReturn(Optional.empty());

        ResponseEntity<?> response = userController.iniciarSesion(usuarioLogin);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        ResponseMessage responseMessage = (ResponseMessage) response.getBody();
        assertEquals("El correo electrónico no está registrado.", responseMessage.getMessage());
        verify(usuarioService, times(1)).obtenerUsuarioPorEmail("noexiste@email.com");
        verify(usuarioService, never()).verificarContraseña(anyString(), anyString());
    }

    @Test
    void iniciarSesion_ContraseñaIncorrecta_Unauthorized() {
        Usuario usuarioLogin = new Usuario();
        usuarioLogin.setEmail("test@email.com");
        usuarioLogin.setPassword("passwordIncorrecto");

        when(usuarioService.obtenerUsuarioPorEmail("test@email.com")).thenReturn(Optional.of(usuario));
        when(usuarioService.verificarContraseña("passwordIncorrecto", "password123")).thenReturn(false);

        ResponseEntity<?> response = userController.iniciarSesion(usuarioLogin);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        ResponseMessage responseMessage = (ResponseMessage) response.getBody();
        assertEquals("Contraseña incorrecta.", responseMessage.getMessage());
        verify(usuarioService, times(1)).verificarContraseña("passwordIncorrecto", "password123");
    }

    @Test
    void obtenerUsuarioPorEmail_Success() {
        when(usuarioService.obtenerUsuarioPorEmail("test@email.com")).thenReturn(Optional.of(usuario));

        ResponseEntity<?> response = userController.obtenerUsuarioPorEmail("test@email.com");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(usuario, response.getBody());
        verify(usuarioService, times(1)).obtenerUsuarioPorEmail("test@email.com");
    }

    @Test
    void obtenerUsuarioPorEmail_UsuarioNoEncontrado_NotFound() {
        when(usuarioService.obtenerUsuarioPorEmail("noexiste@email.com")).thenReturn(Optional.empty());

        ResponseEntity<?> response = userController.obtenerUsuarioPorEmail("noexiste@email.com");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        ResponseMessage responseMessage = (ResponseMessage) response.getBody();
        assertEquals("Usuario no encontrado.", responseMessage.getMessage());
    }

    @Test
    void actualizarUsuario_Success() {
        Usuario usuarioActualizado = new Usuario();
        usuarioActualizado.setId(1L);
        usuarioActualizado.setEmail("actualizado@email.com");
        usuarioActualizado.setNombre("Usuario Actualizado");

        when(usuarioService.obtenerUsuarioPorId(1L)).thenReturn(Optional.of(usuario));
        when(usuarioService.actualizarUsuario(any(Usuario.class))).thenReturn(usuarioActualizado);

        ResponseEntity<?> response = userController.actualizarUsuario(1L, usuarioActualizado);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(usuarioActualizado, response.getBody());
        verify(usuarioService, times(1)).obtenerUsuarioPorId(1L);
        verify(usuarioService, times(1)).actualizarUsuario(any(Usuario.class));
    }

    @Test
    void actualizarUsuario_UsuarioNoEncontrado_NotFound() {
        when(usuarioService.obtenerUsuarioPorId(1L)).thenReturn(Optional.empty());

        ResponseEntity<?> response = userController.actualizarUsuario(1L, usuario);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        ResponseMessage responseMessage = (ResponseMessage) response.getBody();
        assertEquals("Usuario no encontrado.", responseMessage.getMessage());
        verify(usuarioService, times(1)).obtenerUsuarioPorId(1L);
        verify(usuarioService, never()).actualizarUsuario(any(Usuario.class));
    }

    @Test
    void eliminarUsuario_Success() {
        when(usuarioService.obtenerUsuarioPorId(1L)).thenReturn(Optional.of(usuario));
        doNothing().when(usuarioService).eliminarUsuario(1L);

        ResponseEntity<?> response = userController.eliminarUsuario(1L);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        assertNull(response.getBody());
        verify(usuarioService, times(1)).obtenerUsuarioPorId(1L);
        verify(usuarioService, times(1)).eliminarUsuario(1L);
    }

    @Test
    void eliminarUsuario_UsuarioNoEncontrado_NotFound() {
        when(usuarioService.obtenerUsuarioPorId(1L)).thenReturn(Optional.empty());

        ResponseEntity<?> response = userController.eliminarUsuario(1L);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        ResponseMessage responseMessage = (ResponseMessage) response.getBody();
        assertEquals("Usuario no encontrado.", responseMessage.getMessage());
        verify(usuarioService, times(1)).obtenerUsuarioPorId(1L);
        verify(usuarioService, never()).eliminarUsuario(1L);
    }
}