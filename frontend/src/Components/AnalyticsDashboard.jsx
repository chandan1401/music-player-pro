import React, { useMemo, useState } from 'react';

export default function AnalyticsDashboard({ songs, listeningEvents = [], skipCounts = {}, playCounts = {}, currentMood, onPlaySong = () => {} }) {
  const [weather, setWeather] = useState('sunny');
  const [activity, setActivity] = useState('chill');

  const formatHour = (h) => {
    const hour = h % 24;
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const twelve = hour % 12 || 12;
    return `${twelve} ${suffix}`;
  };

  const peakHour = useMemo(() => {
    if (!listeningEvents.length) return null;
    const buckets = listeningEvents.reduce((acc, evt) => {
      const hour = new Date(evt.ts).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    const topHour = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
    return { hour: Number(topHour[0]), count: topHour[1] };
  }, [listeningEvents]);

  const moodTimeline = useMemo(() => {
    const latest = listeningEvents.slice(0, 24).reverse();
    const grouped = {};
    latest.forEach(evt => {
      const hour = new Date(evt.ts).getHours();
      const key = `${hour}`;
      if (!grouped[key]) grouped[key] = {};
      grouped[key][evt.mood || 'neutral'] = (grouped[key][evt.mood || 'neutral'] || 0) + 1;
    });
    return Object.entries(grouped)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .slice(-8);
  }, [listeningEvents]);

  const skippedSongs = useMemo(() => {
    return Object.entries(skipCounts)
      .map(([id, count]) => ({ song: songs.find(s => s.id === Number(id)), count }))
      .filter(item => item.song)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [skipCounts, songs]);

  const timeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  };

  const moodForWeather = {
    sunny: 'happy',
    rainy: 'calm',
    cloudy: 'neutral',
    snowy: 'calm'
  };

  const moodForActivity = {
    study: 'focus',
    workout: 'energetic',
    commute: 'upbeat',
    chill: 'calm'
  };

  const pickSongsByMood = (moodTarget, limit = 3) => {
    if (!songs.length) return [];
    const matches = songs.filter(s => {
      const mood = (s.mood || '').toLowerCase();
      const playlist = (s.playlist || '').toLowerCase();
      const genre = (s.genre || '').toLowerCase();
      return mood.includes(moodTarget) || playlist.includes(moodTarget) || genre.includes(moodTarget);
    });
    if (matches.length >= limit) return matches.slice(0, limit);
    const topPlays = Object.entries(playCounts)
      .map(([id, count]) => ({ song: songs.find(s => s.id === Number(id)), count }))
      .filter(entry => entry.song)
      .sort((a, b) => b.count - a.count)
      .map(entry => entry.song);
    const filler = topPlays.filter(s => !matches.includes(s));
    return [...matches, ...filler].slice(0, limit);
  };

  const timeMoodMap = {
    morning: 'upbeat',
    afternoon: 'focus',
    evening: 'chill',
    night: 'calm'
  };

  const timeRecommendation = pickSongsByMood(timeMoodMap[timeOfDay()] || 'chill');
  const weatherRecommendation = pickSongsByMood(moodForWeather[weather] || 'calm');
  const activityRecommendation = pickSongsByMood(moodForActivity[activity] || 'focus');

  return (
    <div className="analytics-panel">
      <h3>🎧 Listening Insights</h3>

      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="card-label">Peak Listening Time</div>
          {peakHour ? (
            <div className="card-value">{formatHour(peakHour.hour)} <span className="pill">{peakHour.count} plays</span></div>
          ) : (
            <div className="muted">No data yet</div>
          )}
        </div>

        <div className="analytics-card">
          <div className="card-label">Current Mood</div>
          <div className="card-value">{currentMood || 'neutral'}</div>
          <div className="subtext">Adapted from what you play most</div>
        </div>

        <div className="analytics-card">
          <div className="card-label">Most Skipped</div>
          {skippedSongs.length ? skippedSongs.map(item => (
            <button key={item.song.id} className="chip" onClick={() => onPlaySong(item.song.id)}>
              {item.song.title} <span className="pill muted">{item.count} skips</span>
            </button>
          )) : <div className="muted">No skips logged</div>}
        </div>

        <div className="analytics-card">
          <div className="card-label">Mood vs Time</div>
          <div className="mood-timeline">
            {moodTimeline.length === 0 && <div className="muted">Play to see trends</div>}
            {moodTimeline.map(([hour, moods]) => {
              const total = Object.values(moods).reduce((a, b) => a + b, 0);
              return (
                <div key={hour} className="timeline-row">
                  <span className="timeline-hour">{formatHour(Number(hour))}</span>
                  <div className="timeline-bar">
                    {Object.entries(moods).map(([mood, count]) => (
                      <div
                        key={mood}
                        className={`timeline-segment mood-${mood}`}
                        style={{ width: `${(count / total) * 100}%` }}
                        title={`${mood}: ${count}`}
                      ></div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="context-grid">
        <div className="analytics-card">
          <div className="card-label">Time-based picks ({timeOfDay()})</div>
          <div className="chip-row">
            {timeRecommendation.map(song => (
              <button key={song.id} className="chip" onClick={() => onPlaySong(song.id)}>
                {song.title}
              </button>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-label">Weather-based</div>
          <div className="control-row">
            <select value={weather} onChange={e => setWeather(e.target.value)}>
              <option value="sunny">Sunny</option>
              <option value="rainy">Rainy</option>
              <option value="cloudy">Cloudy</option>
              <option value="snowy">Snowy</option>
            </select>
            <span className="pill">{moodForWeather[weather]} vibes</span>
          </div>
          <div className="chip-row">
            {weatherRecommendation.map(song => (
              <button key={song.id} className="chip" onClick={() => onPlaySong(song.id)}>
                {song.title}
              </button>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-label">Activity-based</div>
          <div className="control-row">
            <select value={activity} onChange={e => setActivity(e.target.value)}>
              <option value="chill">Chill</option>
              <option value="study">Study</option>
              <option value="workout">Workout</option>
              <option value="commute">Commute</option>
            </select>
            <span className="pill">{moodForActivity[activity]} mode</span>
          </div>
          <div className="chip-row">
            {activityRecommendation.map(song => (
              <button key={song.id} className="chip" onClick={() => onPlaySong(song.id)}>
                {song.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
