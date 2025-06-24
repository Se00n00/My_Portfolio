import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

interface DayContribution {
  date: string;
  count: number;
  level: number;
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
    {"links":"projects_subpage", "title":"Projects"},
    {"links":"blogs_subpage", "title":"Blogs"},
    {"links":"skills_subpage", "title":"Skills"}
  ]
  skillsData: any[] = [];
  
  profileData: ProfileData | null = null;
  isLoading = true;
  error = false;
  weeks: DayContribution[][] = [];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadProfileData();
    this.http.get<any[]>('data/skills.json').subscribe(data => {
      this.skillsData = data;
    });
    this.fetchContributions('se00n00');
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
  
  shareWeb(){
    const text = "Check out my portfolio!\nThis is the personal portfolio of se00n00 — showcasing my work, projects, and skills.\nhttps://se00n00.github.io/My_Portfolio/";

    navigator.clipboard.writeText(text).then(() => {
      alert("Text copied to clipboard!");
    }).catch(err => {
      alert("Failed to copy text: " + err);
    });
  }
  
  toggleDarkMode(){
    document.documentElement.classList.toggle('dark');
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
  formatContributions(data: any): DayContribution[][] {
    const today = new Date();
    const contributions = data.contributions;

    // Filter only 2024 and 2025, and exclude future dates
    const filtered = contributions.filter((c: any) => {
      const date = new Date(c.date);
      const year = date.getFullYear();

      return (year === 2024 || year === 2025) && date <= today;
    });

    // Sort: 2024 first, then 2025, ascending within each year
    filtered.sort((a: any, b: any) => {
      const yearA = new Date(a.date).getFullYear();
      const yearB = new Date(b.date).getFullYear();

      if (yearA !== yearB) return yearA === 2024 ? -1 : 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Group into weeks
    const weeks: DayContribution[][] = [];
    let currentWeek: DayContribution[] = [];

    filtered.forEach((day: any) => {
      currentWeek.push({
        date: day.date,
        count: day.count,
        level: this.getLevel(day.count)
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }

  fetchContributions(username: string) {
    this.http.get<any>(`https://github-contributions-api.jogruber.de/v4/${username}`)
      .subscribe({
        next: (res) => {
          this.weeks = this.formatContributions(res);
        },
        error: (err) => {
          console.error('Error fetching contributions', err);
          this.error = true;
        }
      });
  }

  getLevel(count: number): number {
    if (count === 0) return 0;
    if (count < 2) return 1;
    if (count < 4) return 2;
    if (count < 6) return 3;
    return 4;
  }
  
}