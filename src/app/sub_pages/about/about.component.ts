import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {
  aboutMe: string[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadAboutData();
  }

  loadAboutData(): void {
    this.http.get<any>('data/about.json').subscribe(data => {
      this.aboutMe = data.about_me;
    });
  }
}
