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
  profileData: ProfileData | null = null;
  isLoading = true;
  error = false;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadProfileData();
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