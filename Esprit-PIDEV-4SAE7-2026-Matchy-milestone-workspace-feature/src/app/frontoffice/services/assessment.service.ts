import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { Assessment } from "../models/content.model";
import { environment } from "../../../environments/environment";
function parseWithoutCycles(text: string): any {
  let result = "";
  let i = 0;
  const len = text.length;

  while (i < len) {
    // Check for "assessment": {
    if (text[i] === '"' && text.substr(i, 12) === '"assessment"') {
      // Look for : { pattern
      let j = i + 12;
      while (j < len && (text[j] === " " || text[j] === "\t")) j++;
      if (j < len && text[j] === ":") {
        j++;
        while (j < len && (text[j] === " " || text[j] === "\t")) j++;
        if (j < len && text[j] === "{") {
          // Found "assessment": { - skip entire object by counting braces
          j++; // skip opening {
          let braceCount = 1;
          while (j < len && braceCount > 0) {
            if (text[j] === "{") braceCount++;
            else if (text[j] === "}") braceCount--;
            j++;
          }
          // Skip trailing comma and whitespace
          while (
            j < len &&
            (text[j] === "," ||
              text[j] === " " ||
              text[j] === "\t" ||
              text[j] === "\n" ||
              text[j] === "\r")
          )
            j++;
          i = j;
          continue;
        }
      }
    }

    // Check for "content": {
    if (text[i] === '"' && text.substr(i, 9) === '"content"') {
      // Look for : { pattern
      let j = i + 9;
      while (j < len && (text[j] === " " || text[j] === "\t")) j++;
      if (j < len && text[j] === ":") {
        j++;
        while (j < len && (text[j] === " " || text[j] === "\t")) j++;
        if (j < len && text[j] === "{") {
          // Found "content": { - skip entire object by counting braces
          j++; // skip opening {
          let braceCount = 1;
          while (j < len && braceCount > 0) {
            if (text[j] === "{") braceCount++;
            else if (text[j] === "}") braceCount--;
            j++;
          }
          // Skip trailing comma and whitespace
          while (
            j < len &&
            (text[j] === "," ||
              text[j] === " " ||
              text[j] === "\t" ||
              text[j] === "\n" ||
              text[j] === "\r")
          )
            j++;
          i = j;
          continue;
        }
      }
    }

    result += text[i];
    i++;
  }

  // Clean up any remaining trailing commas
  result = result.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(result);
  } catch (e) {
    console.error(
      "[ERROR] JSON parse failed. Length before:",
      text.length,
      "after:",
      result.length,
      "Error:",
      e,
    );
    return [];
  }
}
@Injectable({
  providedIn: "root",
})
export class AssessmentService {
  private apiUrl = `${environment.apiUrl}/Assessment`;

  constructor(private http: HttpClient) {}

  getAllAssessments(): Observable<Assessment[]> {
    return this.http
      .get(`${this.apiUrl}/getAllAssessments`, { responseType: "text" })
      .pipe(
        map((txt: string) => {
          try {
            console.log("[DEBUG] Raw assessment response length:", txt.length);
            const parsed = parseWithoutCycles(txt) as Assessment[];
            console.log("[DEBUG] Parsed assessments count:", parsed.length);
            if (parsed.length > 0) {
              console.log("[DEBUG] First assessment:", parsed[0]);
            }
            return parsed;
          } catch (e) {
            console.error("[ERROR] Failed to parse assessments:", e);
            throw e;
          }
        }),
      );
  }

  getAssessmentById(id: number): Observable<Assessment> {
    return this.http.get<Assessment>(`${this.apiUrl}/${id}`);
  }

  getAssessmentByContentId(contentId: number): Observable<Assessment | null> {
    return this.http
      .get(`${this.apiUrl}/byContent/${contentId}`, { responseType: "text" })
      .pipe(
        map((txt: string) => {
          try {
            return parseWithoutCycles(txt) as Assessment;
          } catch (e) {
            // parsing failure will be caught by catchError below
            throw e;
          }
        }),
        catchError((err) => {
          console.warn(
            "direct byContent request failed, falling back to all assessments",
            err,
          );
          return this.getAllAssessments().pipe(
            map((list) => {
              if (!list || !list.length) {
                return null;
              }
              const found = list.find((a) => {
                const cid =
                  a.contentId != null
                    ? Number(a.contentId)
                    : a.content && a.content.contentId != null
                      ? Number(a.content.contentId)
                      : undefined;
                return cid === contentId;
              });
              return found || null;
            }),
          );
        }),
      );
  }
  createAssessment(assessment: Assessment): Observable<Assessment> {
    return this.http.post<Assessment>(
      `${this.apiUrl}/addAssessment`,
      assessment,
    );
  }

  updateAssessment(assessment: Assessment): Observable<Assessment> {
    return this.http.put<Assessment>(
      `${this.apiUrl}/modifierAssessment`,
      assessment,
    );
  }

  deleteAssessment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deleteAssessment/${id}`);
  }
}
