import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Subscription, filter, interval, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import type { Map as MapLibreMap } from 'maplibre-gl';

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
  personal: number;
  work: number;
  source: 'personal' | 'work' | 'none';
  tip: string;
  isPlaceholder?: boolean;
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  menu = [
    {"links":"about_subpage", "title":"About", "route":"about"},
    {"links":"experience_subpage", "title":"Experience", "route":"experience"},
    {"links":"projects_subpage", "title":"Projects", "route":"projects"},
    {"links":"blogs_subpage", "title":"Blogs", "route":"blogs"},
    {"links":"skills_subpage", "title":"Skills", "route":"skills"}
  ]

  private routerEventsSub?: Subscription;
  private clockSub?: Subscription;
  isDarkMode = false;
  localTime = '';
  mapsUrl = '';

  profileData: ProfileData | null = null;
  isLoading = true;
  error = false;
  weeks: DayContribution[][] = [];
  visibleWeeks: DayContribution[][] = [];

  @ViewChild('contribContainer') contribContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('mapEl') mapEl?: ElementRef<HTMLDivElement>;
  map?: MapLibreMap;
  mapFailed = false;
  private resizeObserver?: ResizeObserver;
  private readonly CELL_SIZE = 12; // w-3 h-3 = 12px
  private readonly GAP_SIZE = 4;   // gap-1 = 4px

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private router: Router) { }

  ngOnInit(): void {
    this.initTheme();
    this.startClock();
    this.loadProfileData();
    this.fetchContributions();
    // Scroll to the routed section after each navigation (covers direct URL loads too)
    this.routerEventsSub = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(() => this.scrollToActiveSection());
    setTimeout(() => this.scrollToActiveSection(), 100);
  }

  ngAfterViewInit(): void {
    // Observe container size to keep graph non-scrollable and show only what fits
    if (this.contribContainer?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => this.updateVisibleWeeks());
      this.resizeObserver.observe(this.contribContainer.nativeElement);
      // initial calc after view init
      setTimeout(() => this.updateVisibleWeeks(), 100);
    } else {
      // fallback if ViewChild not yet available (e.g., profileData still loading)
      setTimeout(() => {
        if (this.contribContainer?.nativeElement && !this.resizeObserver) {
          this.resizeObserver = new ResizeObserver(() => this.updateVisibleWeeks());
          this.resizeObserver.observe(this.contribContainer.nativeElement);
        }
        this.updateVisibleWeeks();
      }, 500);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.routerEventsSub?.unsubscribe();
    this.clockSub?.unsubscribe();
    clearTimeout(this.scrollTimer);
    this.map?.remove();
  }

  // Live clock for the profile location (Asia/Kolkata)
  private startClock(): void {
    const tick = () => {
      this.localTime = new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      }).format(new Date());
    };
    tick();
    this.clockSub = interval(1000).subscribe(tick);
  }

  private pendingScrollId: string | null = null;
  private scrollTimer?: ReturnType<typeof setTimeout>;

  goTo(item: { links: string; title: string; route: string }): void {
    // Same page: just scroll to the section.
    if (this.activeRoute() === item.route) {
      this.scrollTo(item.links);
      return;
    }
    // Other page: route there, NavigationEnd handler smooth-scrolls to the section.
    this.pendingScrollId = item.links;
    this.router.navigate([item.route]);
  }

  goHome(): void {
    if (this.activeRoute() === '') {
      this.scrollTo('home');
    } else {
      this.router.navigate(['/']);
    }
  }

  private activeRoute(): string {
    // walk to the deepest activated child (firstChild alone is the '' shell route)
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.routeConfig?.path ?? '';
  }

  private scrollToActiveSection(): void {
    const path = this.activeRoute();
    if (!path) {
      this.pendingScrollId = null;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const item = this.menu.find(m => m.route === path);
    const id = this.pendingScrollId ?? item?.links ?? null;
    this.pendingScrollId = null;
    if (id) {
      this.scrollToWhenReady(id);
    } else {
      // error pages etc: reset to top
      window.scrollTo({ top: 0 });
    }
  }

  // Poll for the section element (lazy chunk may still be loading) then scroll to it
  private scrollToWhenReady(id: string, attempts = 0): void {
    if (document.getElementById(id)) {
      this.scrollTo(id);
    } else if (attempts < 20) {
      setTimeout(() => this.scrollToWhenReady(id, attempts + 1), 100);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateVisibleWeeks();
    this.map?.resize();
  }

  private async initMap(): Promise<void> {
    if (this.map || !this.mapEl?.nativeElement) return;
    try {
      const maplibregl = await import('maplibre-gl');
      // Bundlers can't resolve MapLibre's internal worker URL — point it at our vendored copy
      maplibregl.setWorkerUrl('vendor/maplibre/maplibre-gl-worker.mjs');
      const map = new maplibregl.Map({
        container: this.mapEl.nativeElement,
        style: 'https://tiles.openfreemap.org/styles/positron',
        center: [85.015326, 24.7973785],
        zoom: 11,
        attributionControl: false,
        scrollZoom: false,
        boxZoom: false,
        doubleClickZoom: false,
        keyboard: false,
      });
      map.on('load', () => map.resize());
      this.map = map;
    } catch (err) {
      console.error('Map failed to load, using static fallback', err);
      this.mapFailed = true;
    }
  }

  scrollTo(id_reference: string): void {
    clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(() => {
      const element = document.getElementById(id_reference);
      if (!element) return;
      window.scrollTo({
        top: Math.max(0, element.getBoundingClientRect().top + window.scrollY - 88),
        behavior: 'smooth',
      });
    }, 100);
  }
  
  private initTheme(): void {
    const stored = localStorage.getItem('theme');
    this.isDarkMode = stored !== 'light';
    this.applyTheme();
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    document.documentElement.classList.toggle('dark', this.isDarkMode);
  }

  loadProfileData(): void {
    this.http.get<ProfileData>('data/profile.json')
      .subscribe({
        next: (data) => {
          this.profileData = data;
          this.isLoading = false;
          const query = encodeURIComponent(`${data.current_location}, India`);
          this.mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
          // map panel becomes visible now — init after render
          setTimeout(() => this.initMap(), 100);
          // container becomes visible now — attach observer if not yet attached
          setTimeout(() => {
            if (!this.resizeObserver && this.contribContainer?.nativeElement) {
              this.resizeObserver = new ResizeObserver(() => this.updateVisibleWeeks());
              this.resizeObserver.observe(this.contribContainer.nativeElement);
            }
            this.updateVisibleWeeks();
          }, 50);
        },
        error: (err) => {
          console.error('Error loading profile data', err);
          this.isLoading = false;
          this.error = true;
          this.router.navigate(['/500']);
        }
      });
  }
  formatContributions(personalData: any | null, workData: any | null): DayContribution[][] {
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, avoids timezone off-by-one

    const toMap = (data: any | null): Map<string, number> => {
      const m = new Map<string, number>();
      for (const c of (data?.contributions ?? []) as any[]) {
        if (c.date <= todayStr) m.set(c.date, c.count);
      }
      return m;
    };
    const pmap = toMap(personalData);
    const wmap = toMap(workData);

    // 1. Union of dates, ascending (old -> new) — string compare is timezone-safe
    const dates = Array.from(new Set([...pmap.keys(), ...wmap.keys()])).sort();
    if (dates.length === 0) return [];

    const emptyDay = (): DayContribution => ({
      date: '', count: 0, level: 0, personal: 0, work: 0,
      source: 'none', tip: '', isPlaceholder: true
    });

    // 2. Group into calendar weeks (Sunday -> Saturday) to fix alignment
    const weeks: DayContribution[][] = [];
    let currentWeek: DayContribution[] = [];

    // Pad leading days of first week so column starts on Sunday
    const firstWeekday = new Date(dates[0]).getDay(); // 0 = Sunday
    for (let i = 0; i < firstWeekday; i++) {
      currentWeek.push(emptyDay());
    }

    dates.forEach((date) => {
      const p = pmap.get(date) ?? 0;
      const w = wmap.get(date) ?? 0;
      const total = p + w;
      const source: DayContribution['source'] =
        total === 0 ? 'none' : (w >= p ? 'work' : 'personal');
      const tip = total === 0
        ? `${date} · no contributions`
        : `${date} · ${total} contribution${total > 1 ? 's' : ''} (se00n00: ${p}, mohit-craon: ${w})`;
      currentWeek.push({
        date, count: total, level: this.getLevel(total),
        personal: p, work: w, source, tip
      });

      const weekday = new Date(date).getDay();
      if (weekday === 6) { // Saturday = end of week
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Handle trailing partial week (today may be mid-week)
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(emptyDay());
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }

  private updateVisibleWeeks(): void {
    if (!this.weeks.length) return;

    let containerWidth = this.contribContainer?.nativeElement?.clientWidth ?? 0;

    // Fallback if container not measured yet (e.g., hidden behind *ngIf)
    if (!containerWidth) {
      const vw = window.innerWidth;
      if (vw < 640) containerWidth = vw * 0.80;
      else if (vw < 768) containerWidth = vw * 0.68;
      else if (vw < 1024) containerWidth = Math.min(400, vw * 0.40);
      else containerWidth = Math.min(560, vw * 0.42);
    }

    const weekWidth = this.CELL_SIZE + this.GAP_SIZE; // 12 + 4 = 16
    let weeksToShow = Math.floor(containerWidth / weekWidth);

    // Clamp: at least 8 weeks (~2 months), at most 53 weeks (1 year)
    weeksToShow = Math.max(8, Math.min(weeksToShow, 53));
    weeksToShow = Math.min(weeksToShow, this.weeks.length);

    // Slice most recent weeks so right side is always the latest date (today)
    const next = this.weeks.slice(-weeksToShow);
    // only update if changed to avoid churn
    if (next.length !== this.visibleWeeks.length || next[0]?.[0]?.date !== this.visibleWeeks[0]?.[0]?.date) {
      this.visibleWeeks = next;
      // ResizeObserver runs outside Angular zone — ensure view updates
      try { this.cdr.detectChanges(); } catch {}
    }
  }

  fetchContributions() {
    const personal$ = this.http.get<any>(`https://github-contributions-api.jogruber.de/v4/se00n00`)
      .pipe(catchError((err) => {
        console.error('Error fetching personal contributions', err);
        return of(null);
      }));
    const work$ = this.http.get<any>(`https://github-contributions-api.jogruber.de/v4/mohit-craon`)
      .pipe(catchError((err) => {
        console.error('Error fetching work contributions', err);
        return of(null);
      }));

    forkJoin([personal$, work$]).subscribe({
      next: ([personal, work]) => {
        if (!personal && !work) {
          this.error = true;
          return;
        }
        this.weeks = this.formatContributions(personal, work);
        // show only most recent that fits without scrolling
        this.visibleWeeks = [...this.weeks];
        setTimeout(() => this.updateVisibleWeeks(), 0);
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