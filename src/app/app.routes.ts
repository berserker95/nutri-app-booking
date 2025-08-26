import { Routes } from '@angular/router';

export const routes: Routes = [
    {path: '', pathMatch: 'full', redirectTo: 'prenota'},
    {path: 'prenota', loadChildren: () => import('@features/public-booking').then(m => m.routes)}
];
