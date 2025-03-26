import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-config-torres',
  templateUrl: './config-torres.component.html',
  styleUrls: ['./config-torres.component.css'],
  standalone: false
})
export class ConfigTorreComponent implements OnInit {
  torres: any[] = [];
  selectedTorre: any = null;
  torreForm: any = {};

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.loadTorres();
  }

  loadTorres(): void {
    this.http.get<any[]>('http://localhost:3000/api/torres').subscribe({
      next: data => {
        this.torres = data;
      },
      error: err => {
        console.error('Error al cargar torres:', err);
      }
    });
  }

  selectTorre(torre: any): void {
    this.selectedTorre = torre;
    // Clonamos la información de la torre seleccionada en el formulario
    this.torreForm = { ...torre };
  }

  newTorre(): void {
    this.selectedTorre = null;
    this.torreForm = {};
  }

  createTorre(): void {
    // Se asume que el endpoint para crear es /api/torres/register
    this.http.post('http://localhost:3000/api/torres/register', this.torreForm).subscribe({
      next: (resp: any) => {
        console.log('Torre creada:', resp);
        this.loadTorres();
        this.torreForm = {};
      },
      error: err => {
        console.error('Error al crear torre:', err);
      }
    });
  }

  updateTorre(): void {
    if (!this.selectedTorre) return;
    const url = `http://localhost:3000/api/torres/${this.selectedTorre.idTorre}`;
    this.http.put(url, this.torreForm).subscribe({
      next: (resp: any) => {
        console.log('Torre actualizada:', resp);
        this.loadTorres();
      },
      error: err => {
        console.error('Error al actualizar torre:', err);
      }
    });
  }

  deleteTorre(): void {
    if (!this.selectedTorre) return;
    if (!confirm('¿Está seguro de eliminar esta torre?')) return;
    const url = `http://localhost:3000/api/torres/${this.selectedTorre.idTorre}`;
    this.http.delete(url).subscribe({
      next: (resp: any) => {
        console.log('Torre eliminada:', resp);
        this.loadTorres();
        this.selectedTorre = null;
        this.torreForm = {};
      },
      error: err => {
        console.error('Error al eliminar torre:', err);
      }
    });
  }
}
