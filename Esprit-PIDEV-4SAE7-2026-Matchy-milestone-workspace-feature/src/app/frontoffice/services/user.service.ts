import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, map } from "rxjs";
import { environment } from "../../../environments/environment";
import { User } from "../models/content-models";
import { CertificationService } from "./certification.service";

@Injectable({ providedIn: "root" })
export class UserService {
  private api = `${environment.apiUrl}/User`;

  constructor(
    private http: HttpClient,
    private certificationService: CertificationService,
  ) {}

  private toUser(u: any): User {
    const firstName = (u?.firstName || "").trim();
    const lastName = (u?.lastName || "").trim();
    const generatedName = `${firstName} ${lastName}`.trim();
    const existingName = (u?.name || "").trim();
    const safeName =
      existingName && existingName.toLowerCase() !== "undefined undefined"
        ? existingName
        : generatedName || u?.email || "Unknown User";

    return {
      ...u,
      id: u?.id ?? u?.userId,
      userId: u?.userId ?? u?.id,
      name: safeName,
      city: u?.location ?? u?.city,
    };
  }

  private getUserId(user: User): number | null {
    const candidate = user?.id ?? user?.userId;
    if (candidate == null) return null;
    const parsed = Number(candidate);
    return Number.isFinite(parsed) ? parsed : null;
  }

  getAll(): Observable<User[]> {
    return this.http.get<any[]>(`${this.api}/getAllUsers`).pipe(
      map((users) => users.map((u) => this.toUser(u))),
      map((users) =>
        users.map((user) => {
          const userId = this.getUserId(user);
          if (userId == null) {
            return { ...user, badges: [], badge: user.badge || "" };
          }

          const badges = this.certificationService.getBadgesForUser(userId);
          return {
            ...user,
            badges,
            badge:
              this.certificationService.getPrimaryBadgeForUser(userId) ||
              user.badge ||
              "",
          };
        }),
      ),
    );
  }

  getById(id: number): Observable<User> {
    return this.http
      .get<any>(`${this.api}/${id}`)
      .pipe(map((u) => this.toUser(u)));
  }

  getByRole(role: string): Observable<User[]> {
    return this.http
      .get<any[]>(`${this.api}/getAllUsers`)
      .pipe(
        map((list) =>
          list.filter((u) => u.role === role).map((u) => this.toUser(u)),
        ),
      );
  }

  create(user: Partial<User>): Observable<User> {
    return this.http
      .post<any>(`${this.api}/addUser`, user)
      .pipe(map((u) => this.toUser(u)));
  }

  update(id: number, user: Partial<User>): Observable<User> {
    return this.http
      .put<any>(`${this.api}/modifierUser`, user)
      .pipe(map((u) => this.toUser(u)));
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.api}/deleteUser/${id}`);
  }

  updateStatus(id: number, status: string): Observable<User> {
    const user = { userId: id, isActive: status === "ACTIVE" };
    return this.http
      .put<any>(`${this.api}/modifierUser`, user)
      .pipe(map((u) => this.toUser(u)));
  }

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.api}/getAllUsers`);
  }

  // Aliases for backward compatibility
  getAllUsers(): Observable<User[]> {
    return this.getAll();
  }

  getUserById(id: number): Observable<User> {
    return this.getById(id);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.create(user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.update(id, user);
  }

  deleteUser(id: number): Observable<any> {
    return this.delete(id);
  }
}
