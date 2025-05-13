import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AboutComponent } from '../sub_pages/about/about.component';
import { ProjectsComponent } from '../sub_pages/projects/projects.component';
import { BlogsComponent } from '../sub_pages/blogs/blogs.component';
import { SkillsComponent } from '../sub_pages/skills/skills.component';

@Component({
  selector: 'app-menu',
  imports: [AboutComponent, ProjectsComponent, BlogsComponent, SkillsComponent, CommonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {
  menu = [
    {"links":"link1", "title":"About", "color":"#00FF00", "image":"image"},
    {"links":"link1", "title":"Projects", "color":"#0F0F00", "image":"image"},
    {"links":"link1", "title":"Blogs", "color":"#00FF0F", "image":"image"},
    {"links":"link1", "title":"Skills", "color":"#0F0FF0", "image":"image"}
  ]
}
