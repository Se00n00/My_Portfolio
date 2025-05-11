import { Component } from '@angular/core';

import { AboutComponent } from '../sub_pages/about/about.component';
import { ProjectsComponent } from '../sub_pages/projects/projects.component';
import { BlogsComponent } from '../sub_pages/blogs/blogs.component';
import { SkillsComponent } from '../sub_pages/skills/skills.component';

@Component({
  selector: 'app-menu',
  imports: [AboutComponent, ProjectsComponent, BlogsComponent, SkillsComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {

}
