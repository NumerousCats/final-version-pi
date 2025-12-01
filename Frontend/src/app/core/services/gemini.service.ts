import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class GeminiModerationService {
    private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    private readonly apiKey = 'AIzaSyAOvc0rLbBswU7b98sLWC8jqZhE4J_B_jk';

    constructor(private http: HttpClient) {}

    async checkTextSafety(text: string): Promise<boolean> {
        const body = {
            contents: [
                {
                    parts: [
                        {
                            text: `Check if the following text contains blasphemy or inappropriate language. If yes, return "UNSAFE". Otherwise return "SAFE":\n\n${text}`
                        }
                    ]
                }
            ]
        };

        try {
            const resp: any = await this.http.post(
                `${this.apiUrl}?key=${this.apiKey}`,
                body,
                { headers: { 'Content-Type': 'application/json' } }
            ).toPromise();

            const answer = resp?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            return answer === 'SAFE';
        } catch (err) {
            console.error('Gemini moderation error:', err);
            return false; // fail safe: reject if moderation fails
        }
    }
}
