import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface Project {
  title: string;
  label: string;
  description_points: string[];
  description: string;
  links: { icon: string; link:string; text: string }[];
  techstack: { icon: string; skill_label: string; color:string }[];
  project_images: string[];
  youtube_id?: string;
  videoUrl?: SafeResourceUrl;
  videoLoaded?: boolean;
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

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  private withVideo(project: Project): Project {
    const id = project.youtube_id;
    return {
      ...project,
      videoUrl: id && /^[A-Za-z0-9_-]{11}$/.test(id)
        ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&controls=0&disablekb=1&fs=0&rel=0&loop=1&playlist=${id}`)
        : undefined,
    };
  }

  ngOnInit(): void {
    this.getData();
  }

  getData(): void {
    this.http.get<Project[]>('data/projects.json').subscribe((data) => {
      this.projects = data.map(project => this.withVideo(project));
    });
  }

}
