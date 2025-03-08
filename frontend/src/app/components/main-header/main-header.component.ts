import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-main-header',
  templateUrl: './main-header.component.html',
  styleUrl: './main-header.component.css',
  standalone: false
})
export class MainHeaderComponent implements OnInit {
  usuario: string = 'Invitado'; // Valor predeterminado

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.usuario = this.authService.getUsername();
  }
}