# Sistema Desaparecidos - TrackMe

Proyecto que gestiona información sobre personas desaparecidas, compuesto por un frontend en Angular y un backend en Java con Spring Boot.

## Tecnologías
- **Frontend**: Angular 19, RxJS, TypeScript.
- **Backend**: Spring Boot 3.x, Spring Data JPA, MySQL, Java 17.

## Instrucciones de Instalación

### Backend
1. Clona el repositorio y navega al directorio del backend.

git clone <URL_DEL_REPOSITORIO>
cd <DIRECTORIO_DEL_BACKEND>

2. Asegúrate de tener **Java 17** y **Maven** instalados:
   winget install --id Oracle.OpenJDK.17  
   winget install Apache.Maven    



3. Configura la Base de Datos:

Asegúrate de tener MySQL instalado y en ejecución.

Crea una base de datos llamada Trackme.

Dentro de la base de datos Trackme, crea una tabla usuarios con los campos necesarios (email, nombre, password). Aquí tienes un ejemplo de cómo podría ser la sentencia SQL:

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);

4. Agregar drivers de MySQL al pom.xml para la conexion con la BD. 

<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.26</version> <!-- Asegúrate de usar la versión más reciente -->
</dependency>

5. Configura application.properties:
Asegúrate de que el archivo application.properties tenga la configuración correcta para conectarse a tu base de datos MySQL. Aquí tienes un ejemplo:

spring.datasource.url=jdbc:mysql://localhost:3306/Trackme
spring.datasource.username=root
spring.datasource.password=estudiante
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true


6.Instala Angular CLI (si es necesario):
Si también estás trabajando en el frontend, asegúrate de tener Angular CLI instalado globalmente:

   npm install -g @angular/cli

7.Compila y Ejecuta el Backend:

mvn clean install
mvn spring-boot:run



### Instalación del Frontend (Angular)

Navega al Directorio del Frontend

cd <DIRECTORIO_DEL_FRONTEND>

Instala dependencias 

npm install

Ejecuta el servidor en desarrollo 

ng serve    



