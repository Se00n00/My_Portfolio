import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface Project {
  title: string;
  label: string;
  description_points: string[];
  description: string;
  links: { icon: string; link:string; text: string }[];
  techstack: { icon: string; stack_label: string; color:string }[];
  project_images: {images: string}[];
  keywords: string[];
}

@Component({
  imports: [CommonModule],
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Project[]>('data/projects.json').subscribe((data) => {
      this.projects = data;
    });
  }
}
