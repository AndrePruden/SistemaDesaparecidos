package com.trackme.service;

import com.trackme.model.Usuario;
import com.trackme.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @InjectMocks
    private UsuarioService usuarioService;

    private Usuario usuario;

    @BeforeEach
    void setUp() {
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNombre("Juan Perez");
        usuario.setEmail("juan@example.com");
        usuario.setPassword("password123");
        usuario.setCi(123);
    }

    @Test
    void obtenerUsuarioPorEmail_Exitoso() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(usuario));

        Optional<Usuario> resultado = usuarioService.obtenerUsuarioPorEmail("juan@example.com");

        assertTrue(resultado.isPresent());
        assertEquals(usuario.getEmail(), resultado.get().getEmail());
        verify(userRepository, times(1)).findByEmail(anyString());
    }

    @Test
    void obtenerUsuarioPorEmail_NoEncontrado() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        Optional<Usuario> resultado = usuarioService.obtenerUsuarioPorEmail("noexiste@example.com");

        assertFalse(resultado.isPresent());
    }

    @Test
    void obtenerUsuarioPorId_Exitoso() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(usuario));

        Optional<Usuario> resultado = usuarioService.obtenerUsuarioPorId(1L);

        assertTrue(resultado.isPresent());
        assertEquals(usuario.getId(), resultado.get().getId());
    }


    @Test
    void crearUsuario_EmailExistente() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(usuario));

        assertThrows(IllegalArgumentException.class, () -> {
            usuarioService.crearUsuario(usuario);
        });
    }

    @Test
    void crearUsuario_CIExistente() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(userRepository.findByCi(anyInt())).thenReturn(Optional.of(usuario));

        assertThrows(IllegalArgumentException.class, () -> {
            usuarioService.crearUsuario(usuario);
        });
    }


    @Test
    void actualizarUsuario_NoEncontrado() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> {
            usuarioService.actualizarUsuario(usuario);
        });
    }


    @Test
    void eliminarUsuario_Exitoso() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(usuario));
        doNothing().when(userRepository).delete(any(Usuario.class));

        usuarioService.eliminarUsuario(1L);

        verify(userRepository, times(1)).delete(any(Usuario.class));
    }

    @Test
    void eliminarUsuario_NoEncontrado() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        usuarioService.eliminarUsuario(99L);

        verify(userRepository, never()).delete(any(Usuario.class));
    }
}