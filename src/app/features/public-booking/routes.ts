import { Routes } from "@angular/router";

export const routes: Routes = [{
    path: '',
    loadComponent: () => import('./public-booking').then(m => m.PublicBooking)
}];