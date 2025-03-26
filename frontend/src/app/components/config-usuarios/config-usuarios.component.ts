import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-config-usuarios',
  templateUrl: './config-usuarios.component.html',
  styleUrls: ['./config-usuarios.component.css'],
  standalone: false
})
export class ConfigUsuariosComponent implements OnInit {
  // Lista de usuarios (administradores) que cargamos de la DB
  usuarios: any[] = [];
  // Usuario seleccionado en la lista
  selectedUsuario: any = null;
  // Objeto para el formulario (crear/editar)
  usuarioForm: any = {};

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadUsuarios();
  }

  // Cargar todos los usuarios desde el backend
  loadUsuarios(): void {
    // Ajusta la URL a tu endpoint real
    this.http.get<any[]>('http://localhost:3000/api/auth/usuarios').subscribe({
      next: (data) => {
        this.usuarios = data;
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
      }
    });
  }

  // Al hacer clic en un usuario de la lista
  selectUsuario(user: any): void {
    this.selectedUsuario = user;
    // Clonamos los datos en usuarioForm
    this.usuarioForm = { ...user };
  }

  // Botón "Nuevo" => limpia la selección y el formulario
  newUsuario(): void {
    this.selectedUsuario = null;
    this.usuarioForm = {};
  }

  // Crear un nuevo usuario
  createUsuario(): void {
    // Ajusta la URL al endpoint correcto
    this.http.post('http://localhost:3000/api/auth/usuarios', this.usuarioForm).subscribe({
      next: (resp) => {
        console.log('Usuario creado:', resp);
        this.loadUsuarios();
        this.usuarioForm = {};
      },
      error: (err) => {
        console.error('Error al crear usuario:', err);
      }
    });
  }

  // Modificar un usuario existente
  updateUsuario(): void {
    if (!this.selectedUsuario) return;

    const url = `http://localhost:3000/api/auth/usuarios/${this.selectedUsuario.idmedico}`;
    this.http.put(url, this.usuarioForm).subscribe({
      next: (resp) => {
        console.log('Usuario actualizado:', resp);
        this.loadUsuarios();
      },
      error: (err) => {
        console.error('Error al actualizar usuario:', err);
      }
    });
  }

  // Borrar un usuario existente
  deleteUsuario(): void {
    if (!this.selectedUsuario) return;
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;

    const url = `http://localhost:3000/api/auth/usuarios/${this.selectedUsuario.idmedico}`;
    this.http.delete(url).subscribe({
      next: (resp) => {
        console.log('Usuario eliminado:', resp);
        this.loadUsuarios();
        this.selectedUsuario = null;
        this.usuarioForm = {};
      },
      error: (err) => {
        console.error('Error al eliminar usuario:', err);
      }
    });
  }
}
