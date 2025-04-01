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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private UserController userController;

    @Test
    void testRegistrarUsuarioCorreoExistente() {
        // Arrange
        Usuario usuario = new Usuario();
        usuario.setEmail("existing@domain.com");
        when(usuarioService.obtenerUsuarioPorEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));

        // Act
        ResponseEntity<ResponseMessage> response = userController.registrarUsuario(usuario);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("El correo ya está registrado.", response.getBody().getMessage());
    }

    @Test
    void testRegistrarUsuarioExitoso() {
        // Arrange
        Usuario usuario = new Usuario();
        usuario.setEmail("new@domain.com");
        
        when(usuarioService.obtenerUsuarioPorEmail(usuario.getEmail()))
            .thenReturn(Optional.empty());
        
        // Cambio clave: Si crearUsuario devuelve el usuario creado
        when(usuarioService.crearUsuario(any(Usuario.class)))
            .thenReturn(usuario); // Asume que crearUsuario devuelve el usuario
    
        // Act
        ResponseEntity<ResponseMessage> response = userController.registrarUsuario(usuario);
    
        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        ResponseMessage body = response.getBody();
        assertNotNull(body);
        assertEquals("Usuario registrado con éxito.", body.getMessage());
        
        verify(usuarioService, times(1)).crearUsuario(any(Usuario.class));
    }
    
    @Test
    void testIniciarSesionExitoso() {
        Usuario usuario = new Usuario();
        usuario.setEmail("valid@domain.com");
        usuario.setPassword("validpass");
        
        Usuario usuarioExistente = new Usuario();
        usuarioExistente.setPassword("validpass");
        
        when(usuarioService.obtenerUsuarioPorEmail(anyString())).thenReturn(Optional.of(usuarioExistente));
        when(usuarioService.verificarContraseña(anyString(), anyString())).thenReturn(true);

        ResponseEntity<ResponseMessage> response = userController.iniciarSesion(usuario);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        ResponseMessage body = response.getBody();
        assertNotNull(body); // Verificación explícita
        assertEquals("Inicio de sesión exitoso.", body.getMessage());
    }

    @Test
    void testIniciarSesionFallidoCorreoNoRegistrado() {
        // Arrange
        Usuario usuario = new Usuario();
        usuario.setEmail("nonexistent@domain.com");
        when(usuarioService.obtenerUsuarioPorEmail(usuario.getEmail())).thenReturn(Optional.empty());

        // Act
        ResponseEntity<ResponseMessage> response = userController.iniciarSesion(usuario);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("El correo electrónico no está registrado.", response.getBody().getMessage());
    }

    @Test
    void testIniciarSesionFallidoContraseñaIncorrecta() {
        // Arrange
        Usuario usuario = new Usuario();
        usuario.setEmail("valid@domain.com");
        usuario.setPassword("wrongpassword");
        Usuario usuarioExistente = new Usuario();
        usuarioExistente.setPassword("correctpassword");
        
        when(usuarioService.obtenerUsuarioPorEmail(usuario.getEmail()))
            .thenReturn(Optional.of(usuarioExistente));
        when(usuarioService.verificarContraseña(usuario.getPassword(), usuarioExistente.getPassword()))
            .thenReturn(false);

        // Act
        ResponseEntity<ResponseMessage> response = userController.iniciarSesion(usuario);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Contraseña incorrecta.", response.getBody().getMessage());
    }

    @Test
    void testEliminarUsuarioExitoso() {
        // Arrange
        Long id = 1L;
        when(usuarioService.obtenerUsuarioPorId(id)).thenReturn(Optional.of(new Usuario()));
        doNothing().when(usuarioService).eliminarUsuario(id);

        // Act
        ResponseEntity<Void> response = userController.eliminarUsuario(id);

        // Assert
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(usuarioService, times(1)).eliminarUsuario(id);
    }

    @Test
    void testEliminarUsuarioNoEncontrado() {
        // Arrange
        Long id = 1L;
        when(usuarioService.obtenerUsuarioPorId(id)).thenReturn(Optional.empty());

        // Act
        ResponseEntity<Void> response = userController.eliminarUsuario(id);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        verify(usuarioService, never()).eliminarUsuario(id);
    }

    @Test
    void testActualizarUsuarioExitoso() {
        // Arrange
        Long id = 1L;
        Usuario usuarioActualizado = new Usuario();
        usuarioActualizado.setId(id);
        when(usuarioService.obtenerUsuarioPorId(id)).thenReturn(Optional.of(new Usuario()));
        when(usuarioService.actualizarUsuario(any(Usuario.class))).thenReturn(usuarioActualizado);

        // Act
        ResponseEntity<Usuario> response = userController.actualizarUsuario(id, usuarioActualizado);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(id, response.getBody().getId());
    }

    @Test
    void testActualizarUsuarioNoEncontrado() {
        // Arrange
        Long id = 1L;
        Usuario usuarioActualizado = new Usuario();
        usuarioActualizado.setId(id);
        when(usuarioService.obtenerUsuarioPorId(id)).thenReturn(Optional.empty());

        // Act
        ResponseEntity<Usuario> response = userController.actualizarUsuario(id, usuarioActualizado);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}