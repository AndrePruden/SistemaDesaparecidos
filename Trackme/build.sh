#!/bin/bash
# Instala Java 17 y Maven
apt-get update && apt-get install -y openjdk-17-jdk maven

# Construye el proyecto y genera el .jar
mvn clean package

# Ejecuta el JAR (Render espera un proceso de larga duración)
java -jar target/*.jar