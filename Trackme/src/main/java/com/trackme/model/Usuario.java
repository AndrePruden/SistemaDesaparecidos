package com.trackme.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Email
    @NotBlank
    @Size(max = 255)
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String nombre;

    @NotBlank
    @Size(min = 8, max = 255)
    @Column(nullable = false)
    private String password;

    @NotNull
    @Column(nullable = false, unique = true)
    private Integer ci;

    @NotNull
    @Past
    @Column(name = "fecha_nacimiento", nullable = false)
    private LocalDate fechaNacimiento;

    @NotNull
    @Column(nullable = false)
    private Integer celular;

    @NotBlank
    @Size(max = 50)
    @Column(nullable = false)
    private String direccion;

    @Column(nullable = false)
    private Boolean notificaciones = false;

    public Usuario() { }   // Constructor por defecto requerido por JPA

    @JsonCreator
    public Usuario(
            @JsonProperty("email") String email,
            @JsonProperty("nombre") String nombre,
            @JsonProperty("password") String password,
            @JsonProperty("ci") Integer ci,
            @JsonProperty("fechaNacimiento") LocalDate fechaNacimiento,
            @JsonProperty("celular") Integer celular,
            @JsonProperty("direccion") String direccion,
            @JsonProperty("notificaciones") Boolean notificaciones
    ) {
        this.email = email;
        this.nombre = nombre;
        this.password = password;
        this.ci = ci;
        this.fechaNacimiento = fechaNacimiento;
        this.celular = celular;
        this.direccion = direccion;
        this.notificaciones = notificaciones;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Integer getCi() { return ci; }
    public void setCi(Integer ci) { this.ci = ci; }

    public LocalDate getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(LocalDate fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }

    public Integer getCelular() { return celular; }
    public void setCelular(Integer celular) { this.celular = celular; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public Boolean getNotificaciones() { return notificaciones; }
    public void setNotificaciones(Boolean notificaciones) { this.notificaciones = notificaciones; }
}