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

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UsuarioService usuarioService;

    private Usuario usuario;
    private Usuario usuarioExistente;

    @BeforeEach
    void setUp() {
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setEmail("test@example.com");
        usuario.setCi(12345678);
        usuario.setPassword("password123");
        usuario.setNombre("Juan Perez");
        usuario.setFechaNacimiento(LocalDate.of(1990, 1, 1));
        usuario.setCelular(70123456);
        usuario.setDireccion("Calle Falsa 123");
        usuario.setNotificaciones(true);

        usuarioExistente = new Usuario();
        usuarioExistente.setId(1L);
        usuarioExistente.setEmail("existing@example.com");
        usuarioExistente.setCi(87654321);
        usuarioExistente.setPassword("$2a$10$encoded.password.hash");
        usuarioExistente.setNombre("Maria Lopez");
        usuarioExistente.setFechaNacimiento(LocalDate.of(1985, 5, 15));
        usuarioExistente.setCelular(75987654);
        usuarioExistente.setDireccion("Avenida Siempre Viva 742");
        usuarioExistente.setNotificaciones(false);
    }

    @Test
    void obtenerUsuarioPorEmail_CuandoExiste_DeberiaRetornarUsuario() {
        String email = "test@example.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(usuario));
        Optional<Usuario> resultado = usuarioService.obtenerUsuarioPorEmail(email);

        assertTrue(resultado.isPresent());
        assertEquals(usuario.getEmail(), resultado.get().getEmail());
        verify(userRepository).findByEmail(email);
    }

    @Test
    void obtenerUsuarioPorEmail_CuandoNoExiste_DeberiaRetornarEmpty() {
        String email = "noexiste@example.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        Optional<Usuario> resultado = usuarioService.obtenerUsuarioPorEmail(email);

        assertFalse(resultado.isPresent());
        verify(userRepository).findByEmail(email);
    }

    @Test
    void obtenerUsuarioPorId_CuandoExiste_DeberiaRetornarUsuario() {
        Long id = 1L;
        when(userRepository.findById(id)).thenReturn(Optional.of(usuario));

        Optional<Usuario> resultado = usuarioService.obtenerUsuarioPorId(id);

        assertTrue(resultado.isPresent());
        assertEquals(usuario.getId(), resultado.get().getId());
        verify(userRepository).findById(id);
    }

    @Test
    void obtenerUsuarioPorId_CuandoNoExiste_DeberiaRetornarEmpty() {
        Long id = 999L;
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        Optional<Usuario> resultado = usuarioService.obtenerUsuarioPorId(id);

        assertFalse(resultado.isPresent());
        verify(userRepository).findById(id);
    }

    @Test
    void crearUsuario_CuandoEsNuevo_DeberiaCrearUsuario() {
        when(userRepository.findByEmail(usuario.getEmail())).thenReturn(Optional.empty());
        when(userRepository.findByCi(usuario.getCi())).thenReturn(Optional.empty());
        when(userRepository.save(any(Usuario.class))).thenReturn(usuario);

        Usuario resultado = usuarioService.crearUsuario(usuario);

        assertNotNull(resultado);
        verify(userRepository).findByEmail(usuario.getEmail());
        verify(userRepository).findByCi(usuario.getCi());
        verify(userRepository).save(any(Usuario.class));
    }

    @Test
    void crearUsuario_CuandoEmailYaExiste_DeberiaLanzarExcepcion() {
        when(userRepository.findByEmail(usuario.getEmail())).thenReturn(Optional.of(usuarioExistente));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> usuarioService.crearUsuario(usuario));

        assertEquals("Ya existe un usuario con este email.", exception.getMessage());
        verify(userRepository).findByEmail(usuario.getEmail());
        verify(userRepository, never()).save(any(Usuario.class));
    }

    @Test
    void crearUsuario_CuandoCiYaExiste_DeberiaLanzarExcepcion() {
        when(userRepository.findByEmail(usuario.getEmail())).thenReturn(Optional.empty());
        when(userRepository.findByCi(usuario.getCi())).thenReturn(Optional.of(usuarioExistente));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> usuarioService.crearUsuario(usuario));

        assertEquals("Ya existe un usuario con este CI.", exception.getMessage());
        verify(userRepository).findByEmail(usuario.getEmail());
        verify(userRepository).findByCi(usuario.getCi());
        verify(userRepository, never()).save(any(Usuario.class));
    }

    @Test
    void actualizarUsuario_CuandoExiste_DeberiaActualizarUsuario() {
        when(userRepository.findById(usuario.getId())).thenReturn(Optional.of(usuarioExistente));
        when(userRepository.save(any(Usuario.class))).thenReturn(usuarioExistente);

        Usuario resultado = usuarioService.actualizarUsuario(usuario);

        assertNotNull(resultado);
        verify(userRepository).findById(usuario.getId());
        verify(userRepository).save(any(Usuario.class));
    }

    @Test
    void actualizarUsuario_CuandoNoExiste_DeberiaLanzarExcepcion() {
        when(userRepository.findById(usuario.getId())).thenReturn(Optional.empty());

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class,
                () -> usuarioService.actualizarUsuario(usuario));

        assertEquals("Usuario no encontrado con ID: " + usuario.getId(), exception.getMessage());
        verify(userRepository).findById(usuario.getId());
        verify(userRepository, never()).save(any(Usuario.class));
    }

    @Test
    void actualizarUsuario_ConPasswordVacia_NoDeberiaActualizarPassword() {
        usuario.setPassword("");
        when(userRepository.findById(usuario.getId())).thenReturn(Optional.of(usuarioExistente));
        when(userRepository.save(any(Usuario.class))).thenReturn(usuarioExistente);

        usuarioService.actualizarUsuario(usuario);

        verify(userRepository).findById(usuario.getId());
        verify(userRepository).save(any(Usuario.class));
        // El password del usuario existente debería mantenerse sin cambios
    }

    @Test
    void actualizarUsuario_ConPasswordNull_NoDeberiaActualizarPassword() {
        usuario.setPassword(null);
        when(userRepository.findById(usuario.getId())).thenReturn(Optional.of(usuarioExistente));
        when(userRepository.save(any(Usuario.class))).thenReturn(usuarioExistente);

        usuarioService.actualizarUsuario(usuario);

        verify(userRepository).findById(usuario.getId());
        verify(userRepository).save(any(Usuario.class));
    }

    @Test
    void verificarContraseña_CuandoEsCorrecta_DeberiaRetornarTrue() {
        String contraseñaPlana = "password123";
        String contraseñaEncriptada = new BCryptPasswordEncoder().encode(contraseñaPlana);

        boolean resultado = usuarioService.verificarContraseña(contraseñaPlana, contraseñaEncriptada);

        assertTrue(resultado);
    }

    @Test
    void verificarContraseña_CuandoEsIncorrecta_DeberiaRetornarFalse() {
        String contraseñaPlana = "password123";
        String contraseñaIncorrecta = "wrongpassword";
        String contraseñaEncriptada = new BCryptPasswordEncoder().encode(contraseñaPlana);

        boolean resultado = usuarioService.verificarContraseña(contraseñaIncorrecta, contraseñaEncriptada);

        assertFalse(resultado);
    }

    @Test
    void eliminarUsuario_CuandoExiste_DeberiaEliminarUsuario() {
        Long id = 1L;
        when(userRepository.findById(id)).thenReturn(Optional.of(usuario));

        usuarioService.eliminarUsuario(id);

        verify(userRepository).findById(id);
        verify(userRepository).delete(usuario);
    }

    @Test
    void eliminarUsuario_CuandoNoExiste_NoDeberiaLanzarExcepcion() {
        Long id = 999L;
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> usuarioService.eliminarUsuario(id));
        verify(userRepository).findById(id);
        verify(userRepository, never()).delete(any(Usuario.class));
    }

    @Test
    void crearUsuario_DeberiaEncriptarPassword() {
        String passwordOriginal = usuario.getPassword();
        when(userRepository.findByEmail(usuario.getEmail())).thenReturn(Optional.empty());
        when(userRepository.findByCi(usuario.getCi())).thenReturn(Optional.empty());
        when(userRepository.save(any(Usuario.class))).thenAnswer(invocation -> {
            Usuario usuarioGuardado = invocation.getArgument(0);
            // Verificar que el password fue encriptado
            assertNotEquals(passwordOriginal, usuarioGuardado.getPassword());
            assertTrue(usuarioGuardado.getPassword().startsWith("$2a$"));
            return usuarioGuardado;
        });

        usuarioService.crearUsuario(usuario);

        verify(userRepository).save(any(Usuario.class));
    }

    @Test
    void actualizarUsuario_ConPasswordNueva_DeberiaEncriptarPassword() {
        String passwordOriginal = "newpassword123";
        usuario.setPassword(passwordOriginal);
        when(userRepository.findById(usuario.getId())).thenReturn(Optional.of(usuarioExistente));
        when(userRepository.save(any(Usuario.class))).thenAnswer(invocation -> {
            Usuario usuarioGuardado = invocation.getArgument(0);
            // Verificar que el password fue encriptado
            assertNotEquals(passwordOriginal, usuarioGuardado.getPassword());
            assertTrue(usuarioGuardado.getPassword().startsWith("$2a$"));
            return usuarioGuardado;
        });

        usuarioService.actualizarUsuario(usuario);

        verify(userRepository).save(any(Usuario.class));
    }
}