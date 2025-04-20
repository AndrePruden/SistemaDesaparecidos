package com.trackme.service;

import com.trackme.model.Usuario;
import com.trackme.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UsuarioServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UsuarioService usuarioService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testObtenerUsuarioPorEmail() {
        String email = "test@domain.com";
        Usuario usuario = new Usuario("testuser", "password123", email);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(usuario));
        Optional<Usuario> result = usuarioService.obtenerUsuarioPorEmail(email);
        assertTrue(result.isPresent());
        assertEquals(email, result.get().getEmail());
    }

    @Test
    void testCrearUsuario() {
        Usuario usuario = new Usuario("newuser", "password123", "new@domain.com");
        usuarioService.crearUsuario(usuario);
        verify(userRepository, times(1)).save(usuario);
    }

    @Test
    void testEliminarUsuario() {
        Long id = 1L;
        Usuario usuario = new Usuario("testuser", "password123", "test@domain.com");
        usuario.setId(id);
        when(userRepository.findById(id)).thenReturn(Optional.of(usuario));
        usuarioService.eliminarUsuario(id);
        verify(userRepository, times(1)).delete(usuario);
    }
}
