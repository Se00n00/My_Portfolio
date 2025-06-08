import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MenuComponent } from '../menu/menu.component';

interface ProfileData {
  profile_image: string;
  name: string;
  short_about: string;
  profession: string;
  tags: string[];
  current_location: string;
  contacts: Contact[];
}

interface Contact {
  image: string;
  link: string;
  label: string;
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule, MenuComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  menu = [
    {"links":"about_subpage", "title":"About"},
    {"links":"blogs_subpage", "title":"Blogs"},
    {"links":"projects_subpage", "title":"Projects"},
    {"links":"skills_subpage", "title":"Skills"}
  ]
  
  profileData: ProfileData | null = null;
  isLoading = true;
  error = false;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadProfileData();
  }

  scrollTo(id_reference: string) {
    const element = document.getElementById(id_reference);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - 100; // your -100px offset
  
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    } else {
      console.warn(`Element with ID "${id_reference}" not found.`);
    }
  }
  
  

  loadProfileData(): void {
    this.http.get<ProfileData>('data/profile.json')
      .subscribe({
        next: (data) => {
          this.profileData = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading profile data', err);
          this.isLoading = false;
          this.error = true;
        }
      });
  }
  
}