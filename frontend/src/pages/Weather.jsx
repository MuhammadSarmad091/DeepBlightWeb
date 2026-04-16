import { useCallback, useEffect, useRef, useState } from 'react'
import { MapPin, Search, CloudSun, Droplets, Wind, ThermometerSun } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../api/client'
import { Card, Button, Input, Alert } from '../components/ui'

const LS_LOC = 'deepblight_weather_location'

export default function Weather() {
  const { token } = useAuth()
  const [location, setLocation] = useState(() => localStorage.getItem(LS_LOC) || '')
  const [draft, setDraft] = useState(() => localStorage.getItem(LS_LOC) || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [current, setCurrent] = useState(null)
  const [weekly, setWeekly] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const geoAttempted = useRef(false)

  const fetchWeatherRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(LS_LOC, location)
  }, [location])

  useEffect(() => {
    if (geoAttempted.current) return
    geoAttempted.current = true

    const stored = localStorage.getItem(LS_LOC)
    if (stored) {
      if (fetchWeatherRef.current) fetchWeatherRef.current(stored)
      return
    }

    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const label = `${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`
        setDraft(label)
        if (fetchWeatherRef.current) fetchWeatherRef.current(label)
      },
      () => {}
    )
  }, [])

  async function loadSuggestions(q) {
    const t = q.trim()
    if (t.length < 2) {
      setSuggestions([])
      return
    }
    setSuggestLoading(true)
    const { ok, data } = await apiFetch('/weather/search', { token, query: { query: t } })
    setSuggestLoading(false)
    if (!ok || !data?.results) {
      setSuggestions([])
      return
    }
    setSuggestions(Array.isArray(data.results) ? data.results : [])
  }

  fetchWeatherRef.current = fetchWeather

  async function fetchWeather(loc) {
    const q = loc.trim()
    if (!q) {
      setError('Enter a city, postal code, or coordinates (lat,lon).')
      return
    }
    setLoading(true)
    setError('')
    setCurrent(null)
    setWeekly(null)

    const [curRes, weekRes] = await Promise.all([
      apiFetch('/weather/current', { token, query: { location: q, aqi: 'yes' } }),
      apiFetch('/weather/weekly', { token, query: { location: q } }),
    ])

    setLoading(false)

    const errs = []
    if (!curRes.ok) {
      if (curRes.status === 404) errs.push(`Current: ${curRes.data?.error || 'Location not found.'}`)
      else if (curRes.status === 500) errs.push(`Current: ${curRes.data?.error || 'Weather service unavailable.'}`)
      else errs.push(`Current: ${curRes.errorMessage || 'Could not load.'}`)
    } else {
      setCurrent(curRes.data)
    }

    if (!weekRes.ok) {
      if (weekRes.status === 404) errs.push(`Forecast: ${weekRes.data?.error || 'Location not found.'}`)
      else if (weekRes.status === 500) errs.push(`Forecast: ${weekRes.data?.error || 'Forecast unavailable.'}`)
      else errs.push(`Forecast: ${weekRes.errorMessage || 'Could not load.'}`)
    } else {
      setWeekly(weekRes.data)
    }

    if (errs.length === 2) {
      setError(errs.join(' '))
      setCurrent(null)
      setWeekly(null)
    } else if (errs.length === 1) {
      setError(errs[0])
    }
    setLocation(q)
    setDraft(q)
  }

  function handleSubmit(ev) {
    ev.preventDefault()
    setSuggestions([])
    fetchWeather(draft)
  }

  function pickSuggestion(s) {
    const label = s.name && s.country ? `${s.name}, ${s.country}` : s.url || s.name || ''
    setDraft(label)
    setSuggestions([])
    fetchWeather(label)
  }

  const locName = current?.location?.name || weekly?.location?.name
  const region = current?.location?.region || weekly?.location?.region
  const country = current?.location?.country || weekly?.location?.country

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Weather</h1>
          <p className="page-subtitle">Current conditions and a seven-day outlook for your farm or trial site.</p>
        </div>
      </header>

      <Card>
        <form className="weather-form" onSubmit={handleSubmit}>
          <div className="weather-loc-wrap">
            <Input
              label="Location"
              placeholder="City, postcode, or lat,lon"
              value={draft}
              onChange={(e) => {
                const v = e.target.value
                setDraft(v)
                loadSuggestions(v)
              }}
            />
            {suggestions.length > 0 && (
              <ul className="suggest-list">
                {suggestLoading && <li className="suggest-item muted">Searching…</li>}
                {suggestions.slice(0, 8).map((s, i) => (
                  <li key={`${s.id}-${i}`}>
                    <button type="button" className="suggest-item" onClick={() => pickSuggestion(s)}>
                      <MapPin size={14} /> {s.name}
                      {s.region ? `, ${s.region}` : ''} · {s.country}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button type="submit" disabled={loading}>
            <Search size={18} /> Get forecast
          </Button>
        </form>
      </Card>

      {error && <Alert type="error">{error}</Alert>}

      {loading && <p className="muted center">Fetching weather…</p>}

      {current?.current && (
        <Card title="Current conditions" className="weather-current-card">
          <div className="weather-loc-line">
            <MapPin size={18} />
            <span>
              {locName}
              {region ? `, ${region}` : ''}
              {country ? ` · ${country}` : ''}
            </span>
          </div>
          <div className="weather-now">
            {current.current.condition?.icon && (
              <img className="weather-icon" src={`https:${current.current.condition.icon}`} alt="" />
            )}
            <div className="weather-temp-main">{current.current.temp_c}°C</div>
            <div className="weather-feels">
              Feels {current.current.feelslike_c}°C · {current.current.condition?.text}
            </div>
          </div>
          <div className="weather-stats">
            <div className="weather-stat">
              <Droplets size={18} />
              <span>Humidity {current.current.humidity}%</span>
            </div>
            <div className="weather-stat">
              <Wind size={18} />
              <span>Wind {current.current.wind_kph} km/h</span>
            </div>
            <div className="weather-stat">
              <ThermometerSun size={18} />
              <span>UV {current.current.uv ?? '—'}</span>
            </div>
            <div className="weather-stat">
              <CloudSun size={18} />
              <span>Precip {current.current.precip_mm} mm</span>
            </div>
          </div>
        </Card>
      )}

      {weekly?.forecast_days?.length > 0 && (
        <>
          <h2 className="section-title">7-day outlook</h2>
          <div className="forecast-grid">
            {weekly.forecast_days.map((d) => (
              <div key={d.date} className="forecast-day">
                <div className="forecast-dow">{d.day_of_week}</div>
                <div className="forecast-date">{d.date}</div>
                <div className="forecast-temps">
                  <span className="hi">{d.maxtemp_c}°</span>
                  <span className="lo">{d.mintemp_c}°</span>
                </div>
                <div className="forecast-cond">{d.condition}</div>
                <div className="forecast-rain">Rain {d.chance_of_rain ?? 0}%</div>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && !error && !current && !weekly && location && (
        <p className="muted center">Enter a location above to load weather.</p>
      )}
    </div>
  )
}
