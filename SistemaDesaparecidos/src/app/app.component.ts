import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistroComponent } from './components/registro/registro.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RegistroComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'trackme-frontend';
}