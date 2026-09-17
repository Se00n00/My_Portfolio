import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface TechStack {
  icon: string;
  skill_label: string;
}

interface Experience {
  company: string;
  role: string;
  location: string;
  period: string;
  logo: string;
  points: string[];
  techstack: TechStack[];
  youtube_id?: string;
  videoUrl?: SafeResourceUrl;
  videoLoaded?: boolean;
}

@Component({
  selector: 'app-experience',
  imports: [CommonModule],
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.css'],
})
export class ExperienceComponent implements OnInit {
  experiences: Experience[] = [];

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  private withVideo(exp: Experience): Experience {
    const id = exp.youtube_id;
    return {
      ...exp,
      videoUrl: id && /^[A-Za-z0-9_-]{11}$/.test(id)
        ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&controls=0&disablekb=1&fs=0&rel=0&loop=1&playlist=${id}`)
        : undefined,
    };
  }

  ngOnInit(): void {
    this.http.get<Experience[]>('data/experience.json').subscribe((data) => {
      this.experiences = data.map(exp => this.withVideo(exp));
    });
  }
}
