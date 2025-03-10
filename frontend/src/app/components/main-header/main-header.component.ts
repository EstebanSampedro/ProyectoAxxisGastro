import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-main-header',
  templateUrl: './main-header.component.html',
  styleUrl: './main-header.component.css',
  standalone: false
})
export class MainHeaderComponent implements OnInit {
  usuario: string = 'Invitado'; 
  currentInterface: string = 'registro-citas'; 

  constructor(private authService: AuthService,private navBarService: ApiService) { }

  ngOnInit(): void {
        // Suscríbete al servicio para obtener el estado actual
        this.navBarService.currentInterface$.subscribe((interfaceName) => {
          this.currentInterface = interfaceName;
        });
    this.usuario = this.authService.getUsername();   
  }
}