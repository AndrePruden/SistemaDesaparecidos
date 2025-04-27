package com.trackme.controller;

import com.trackme.model.Usuario;
import com.trackme.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserControllerTest {

    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testRegistrarUsuarioCorreoExistente() {
        Usuario usuario = new Usuario("newuser", "password123", "existing@domain.com");
        when(usuarioService.obtenerUsuarioPorEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));

        ResponseEntity<ResponseMessage> response = userController.registrarUsuario(usuario);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("El correo ya está registrado.", response.getBody().getMessage());
    }

    @Test
    void testRegistrarUsuarioExitoso() {
        Usuario usuario = new Usuario("newuser", "password123", "new@domain.com");
        when(usuarioService.obtenerUsuarioPorEmail(usuario.getEmail())).thenReturn(Optional.empty());

        ResponseEntity<ResponseMessage> response = userController.registrarUsuario(usuario);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Usuario registrado con éxito.", response.getBody().getMessage());
    }

    @Test
    void testIniciarSesionExitoso() {
        Usuario usuario = new Usuario("validuser", "validpassword", "valid@domain.com");
        when(usuarioService.obtenerUsuarioPorEmail(usuario.getEmail()))
                .thenReturn(Optional.of(usuario));
        when(usuarioService.verificarContraseña("validpassword", "validpassword"))
                .thenReturn(true);
        ResponseEntity<ResponseMessage> response = userController.iniciarSesion(usuario);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Inicio de sesión exitoso.", response.getBody().getMessage());
    }


    @Test
    void testIniciarSesionFallidoCorreoNoRegistrado() {
        Usuario usuario = new Usuario("anyuser", "anyPassword", "nonexistent@domain.com");
        when(usuarioService.obtenerUsuarioPorEmail(usuario.getEmail())).thenReturn(Optional.empty());

        ResponseEntity<ResponseMessage> response = userController.iniciarSesion(usuario);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("El correo electrónico no está registrado.", response.getBody().getMessage());
    }

    @Test
    void testIniciarSesionFallidoContraseñaIncorrecta() {
        Usuario usuario = new Usuario("validuser", "wrongpassword", "valid@domain.com");
        Usuario usuarioExistente = new Usuario("validuser", "validpassword", "valid@domain.com");

        when(usuarioService.obtenerUsuarioPorEmail(usuario.getEmail())).thenReturn(Optional.of(usuarioExistente));

        ResponseEntity<ResponseMessage> response = userController.iniciarSesion(usuario);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Contraseña incorrecta.", response.getBody().getMessage());
    }

    @Test
    void testEliminarUsuarioExitoso() {
        Long id = 1L;
        Usuario usuario = new Usuario("testuser", "password123", "test@domain.com");
        usuario.setId(id);
        when(usuarioService.obtenerUsuarioPorId(id)).thenReturn(Optional.of(usuario));

        ResponseEntity<Void> response = userController.eliminarUsuario(id);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    }

    @Test
    void testEliminarUsuarioNoEncontrado() {
        Long id = 1L;
        when(usuarioService.obtenerUsuarioPorId(id)).thenReturn(Optional.empty());

        ResponseEntity<Void> response = userController.eliminarUsuario(id);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void testActualizarUsuarioExitoso() {
        Long id = 1L;
        Usuario usuarioExistente = new Usuario("testuser", "password123", "test@domain.com");
        usuarioExistente.setId(id);
        Usuario usuarioActualizado = new Usuario("updateduser", "newpassword", "newemail@domain.com");
        usuarioActualizado.setId(id);

        when(usuarioService.obtenerUsuarioPorId(id)).thenReturn(Optional.of(usuarioExistente));
        when(usuarioService.actualizarUsuario(usuarioActualizado)).thenReturn(usuarioActualizado);

        ResponseEntity<Usuario> response = userController.actualizarUsuario(id, usuarioActualizado);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("updateduser", response.getBody().getNombre());
    }

    @Test
    void testActualizarUsuarioNoEncontrado() {
        Long id = 1L;
        Usuario usuarioActualizado = new Usuario("updateduser", "newpassword", "newemail@domain.com");

        when(usuarioService.obtenerUsuarioPorId(id)).thenReturn(Optional.empty());

        ResponseEntity<Usuario> response = userController.actualizarUsuario(id, usuarioActualizado);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}
