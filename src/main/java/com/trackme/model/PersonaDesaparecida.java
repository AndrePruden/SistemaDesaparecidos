package com.trackme.model;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "persona_desaparecida")
public class PersonaDesaparecida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDesaparecido;

    @Column(nullable = false, length = 100)
    private String emailReportaje;

    @Column(nullable = false, length = 100)
    private String nombre;

    private Integer edad;

    @Column(nullable = false)
    @Temporal(TemporalType.DATE)
    private Date fechaDesaparicion;

    @Column(nullable = false, length = 255)
    private String lugarDesaparicion;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    // Getters y Setters
    public Long getIdDesaparecido() { return idDesaparecido; }
    public void setIdDesaparecido(Long idDesaparecido) { this.idDesaparecido = idDesaparecido; }
    public String getEmailReportaje() { return emailReportaje; }
    public void setEmailReportaje(String emailReportaje) { this.emailReportaje = emailReportaje; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public Integer getEdad() { return edad; }
    public void setEdad(Integer edad) { this.edad = edad; }
    public Date getFechaDesaparicion() { return fechaDesaparicion; }
    public void setFechaDesaparicion(Date fechaDesaparicion) { this.fechaDesaparicion = fechaDesaparicion; }
    public String getLugarDesaparicion() { return lugarDesaparicion; }
    public void setLugarDesaparicion(String lugarDesaparicion) { this.lugarDesaparicion = lugarDesaparicion; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
}