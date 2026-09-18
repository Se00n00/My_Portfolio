import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-blogs',
  imports: [CommonModule],
  templateUrl: './blogs.component.html',
})
export class BlogsComponent implements OnInit {
  blogs: any[] = [];
  private readonly BLOGS_API = 'https://personal-blog-three-sage.vercel.app/articles';
  private readonly ARTICLE_BASE = 'https://se00n00.github.io/Personal-Blog/article/';
  private readonly IMAGE_BASE = 'https://se00n00.github.io/Personal-Blog/';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any[]>(this.BLOGS_API).pipe(
      catchError(() => {
        // Fallback to local data if API fails (e.g., CORS/offline)
        return this.http.get<any[]>('data/blogs.json').pipe(catchError(() => of([])));
      })
    ).subscribe(data => {
      this.blogs = (data || []).map(item => this.normalizeBlog(item));
    });
  }

  private normalizeBlog(raw: any): any {
    const id: string | undefined = raw.id ?? this.extractIdFromLink(raw.links);
    const title: string = raw.title ?? '';
    const label: string = raw.category ?? raw.label ?? '';
    const description: string = raw.description ?? '';
    const icon: string = this.resolveIcon(raw.icon ?? raw.image ?? '');
    const links: string = id ? `${this.ARTICLE_BASE}${id}` : (raw.links ?? this.BLOGS_API);
    return { ...raw, id, title, label, description, icon, links };
  }

  private extractIdFromLink(link?: string): string | undefined {
    if (!link) return undefined;
    // Expecting .../article/<id> or .../article/2
    try {
      const parts = link.split('/');
      const last = parts[parts.length - 1] || parts[parts.length - 2];
      return last || undefined;
    } catch { return undefined; }
  }

  private resolveIcon(icon: string): string {
    if (!icon) return icon;
    if (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:')) return icon;
    if (icon.startsWith('icons/') || icon.startsWith('/icons/') || icon.startsWith('assets/')) return icon;
    // Vercel API returns e.g. "firstblog/itact2000.png" -> host on GitHub Pages
    if (icon.startsWith('firstblog/')) return `${this.IMAGE_BASE}${icon}`;
    // fallback: if relative, prefix with IMAGE_BASE
    if (!icon.startsWith('/')) return `${this.IMAGE_BASE}${icon}`;
    return icon;
  }
}