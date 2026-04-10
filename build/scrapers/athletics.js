/**
 * athletics.js — XSEN School Athletics Data
 * 
 * Data sources:
 *   - ESPN Public API  (no key required)
 *   - CFBD API         (key via CFBD_API_KEY env var)
 * 
 * No Playwright. No school website scraping.
 * 
 * Required env vars:
 *   SCHOOL_ESPN_SLUG   e.g. "oklahoma" | "oklahomast" | "texas"
 *   SCHOOL_CFBD_NAME   e.g. "Oklahoma" | "Oklahoma State" | "Texas"
 *   CFBD_API_KEY       (optional — recruiting/advanced stats)
 *
 * ── ESPN API Coverage by Sport ──────────────────────────────────────────────
 *
 *  Function               FB   MBB  WBB  BSB  SB   WSO  WVB  WRE  GYM
 *  ─────────────────────────────────────────────────────────────────────
 *  scrapeRoster           ✅   ✅   ✅   ✅   ✅   ✅   ✅   ⚠️   ❌
 *  scrapeSchedule         ✅   ✅   ✅   ✅   ✅   ✅   ✅   ⚠️   ❌
 *  scrapeNews             ✅   ✅   ✅   ✅   ⚠️   ⚠️   ⚠️   ❌   ❌
 *  getTeamInfo            ✅   ✅   ✅   ✅   ⚠️   ⚠️   ⚠️   ❌   ❌
 *  getDepthChart          ✅   ✅   ⚠️   ❌   ❌   ❌   ❌   ❌   ❌
 *  getInjuries            ✅   ✅   ⚠️   ❌   ❌   ❌   ❌   ❌   ❌
 *  getStandings           ✅   ✅   ✅   ✅   ⚠️   ⚠️   ⚠️   ❌   ❌
 *  getPlayerStats         ✅   ✅   ✅   ✅   ⚠️   ❌   ❌   ❌   ❌
 *  getRecruiting          ✅   ❌   ❌   ❌   ❌   ❌   ❌   ❌   ❌
 *  getRecruitingByPos     ✅   ❌   ❌   ❌   ❌   ❌   ❌   ❌   ❌
 *
 *  KEY:  ✅ Strong   ⚠️ Partial/varies   ❌ Not available
 *  FB=Football  MBB=Men's Basketball  WBB=Women's Basketball
 *  BSB=Baseball  SB=Softball  WSO=Women's Soccer
 *  WVB=Women's Volleyball  WRE=Wrestling  GYM=Gymnastics
 *
 *  NOTE: Wrestling and Gymnastics are better served by dedicated MCPs
 *        already in the XSEN stack. Women's sports scores/rankings
 *        are better served by the NCAA Women's MCP.
 *        Recruiting is FOOTBALL ONLY via CFBD.
 */

const ESPN_BASE   = 'https://site.api.espn.com/apis/site/v2/sports';
const CFBD_BASE   = 'https://api.collegefootballdata.com';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSchool() {
  return {
    espnSlug: process.env.SCHOOL_ESPN_SLUG || 'oklahoma',
    cfbdName: process.env.SCHOOL_CFBD_NAME || 'Oklahoma'
  };
}

function espnSportPath(sport) {
  const map = {
    'football':           'football/college-football',
    'mens-basketball':    'basketball/mens-college-basketball',
    'womens-basketball':  'basketball/womens-college-basketball',
    'baseball':           'baseball/college-baseball',
    'softball':           'softball/college-softball',
    'mens-soccer':        'soccer/college-mens-soccer',
    'womens-soccer':      'soccer/college-womens-soccer',
    'womens-volleyball':  'volleyball/womens-college-volleyball',
    'wrestling':          'wrestling/college-wrestling',
    'gymnastics':         'gymnastics/womens-college-gymnastics'
  };
  return map[sport] || 'football/college-football';
}

async function espnFetch(path, params = {}) {
  const url = new URL(path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const r = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    console.error(`ESPN fetch error: ${e.message}`);
    return null;
  }
}

async function cfbdFetch(path, params = {}) {
  const url = new URL(`${CFBD_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const headers = { Accept: 'application/json' };
  if (process.env.CFBD_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.CFBD_API_KEY}`;
  }
  try {
    const r = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(10000) });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    console.error(`CFBD fetch error: ${e.message}`);
    return null;
  }
}

function currentYear() {
  const m = new Date().getMonth();
  return m < 7 ? new Date().getFullYear() - 1 : new Date().getFullYear();
}

// ── ROSTER ────────────────────────────────────────────────────────────────────
// Coverage: Strong for FB/MBB/WBB/BSB. Partial for SB/Soccer/VB. No wrestling/gymnastics.
export async function scrapeRoster(sport) {
  const { espnSlug } = getSchool();
  const sportPath = espnSportPath(sport);
  const data = await espnFetch(`${ESPN_BASE}/${sportPath}/teams/${espnSlug}/roster`);

  if (!data?.athletes) {
    return [];
  }

  // ESPN returns athletes grouped by position group
  const players = [];
  const groups = data.athletes || [];
  
  for (const group of groups) {
    const items = group.items || group.athletes || (Array.isArray(group) ? group : []);
    for (const p of items) {
      players.push({
        name:        p.fullName || p.displayName || '',
        jerseyNumber: p.jersey || '',
        position:    p.position?.abbreviation || p.position?.name || '',
        year:        p.experience?.displayValue || '',
        hometown:    p.birthPlace ? `${p.birthPlace.city || ''}, ${p.birthPlace.state || ''}`.replace(/^,\s*|,\s*$/, '') : '',
        height:      p.displayHeight || '',
        weight:      p.displayWeight || '',
        highSchool:  '',
        bioLink:     p.links?.[0]?.href || `https://www.espn.com/college-football/player/_/id/${p.id}`
      });
    }
  }

  return players;
}

// ── SCHEDULE ──────────────────────────────────────────────────────────────────
// Coverage: Strong for FB/MBB/WBB/BSB/SB/Soccer/VB. Partial for wrestling. No gymnastics.
export async function scrapeSchedule(sport) {
  const { espnSlug } = getSchool();
  const sportPath = espnSportPath(sport);
  const year = currentYear();
  const data = await espnFetch(`${ESPN_BASE}/${sportPath}/teams/${espnSlug}/schedule`, { season: year });

  if (!data?.events) return [];

  return data.events.map(event => {
    const comp   = event.competitions?.[0];
    const home   = comp?.competitors?.find(c => c.homeAway === 'home');
    const away   = comp?.competitors?.find(c => c.homeAway === 'away');
    const isHome = home?.team?.abbreviation === espnSlug.toUpperCase() ||
                   home?.team?.slug === espnSlug;
    const opp    = isHome ? away : home;

    const status  = comp?.status?.type;
    const winner  = comp?.competitors?.find(c => c.winner);
    const myTeam  = comp?.competitors?.find(c => 
      c.team?.slug === espnSlug || c.team?.abbreviation?.toLowerCase() === espnSlug.toLowerCase()
    );

    let result = '';
    if (status?.completed) {
      result = myTeam?.winner ? 'W' : 'L';
    }

    return {
      date:     event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
      opponent: opp?.team?.displayName || opp?.team?.shortDisplayName || '',
      location: isHome ? 'Home' : (comp?.venue?.fullName || 'Away'),
      result:   result,
      score:    status?.completed
                  ? `${myTeam?.score || ''}–${opp?.score || ''}`
                  : (status?.description || 'Upcoming')
    };
  });
}

// ── NEWS ──────────────────────────────────────────────────────────────────────
// Coverage: Strong for FB/MBB/WBB/BSB. Partial for other women's sports. No wrestling/gymnastics.
export async function scrapeNews(sport, limit = 10) {
  const { espnSlug } = getSchool();
  const sportPath = espnSportPath(sport);
  const data = await espnFetch(`${ESPN_BASE}/${sportPath}/teams/${espnSlug}/news`, { limit });

  if (!data?.articles) return [];

  return data.articles.slice(0, limit).map(a => ({
    title:   a.headline || a.title || '',
    date:    a.published ? new Date(a.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
    summary: a.description || a.abstract || '',
    link:    a.links?.web?.href || a.links?.mobile?.href || ''
  }));
}

// ── TEAM INFO ─────────────────────────────────────────────────────────────────
// Coverage: Strong for FB/MBB/WBB/BSB. Partial for other sports. No wrestling/gymnastics.
export async function getTeamInfo(sport) {
  const { espnSlug } = getSchool();
  const sportPath = espnSportPath(sport);
  const data = await espnFetch(`${ESPN_BASE}/${sportPath}/teams/${espnSlug}`);

  if (!data?.team) return null;

  const t = data.team;
  return {
    name:        t.displayName || t.name || '',
    shortName:   t.shortDisplayName || t.abbreviation || '',
    mascot:      t.nickname || '',
    colors:      t.color ? [`#${t.color}`, `#${t.alternateColor}`] : [],
    logo:        t.logos?.[0]?.href || '',
    venue:       t.venue?.fullName || '',
    city:        t.venue ? `${t.venue.city || ''}, ${t.venue.state || ''}` : '',
    conference:  t.groups?.name || '',
    record:      t.record?.items?.[0]?.summary || '',
    links: {
      espn:   `https://www.espn.com/college-football/team/_/id/${t.id}`,
      roster: `https://www.espn.com/college-football/team/roster/_/id/${t.id}`
    }
  };
}

// ── DEPTH CHART ───────────────────────────────────────────────────────────────
// Coverage: FOOTBALL and MBB only. Other sports return empty. Concept doesn't apply to most other sports.
export async function getDepthChart(sport) {
  const { espnSlug } = getSchool();
  const sportPath = espnSportPath(sport);
  const data = await espnFetch(`${ESPN_BASE}/${sportPath}/teams/${espnSlug}/depthcharts`);

  if (!data?.depthCharts) return [];

  return data.depthCharts.map(group => ({
    position:  group.position?.displayName || group.position?.abbreviation || '',
    starters:  (group.athletes || []).slice(0, 3).map((slot, i) => ({
      depth:   i + 1,
      name:    slot.athlete?.displayName || slot.athlete?.fullName || '',
      jersey:  slot.athlete?.jersey || '',
      year:    slot.athlete?.experience?.displayValue || ''
    }))
  })).filter(g => g.starters.length > 0);
}

// ── INJURIES ──────────────────────────────────────────────────────────────────
// Coverage: FOOTBALL and MBB reliable. WBB partial. All other sports rarely populated by ESPN.
export async function getInjuries(sport) {
  const { espnSlug } = getSchool();
  const sportPath = espnSportPath(sport);
  const data = await espnFetch(`${ESPN_BASE}/${sportPath}/teams/${espnSlug}/injuries`);

  if (!data?.injuries) return [];

  return data.injuries.map(i => ({
    name:     i.athlete?.displayName || i.athlete?.fullName || '',
    position: i.athlete?.position?.abbreviation || '',
    status:   i.status || '',
    detail:   i.details?.detail || i.details?.type || '',
    side:     i.details?.location || '',
    date:     i.date ? new Date(i.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
  })).filter(i => i.name);
}

// ── STANDINGS ─────────────────────────────────────────────────────────────────
// Coverage: Strong for FB/MBB/WBB/BSB. Partial for SB/Soccer/VB. No wrestling/gymnastics.
// NOTE: For women's sports rankings, the NCAA Women's MCP is more reliable.
export async function getStandings(sport) {
  const { espnSlug } = getSchool();
  const sportPath = espnSportPath(sport);

  // Get team info first to find conference group ID
  const teamData = await espnFetch(`${ESPN_BASE}/${sportPath}/teams/${espnSlug}`);
  const groupId  = teamData?.team?.groups?.id;

  const params = groupId ? { group: groupId } : {};
  const data   = await espnFetch(`${ESPN_BASE}/${sportPath}/standings`, params);

  if (!data?.standings?.entries) return [];

  return data.standings.entries.map(e => ({
    team:      e.team?.displayName || e.team?.shortDisplayName || '',
    overall:   e.stats?.find(s => s.name === 'overall')?.displayValue || '',
    conference: e.stats?.find(s => s.name === 'vs. Conf.')?.displayValue ||
                e.stats?.find(s => s.abbreviation === 'conf')?.displayValue || '',
    pct:       e.stats?.find(s => s.name === 'winPercent' || s.abbreviation === 'PCT')?.displayValue || '',
    streak:    e.stats?.find(s => s.name === 'streak')?.displayValue || ''
  }));
}

// ── PLAYER STATS ──────────────────────────────────────────────────────────────
// Coverage: Strong for FB/MBB/WBB/BSB. Partial for SB. Not available for Soccer/VB/Wrestling/Gymnastics.
export async function getPlayerStats(sport, category = 'passing') {
  const { espnSlug } = getSchool();
  const sportPath = espnSportPath(sport);
  const year = currentYear();

  const data = await espnFetch(
    `${ESPN_BASE}/${sportPath}/teams/${espnSlug}/statistics`,
    { season: year }
  );

  if (!data) return [];

  // Also try leaders endpoint
  const leadersData = await espnFetch(
    `${ESPN_BASE}/${sportPath}/teams/${espnSlug}/leaders`
  );

  if (!leadersData?.leaders) return [];

  const results = [];
  for (const group of leadersData.leaders) {
    const cat = group.name || group.displayName || '';
    for (const leader of (group.leaders || []).slice(0, 5)) {
      results.push({
        category: cat,
        name:     leader.athlete?.displayName || '',
        value:    leader.displayValue || leader.value || '',
        rank:     leader.rank || ''
      });
    }
  }
  return results;
}

// ── RECRUITING ────────────────────────────────────────────────────────────────
// Coverage: FOOTBALL ONLY via CFBD API. Basketball/other sports recruiting not available here.
// For basketball recruiting, consider 247Sports or On3 API (separate integration).
export async function getRecruiting(year) {
  const { cfbdName } = getSchool();
  const recruitYear = year || (currentYear() + 1);

  const [players, teamRankings] = await Promise.all([
    cfbdFetch('/recruiting/players', { year: recruitYear, team: cfbdName }),
    cfbdFetch('/recruiting/teams', { year: recruitYear })
  ]);

  console.log(`🏈 CFBD players raw (${recruitYear}):`, JSON.stringify(players)?.substring(0, 200));

  const myRanking = Array.isArray(teamRankings)
    ? teamRankings.find(t => t.team === cfbdName || t.team?.toLowerCase() === cfbdName.toLowerCase())
    : null;

  // If team filter returned nothing, fetch all and filter by committedTo
  let commits = Array.isArray(players) && players.length > 0 ? players : [];

  if (commits.length === 0) {
    console.log(`⚠️ No players for team=${cfbdName}, trying full list...`);
    const allPlayers = await cfbdFetch('/recruiting/players', { year: recruitYear });
    if (Array.isArray(allPlayers) && allPlayers.length > 0) {
      console.log(`🏈 Total players in ${recruitYear}: ${allPlayers.length}, sample:`, JSON.stringify(allPlayers[0])?.substring(0, 200));
      commits = allPlayers.filter(p =>
        p.committedTo?.toLowerCase().includes(cfbdName.toLowerCase()) ||
        p.team?.toLowerCase().includes(cfbdName.toLowerCase())
      );
      console.log(`🏈 Filtered commits for ${cfbdName}: ${commits.length}`);
    }
  }

  return {
    year:        recruitYear,
    team:        cfbdName,
    classRank:   myRanking?.rank || null,
    totalPoints: myRanking?.points ? parseFloat(myRanking.points).toFixed(1) : null,
    commitCount: commits.length,
    commits:     commits.map(p => ({
      name:      `${p.name || ''}`,
      position:  p.position || '',
      stars:     p.stars || 0,
      rating:    p.rating ? parseFloat(p.rating).toFixed(4) : '',
      hometown:  p.city && p.stateProvince ? `${p.city}, ${p.stateProvince}` : p.city || '',
      highSchool: p.school || '',
      status:    p.committedTo ? 'Committed' : 'Undecided'
    })).sort((a, b) => (b.stars - a.stars) || (parseFloat(b.rating) - parseFloat(a.rating)))
  };
}

export async function getRecruitingByPosition(position, year) {
  const { cfbdName } = getSchool();
  const recruitYear = year || (currentYear() + 1);

  const players = await cfbdFetch('/recruiting/players', {
    year:     recruitYear,
    team:     cfbdName,
    position: position
  });

  if (!Array.isArray(players)) return [];

  return players.map(p => ({
    name:      p.name || '',
    position:  p.position || '',
    stars:     p.stars || 0,
    rating:    p.rating ? parseFloat(p.rating).toFixed(4) : '',
    hometown:  p.city && p.stateProvince ? `${p.city}, ${p.stateProvince}` : '',
    highSchool: p.school || ''
  })).sort((a, b) => b.stars - a.stars);
}

// ── CONVENIENCE WRAPPERS (keep same API as old athletics.js) ──────────────────

export async function getRecentResults(sport, limit = 5) {
  const schedule = await scrapeSchedule(sport);
  return schedule.filter(g => g.result !== '').slice(-limit).reverse();
}

export async function getUpcomingGames(sport, limit = 5) {
  const schedule = await scrapeSchedule(sport);
  return schedule.filter(g => g.result === '' && !g.score.match(/^\d/)).slice(0, limit);
}

export async function getTeamDashboard(sport) {
  const [roster, schedule, news, teamInfo, injuries] = await Promise.all([
    scrapeRoster(sport),
    scrapeSchedule(sport),
    scrapeNews(sport, 5),
    getTeamInfo(sport),
    getInjuries(sport)
  ]);

  const recentGames  = schedule.filter(g => g.result !== '').slice(-5).reverse();
  const upcomingGames = schedule.filter(g => g.result === '').slice(0, 5);

  return {
    sport,
    teamInfo,
    teamSize:     roster.length,
    roster,
    recentResults:  recentGames,
    upcomingGames,
    latestNews:   news,
    injuries:     injuries.slice(0, 10)
  };
}

export async function searchPlayer(sport, searchTerm) {
  const roster = await scrapeRoster(sport);
  const term   = searchTerm.toLowerCase();
  return roster.filter(p =>
    p.name.toLowerCase().includes(term) ||
    p.hometown.toLowerCase().includes(term) ||
    p.position.toLowerCase().includes(term) ||
    p.jerseyNumber === searchTerm
  );
}

export async function getPlayerBio(sport, playerName) {
  const roster = await scrapeRoster(sport);
  return roster.find(p => p.name.toLowerCase().includes(playerName.toLowerCase())) || null;
}

export async function getSportSummary(sport) {
  const [roster, news, schedule, teamInfo] = await Promise.all([
    scrapeRoster(sport),
    scrapeNews(sport, 3),
    scrapeSchedule(sport),
    getTeamInfo(sport)
  ]);

  const nextGame  = schedule.find(g => g.result === '');
  const lastGame  = [...schedule].reverse().find(g => g.result !== '');

  return {
    sport,
    teamInfo,
    rosterSize: roster.length,
    nextGame:   nextGame || null,
    lastResult: lastGame || null,
    recentNews: news
  };
}

export async function getTeamComparison(sport1, sport2) {
  const [roster1, roster2, news1, news2] = await Promise.all([
    scrapeRoster(sport1),
    scrapeRoster(sport2),
    scrapeNews(sport1, 3),
    scrapeNews(sport2, 3)
  ]);
  return {
    team1: { sport: sport1, rosterSize: roster1.length, recentNews: news1 },
    team2: { sport: sport2, rosterSize: roster2.length, recentNews: news2 }
  };
}

export async function getSeasonRecords(sport) {
  const schedule = await scrapeSchedule(sport);
  const wins   = schedule.filter(g => g.result === 'W').length;
  const losses = schedule.filter(g => g.result === 'L').length;
  return {
    sport,
    wins,
    losses,
    totalGames:    wins + losses,
    winPercentage: wins + losses > 0 ? (wins / (wins + losses) * 100).toFixed(1) : '0',
    upcomingGames: schedule.filter(g => g.result === '').length
  };
}

export async function getPlayerStatsDetail(sport, playerName) {
  const [player, stats] = await Promise.all([
    getPlayerBio(sport, playerName),
    getPlayerStats(sport)
  ]);
  const playerStats = stats.filter(s =>
    s.name?.toLowerCase().includes(playerName.toLowerCase())
  );
  return { player, statistics: playerStats };
}

export async function getAllSportsSummary() {
  const sports = ['football', 'baseball', 'softball', 'mens-basketball', 'womens-basketball', 'womens-volleyball', 'womens-soccer'];
  const summaries = await Promise.all(sports.map(async sport => {
    try {
      return await getSportSummary(sport);
    } catch {
      return { sport, error: 'Unable to fetch data' };
    }
  }));
  return summaries;
}

export async function getGameDetails(sport, opponent) {
  const schedule = await scrapeSchedule(sport);
  return schedule.find(g => g.opponent.toLowerCase().includes(opponent.toLowerCase())) || null;
}

export async function getTopPerformers(sport, limit = 5) {
  const stats = await getPlayerStats(sport);
  return {
    sport,
    topPerformers: stats.slice(0, limit),
    totalPlayers:  stats.length
  };
}



