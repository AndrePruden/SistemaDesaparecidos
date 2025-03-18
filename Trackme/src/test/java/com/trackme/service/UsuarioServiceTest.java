package com.trackme.service;

import com.trackme.model.Usuario;
import com.trackme.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UsuarioService usuarioService;

    @Test
    void obtenerTodos() {
        usuarioService.obtenerTodos();
        verify(userRepository, times(1)).findAll();
    }

    @ParameterizedTest
    @CsvSource({
            "1, test@example.com, Test User, 123456",
            "2, user@domain.com, Another User, password123"
    })
    void obtenerPorId(Long id, String email, String nombre, String password) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setEmail(email);
        usuario.setNombre(nombre);
        usuario.setPassword(password);

        when(userRepository.findById(id)).thenReturn(Optional.of(usuario));

        Optional<Usuario> resultado = usuarioService.obtenerPorId(id);
        assertTrue(resultado.isPresent());
        assertEquals(email, resultado.get().getEmail());
    }

    @Test
    void guardar() {
        Usuario usuario = new Usuario();
        usuario.setEmail("test@example.com");
        usuario.setNombre("Test User");
        usuario.setPassword("123456");

        when(userRepository.save(usuario)).thenReturn(usuario);
        Usuario result = usuarioService.guardar(usuario);
        assertNotNull(result);
    }

    @Test
    void eliminar() {
        Long id = 1L;
        doNothing().when(userRepository).deleteById(id);
        usuarioService.eliminar(id);
        verify(userRepository, times(1)).deleteById(id);
    }

    @Test
    void obtenerPorEmail_NoEncontrado() {
        when(userRepository.findByEmail("noexist@example.com")).thenReturn(Optional.empty());
        Optional<Usuario> result = usuarioService.obtenerPorEmail("noexist@example.com");
        assertFalse(result.isPresent());
    }
}
