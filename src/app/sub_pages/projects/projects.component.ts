import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

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
  project_types = ["MACHINE LEARNING","WEB DEVELOPMENT","CORE"]
  projects: Project[] = [];

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.getData();
    });
  }
  getData(){
    this.http.get<Project[]>('data/projects.json').subscribe((data) => {
      this.projects = data;
    });
  }
  filterData(input: string) {
    if (input === "ALL") {
      this.getData();
    } else {
      this.http.get<Project[]>('data/projects.json').subscribe((data) => {
        this.projects = data.filter(project => project.label === input);
      });
    }
  }

}
