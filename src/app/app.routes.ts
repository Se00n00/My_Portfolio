import { Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';

export const routes: Routes = [
  {
    path: '',
    component: ProfileComponent,
    children: [
      // Home: profile + About only (other sections live on their own routes)
      { path: '', loadComponent: () => import('./sub_pages/about/about.component').then(m => m.AboutComponent) },
      // Single-section pages: only the clicked section shows, scrolled into view
      { path: 'about', loadComponent: () => import('./sub_pages/about/about.component').then(m => m.AboutComponent) },
      { path: 'experience', loadComponent: () => import('./sub_pages/experience/experience.component').then(m => m.ExperienceComponent) },
      { path: 'projects', loadComponent: () => import('./sub_pages/projects/projects.component').then(m => m.ProjectsComponent) },
      { path: 'blogs', loadComponent: () => import('./sub_pages/blogs/blogs.component').then(m => m.BlogsComponent) },
      { path: 'skills', loadComponent: () => import('./sub_pages/skills/skills.component').then(m => m.SkillsComponent) },
      // Error pages
      { path: '500', loadComponent: () => import('./sub_pages/server-error/server-error.component').then(m => m.ServerErrorComponent) },
      { path: '**', loadComponent: () => import('./sub_pages/not-found/not-found.component').then(m => m.NotFoundComponent) },
    ]
  }
];
