export interface Player {
    name: string;
    jerseyNumber: string;
    position: string;
    year: string;
    hometown: string;
    height: string;
    highSchool: string;
    bioLink: string;
}
export interface Game {
    date: string;
    opponent: string;
    location: string;
    result: string;
    score: string;
}
export declare function scrapeRoster(sport: string): Promise<Player[]>;
export declare function scrapeSchedule(sport: string): Promise<Game[]>;
//# sourceMappingURL=athletics.d.ts.map