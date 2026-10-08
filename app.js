const $ = id => document.getElementById(id);

const STORAGE_KEY = 'calendar-builder-v6';
const ICON = name => `<i class="fa-solid fa-${name}" aria-hidden="true"></i>`;

const PAPER_SIZES = {
  A5: [148, 210],
  A4: [210, 297],
  A3: [297, 420],
  A2: [420, 594],
  A1: [594, 841],
  Letter: [216, 279],
  Legal: [216, 356]
};

const SETTINGS_FIELDS = [
  'viewMode', 'startDate', 'daysCount', 'multiColumns', 'periodCount',
  'dayStartHour', 'dayEndHour', 'weekStartSelect', 'calendarLocale',
  'dateOrder', 'paper', 'orientation', 'margin', 'gap', 'titleGap',
  'dayStyle', 'titleSize', 'dateSize', 'fontSize', 'radius', 'showMonthName',
  'showWeekdays', 'showWeekNumbers', 'showHolidays', 'showHolidayList',
  'showSchoolHolidays', 'showMoon', 'shadeWeekends', 'showOutsideMonth',
  'showNotes', 'holidayCountry', 'textColor', 'borderColor', 'weekendColor',
  'borderWidth', 'borderStyle', 'fontFamily', 'titleAlign'
];

const FIXED_HOLIDAYS = {
  DK: [[1, 1, 'Nytårsdag'], [12, 25, 'Juledag'], [12, 26, '2. juledag']],
  SE: [[1, 1, 'Nyårsdagen'], [1, 6, 'Trettondedag jul'], [6, 6, 'Nationaldagen'], [12, 25, 'Juldagen'], [12, 26, 'Annandag jul']],
  NO: [[1, 1, 'Første nyttårsdag'], [5, 1, 'Arbeidernes dag'], [5, 17, 'Grunnlovsdagen'], [12, 25, 'Første juledag'], [12, 26, 'Andre juledag']],
  DE: [[1, 1, 'Neujahrstag'], [10, 3, 'Tag der Deutschen Einheit'], [12, 25, '1. Weihnachtstag'], [12, 26, '2. Weihnachtstag']],
  NL: [[1, 1, 'Nieuwjaarsdag'], [4, 27, 'Koningsdag'], [12, 25, 'Eerste kerstdag'], [12, 26, 'Tweede kerstdag']],
  FR: [[1, 1, 'Jour de l’an'], [5, 1, 'Fête du Travail'], [5, 8, 'Victoire 1945'], [7, 14, 'Fête nationale'], [8, 15, 'Assomption'], [11, 1, 'Toussaint'], [11, 11, 'Armistice'], [12, 25, 'Noël']],
  ES: [[1, 1, 'Año Nuevo'], [1, 6, 'Epifanía'], [5, 1, 'Día del Trabajo'], [8, 15, 'Asunción'], [10, 12, 'Fiesta Nacional'], [11, 1, 'Todos los Santos'], [12, 6, 'Día de la Constitución'], [12, 8, 'Inmaculada Concepción'], [12, 25, 'Navidad']],
  IT: [[1, 1, 'Capodanno'], [1, 6, 'Epifania'], [4, 25, 'Festa della Liberazione'], [5, 1, 'Festa dei Lavoratori'], [6, 2, 'Festa della Repubblica'], [8, 15, 'Ferragosto'], [11, 1, 'Ognissanti'], [12, 8, 'Immacolata Concezione'], [12, 25, 'Natale'], [12, 26, 'Santo Stefano']],
  GB: [[1, 1, 'New Year’s Day'], [12, 25, 'Christmas Day'], [12, 26, 'Boxing Day']],
  US: [[1, 1, 'New Year’s Day'], [6, 19, 'Juneteenth'], [7, 4, 'Independence Day'], [11, 11, 'Veterans Day'], [12, 25, 'Christmas Day']],
  FI: [[1, 1, 'Uudenvuodenpäivä'], [1, 6, 'Loppiainen'], [5, 1, 'Vappu'], [12, 6, 'Itsenäisyyspäivä'], [12, 25, 'Joulupäivä'], [12, 26, 'Tapaninpäivä']]
};

const EASTER_HOLIDAYS = {
  DK: [[-3, 'Skærtorsdag'], [-2, 'Langfredag'], [1, '2. påskedag'], [39, 'Kristi himmelfartsdag'], [50, '2. pinsedag']],
  SE: [[-2, 'Långfredagen'], [1, 'Annandag påsk'], [39, 'Kristi himmelsfärdsdag']],
  NO: [[-3, 'Skjærtorsdag'], [-2, 'Langfredag'], [1, 'Andre påskedag'], [39, 'Kristi himmelfartsdag'], [50, 'Andre pinsedag']],
  DE: [[-2, 'Karfreitag'], [1, 'Ostermontag'], [39, 'Christi Himmelfahrt'], [50, 'Pfingstmontag']],
  NL: [[-2, 'Goede Vrijdag'], [1, 'Paasmaandag'], [39, 'Hemelvaartsdag'], [50, 'Tweede pinksterdag']],
  FR: [[1, 'Lundi de Pâques'], [39, 'Ascension'], [50, 'Lundi de Pentecôte']],
  ES: [[1, 'Lunes de Pascua']],
  IT: [[1, 'Lunedì dell’Angelo']],
  GB: [[-2, 'Good Friday'], [1, 'Easter Monday']],
  FI: [[-2, 'Pitkäperjantai'], [1, '2. pääsiäispäivä'], [39, 'Helatorstai']]
};

const state = {
  editing: true,
  page: 0,
  events: [],
  drag: null,
  columns: {
    month: Array(7).fill(1),
    week: Array(7).fill(1),
    multi: Array(2).fill(1),
    year: Array(3).fill(1)
  },
  rows: {
    month: Array(6).fill(1),
    multi: Array(2).fill(1),
    year: Array(4).fill(1)
  }
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const number = (id, fallback) => Number.isFinite(Number($(id)?.value)) ? Number($(id).value) : fallback;
const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

function parseDate(value) {
  const result = new Date(`${value}T12:00:00`);
  return Number.isNaN(result.getTime()) ? null : result;
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isWeekend(date) {
  return date.getDay() === 0 || date.getDay() === 6;
}

function capitalize(value, locale) {
  const text = String(value);
  return text ? text.charAt(0).toLocaleUpperCase(locale) + text.slice(1) : text;
}

function easterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day, 12);
}

function holidayMap(year) {
  const country = $('holidayCountry').value;
  const holidays = {};

  if (country !== 'none') {
    (FIXED_HOLIDAYS[country] || []).forEach(([month, day, name]) => {
      holidays[dateKey(new Date(year, month - 1, day, 12))] = name;
    });

    const easter = easterDate(year);
    (EASTER_HOLIDAYS[country] || []).forEach(([offset, name]) => {
      holidays[dateKey(addDays(easter, offset))] = name;
    });
  }

  state.events.forEach(event => {
    if (event.date && event.text) holidays[event.date] = event.text;
  });

  return holidays;
}

function schoolHolidayMap(year) {
  if (!$('showSchoolHolidays').checked) return {};

  const country = $('holidayCountry').value;
  const holidays = {};
  const addRange = (from, to, name) => {
    for (let date = new Date(from); date <= to; date = addDays(date, 1)) {
      holidays[dateKey(date)] = name;
    }
  };

  if (country === 'DK') {
    const easter = easterDate(year);
    addRange(addDays(easter, -3), addDays(easter, 1), 'Påskeferie');
    addRange(new Date(year, 5, 28, 12), new Date(year, 7, 10, 12), 'Sommerferie');
    addRange(new Date(year, 9, 17, 12), new Date(year, 9, 24, 12), 'Efterårsferie');
    addRange(new Date(year, 11, 23, 12), new Date(year + 1, 0, 2, 12), 'Juleferie');
  }

  if (country === 'SE') {
    addRange(new Date(year, 5, 15, 12), new Date(year, 7, 15, 12), 'Sommarlov');
    addRange(new Date(year, 11, 20, 12), new Date(year + 1, 0, 7, 12), 'Jullov');
  }

  if (country === 'NO') {
    addRange(new Date(year, 5, 20, 12), new Date(year, 7, 15, 12), 'Sommerferie');
    addRange(new Date(year, 11, 20, 12), new Date(year + 1, 0, 3, 12), 'Juleferie');
  }

  return holidays;
}

function getSettings() {
  const view = $('viewMode').value;

  return {
    view,
    date: parseDate($('startDate').value) || new Date(2026, 9, 8, 12),
    locale: $('calendarLocale').value,
    weekStart: Number($('weekStartSelect').value),
    periods: view === 'month' || view === 'week' ? clamp(Math.round(number('periodCount', 1)), 1, 24) : 1,
    days: clamp(Math.round(number('daysCount', 4)), 2, 31),
    multiColumns: clamp(Math.round(number('multiColumns', 2)), 1, 7),
    dayStart: clamp(Math.round(number('dayStartHour', 7)), 0, 23),
    dayEnd: clamp(Math.round(number('dayEndHour', 18)), 1, 24),
    showMonthName: $('showMonthName').checked,
    showWeekdays: $('showWeekdays').checked,
    showWeekNumbers: $('showWeekNumbers').checked,
    showHolidays: $('showHolidays').checked,
    showHolidayList: $('showHolidayList').checked,
    showSchoolHolidays: $('showSchoolHolidays').checked,
    showMoon: $('showMoon').checked,
    shadeWeekends: $('shadeWeekends').checked,
    showOutsideMonth: $('showOutsideMonth').checked,
    showNotes: $('showNotes').checked
  };
}

function paperSize() {
  let [width, height] = PAPER_SIZES[$('paper').value] || PAPER_SIZES.A3;
  const landscape = $('orientation').value === 'landscape';

  if (landscape && height > width) [width, height] = [height, width];
  if (!landscape && width > height) [width, height] = [height, width];

  return { width, height };
}

function weekdayNames(settings) {
  const base = new Date(2024, 0, 7, 12);
  const names = Array.from({ length: 7 }, (_, index) => {
    const name = new Intl.DateTimeFormat(settings.locale, { weekday: 'long' }).format(addDays(base, index));
    return capitalize(name, settings.locale);
  });

  return [...names.slice(settings.weekStart), ...names.slice(0, settings.weekStart)];
}

function monthTitle(date, locale) {
  return capitalize(new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date), locale);
}

function formatDate(date, settings) {
  if ($('dateOrder').value === 'locale') {
    return capitalize(new Intl.DateTimeFormat(settings.locale, { dateStyle: 'short' }).format(date), settings.locale);
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const order = $('dateOrder').value;

  if (order === 'mdy') return `${month} / ${day} / ${year}`;
  if (order === 'ymd') return `${year} / ${month} / ${day}`;
  return `${day} / ${month} / ${year}`;
}

function weekNumber(date) {
  const current = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const weekday = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - weekday);
  return Math.ceil((((current - new Date(Date.UTC(current.getUTCFullYear(), 0, 1))) / 86400000) + 1) / 7);
}

function moonIcon() {
  return ICON('moon');
}

function moonPhase(date) {
  const phase = (((
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(2000, 0, 6, 18, 14)) / 86400000
  ) % 29.5306) + 29.5306) % 29.5306;

  return phase < 1.5 || phase > 28 ? 'new' : phase < 6 ? 'waxing-crescent' : phase < 8.5 ? 'first-quarter' : phase < 13 ? 'waxing-gibbous' : phase < 15.5 ? 'full' : phase < 21 ? 'waning-gibbous' : phase < 23.5 ? 'last-quarter' : 'waning-crescent';
}

function periodDates(settings) {
  if (settings.view === 'month') {
    return Array.from({ length: settings.periods }, (_, index) => new Date(settings.date.getFullYear(), settings.date.getMonth() + index, 1, 12));
  }

  if (settings.view === 'week') {
    const start = addDays(settings.date, -((settings.date.getDay() - settings.weekStart + 7) % 7));
    return Array.from({ length: settings.periods }, (_, index) => addDays(start, index * 7));
  }

  return [settings.date];
}

function ensureSize(values, length) {
  const result = [...values];
  while (result.length < length) result.push(1);
  return result.slice(0, length);
}

function dayCell(date, settings, holidays, schoolHolidays, outsideMonth = false) {
  const classes = ['day-cell', $('dayStyle').value];
  const holiday = holidays[dateKey(date)];
  const schoolHoliday = schoolHolidays[dateKey(date)];

  if (outsideMonth) classes.push('outside');
  if (settings.shadeWeekends && isWeekend(date)) classes.push('weekend');

  let html = `<div class="${classes.join(' ')}">`;
  html += `<div class="day-num">${date.getDate()}</div>`;

  if (settings.showWeekdays) {
    const weekday = new Intl.DateTimeFormat(settings.locale, { weekday: 'long' }).format(date);
    html += `<div class="day-name">${escapeHtml(capitalize(weekday, settings.locale))}</div>`;
  }

  if (settings.showWeekNumbers && date.getDay() === settings.weekStart) {
    html += `<div class="weeknum">Uge ${weekNumber(date)}</div>`;
  }

  if (settings.showHolidays && holiday) html += `<div class="holiday">${escapeHtml(holiday)}</div>`;
  if (settings.showSchoolHolidays && schoolHoliday && schoolHoliday !== holiday) {
    html += `<div class="school-holiday">${escapeHtml(schoolHoliday)}</div>`;
  }
  if (settings.showMoon) html += `<div class="moon" title="${moonPhase(date)}">${moonIcon()}</div>`;
  if (settings.showNotes) html += '<div class="notes-line"></div>';

  return `${html}</div>`;
}

function renderMonth(settings, date, holidays, schoolHolidays) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  const offset = (first.getDay() - settings.weekStart + 7) % 7;
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7;
  const rows = cellCount / 7;

  state.rows.month = ensureSize(state.rows.month, rows);

  let html = '';
  if (settings.showWeekdays) {
    weekdayNames(settings).forEach(name => {
      html += `<div class="weekday">${escapeHtml(name)}</div>`;
    });
  }

  for (let index = 0; index < cellCount; index++) {
    const current = addDays(first, index - offset);
    const outside = current.getMonth() !== date.getMonth();

    html += outside && !settings.showOutsideMonth
      ? '<div class="day-cell minimal outside"></div>'
      : dayCell(current, settings, holidays, schoolHolidays, outside);
  }

  const rowTemplate = state.rows.month.slice(0, rows).map(value => `${value}fr`).join(' ');
  const rowsTemplate = settings.showWeekdays ? `auto ${rowTemplate}` : rowTemplate;

  return `<div class="month-grid ${settings.showWeekdays ? 'has-weekdays' : ''}" data-key="month" data-rows="${rows}" style="grid-template-columns:${state.columns.month.map(value => `${value}fr`).join(' ')};grid-template-rows:${rowsTemplate}">${html}</div>`;
}

function renderWeek(settings, date, holidays, schoolHolidays) {
  const start = addDays(date, -((date.getDay() - settings.weekStart + 7) % 7));
  const days = Array.from({ length: 7 }, (_, index) => renderWeekDay(addDays(start, index), settings, holidays, schoolHolidays)).join('');

  return `<div class="week-view" data-key="week" style="grid-template-columns:${state.columns.week.map(value => `${value}fr`).join(' ')}">${days}</div>`;
}

function renderWeekDay(date, settings, holidays, schoolHolidays) {
  const classes = ['week-day'];
  const holiday = holidays[dateKey(date)];
  const schoolHoliday = schoolHolidays[dateKey(date)];

  if (settings.shadeWeekends && isWeekend(date)) classes.push('weekend');

  const longDate = new Intl.DateTimeFormat(settings.locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(date);

  let html = `<div class="${classes.join(' ')}"><div class="day-num">${date.getDate()}</div>`;
  html += `<div class="day-name">${escapeHtml(capitalize(longDate, settings.locale))}</div>`;
  if (settings.showHolidays && holiday) html += `<div class="holiday">${escapeHtml(holiday)}</div>`;
  if (settings.showSchoolHolidays && schoolHoliday) html += `<div class="school-holiday">${escapeHtml(schoolHoliday)}</div>`;
  if (settings.showMoon) html += `<div class="moon" title="${moonPhase(date)}">${moonIcon()}</div>`;
  if (settings.showNotes) html += '<div class="notes-line"></div>';

  return `${html}</div>`;
}

function renderMultiDay(settings, date, holidays, schoolHolidays) {
  const rows = Math.ceil(settings.days / settings.multiColumns);
  state.columns.multi = ensureSize(state.columns.multi, settings.multiColumns);
  state.rows.multi = ensureSize(state.rows.multi, rows);

  let html = '';

  for (let index = 0; index < settings.days; index++) {
    const current = addDays(date, index);
    const holiday = holidays[dateKey(current)];
    const schoolHoliday = schoolHolidays[dateKey(current)];
    const classes = ['day-cell', $('dayStyle').value];

    if (settings.shadeWeekends && isWeekend(current)) classes.push('weekend');

    const longDate = new Intl.DateTimeFormat(settings.locale, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(current);

    html += `<div class="${classes.join(' ')}">`;
    html += `<div class="day-num">${current.getDate()}</div>`;
    html += `<div class="day-name">${escapeHtml(capitalize(longDate, settings.locale))}</div>`;
    if (settings.showWeekNumbers) html += `<div class="weeknum">Uge ${weekNumber(current)}</div>`;
    if (settings.showHolidays && holiday) html += `<div class="holiday">${escapeHtml(holiday)}</div>`;
    if (settings.showSchoolHolidays && schoolHoliday) html += `<div class="school-holiday">${escapeHtml(schoolHoliday)}</div>`;
    if (settings.showMoon) html += `<div class="moon" title="${moonPhase(current)}">${moonIcon()}</div>`;
    if (settings.showNotes) html += '<div class="notes-line"></div>';
    html += '</div>';
  }

  return `<div class="multi-grid" data-key="multi" data-rows="${rows}" style="grid-template-columns:${state.columns.multi.map(value => `${value}fr`).join(' ')};grid-template-rows:${state.rows.multi.slice(0, rows).map(value => `${value}fr`).join(' ')}">${html}</div>`;
}

function renderDay(settings, date, holidays, schoolHolidays) {
  const holiday = holidays[dateKey(date)];
  const schoolHoliday = schoolHolidays[dateKey(date)];
  const longDate = new Intl.DateTimeFormat(settings.locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(date);

  let html = '<div class="single-day">';
  html += '<div class="single-header">';
  html += `<div class="day-num">${date.getDate()}</div>`;
  html += `<div class="day-name">${escapeHtml(capitalize(longDate, settings.locale))}</div>`;
  html += `<div class="date-subtitle">${escapeHtml(formatDate(date, settings))}</div>`;
  if (settings.showHolidays && holiday) html += `<div class="holiday">${escapeHtml(holiday)}</div>`;
  if (settings.showSchoolHolidays && schoolHoliday) html += `<div class="school-holiday">${escapeHtml(schoolHoliday)}</div>`;
  html += '</div><div class="time-grid">';

  const start = Math.min(settings.dayStart, Math.max(0, settings.dayEnd - 1));
  const end = Math.max(start + 1, settings.dayEnd);

  for (let hour = start; hour < end; hour++) {
    html += `<div class="time-slot"><div class="time-label">${String(hour).padStart(2, '0')}:00</div><div class="time-line"></div></div>`;
  }

  return `${html}</div></div>`;
}

function renderYear(settings, date, holidays) {
  const year = date.getFullYear();
  state.columns.year = ensureSize(state.columns.year, 3);
  state.rows.year = ensureSize(state.rows.year, 4);

  let html = '';

  for (let month = 0; month < 12; month++) {
    const first = new Date(year, month, 1, 12);
    const offset = (first.getDay() - settings.weekStart + 7) % 7;
    const title = capitalize(new Intl.DateTimeFormat(settings.locale, { month: 'long' }).format(first), settings.locale);

    html += `<div class="mini-month"><div class="mini-title">${escapeHtml(title)}</div>`;
    html += `<div class="mini-head">${weekdayNames(settings).map(name => `<div>${escapeHtml(name)}</div>`).join('')}</div>`;
    html += '<div class="mini-days">';

    for (let index = 0; index < 42; index++) {
      const current = addDays(first, index - offset);
      const classes = ['mini-day'];
      const holiday = holidays[dateKey(current)];

      if (current.getMonth() !== month) classes.push('outside');
      if (settings.shadeWeekends && isWeekend(current)) classes.push('weekend');
      if (holiday && settings.showHolidays) classes.push('holiday');

      html += `<div class="${classes.join(' ')}">${current.getDate()}</div>`;
    }

    html += '</div></div>';
  }

  return `<div class="year-grid" data-key="year" data-rows="4" style="grid-template-columns:${state.columns.year.map(value => `${value}fr`).join(' ')};grid-template-rows:${state.rows.year.map(value => `${value}fr`).join(' ')}">${html}</div>`;
}

function renderContent(settings, date, holidays, schoolHolidays) {
  switch (settings.view) {
    case 'day': return renderDay(settings, date, holidays, schoolHolidays);
    case 'multi': return renderMultiDay(settings, date, holidays, schoolHolidays);
    case 'week': return renderWeek(settings, date, holidays, schoolHolidays);
    case 'year': return renderYear(settings, date, holidays);
    default: return renderMonth(settings, date, holidays, schoolHolidays);
  }
}

function renderHolidayList(settings, date, holidays) {
  if (!settings.showHolidayList) return '';

  const items = Object.entries(holidays)
    .filter(([key]) => key.startsWith(`${date.getFullYear()}-`))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, name]) => `${escapeHtml(new Intl.DateTimeFormat(settings.locale, { day: 'numeric', month: 'short' }).format(parseDate(key)))}: ${escapeHtml(name)}`);

  return items.length ? `<div class="holiday-list">${items.join(' · ')}</div>` : '';
}

function paperMarkup(settings, date, includeOverlay = true) {
  const holidays = holidayMap(date.getFullYear());
  const schoolHolidays = schoolHolidayMap(date.getFullYear());
  const title = settings.showMonthName ? monthTitle(date, settings.locale) : '';
  const overlay = includeOverlay ? '<div class="layout-overlay"></div>' : '';

  return `
    <div class="calendar-root ${includeOverlay && state.editing ? 'layout-editing' : ''}">
      ${title ? `<div class="cal-title">${escapeHtml(title)}</div>` : ''}
      <div class="calendar-content">
        ${renderContent(settings, date, holidays, schoolHolidays)}
        ${overlay}
      </div>
      ${renderHolidayList(settings, date, holidays)}
    </div>
  `;
}

function applyPaperVariables() {
  const preview = $('paperPreview');
  const size = paperSize();

  preview.style.width = `${size.width}mm`;
  preview.style.height = `${size.height}mm`;

  const values = {
    '--margin': `${number('margin', 10)}mm`,
    '--gap': `${number('gap', 2)}mm`,
    '--title-gap': `${number('titleGap', 5)}mm`,
    '--font-size': `${number('fontSize', 10)}pt`,
    '--date-size': `${number('dateSize', 13)}pt`,
    '--title-size': `${number('titleSize', 22)}pt`,
    '--radius': `${number('radius', 0)}mm`,
    '--border-width': `${number('borderWidth', .3)}mm`,
    '--border-style': $('borderStyle').value,
    '--border-color': $('borderColor').value,
    '--weekend-color': $('weekendColor').value,
    '--text-color': $('textColor').value,
    '--title-align': $('titleAlign').value,
    '--font-family': getFontFamily()
  };

  Object.entries(values).forEach(([property, value]) => preview.style.setProperty(property, value));
  $('sizeLabel').textContent = `${$('paper').value} · ${size.width} × ${size.height} mm`;
  $('paperSizeReadout').textContent = `${size.width} × ${size.height} mm`;
}


function getFontFamily() {
  const family = $('fontFamily').value;
  if (family === 'serif') return 'Georgia, serif';
  if (family === 'mono') return 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  return 'Inter, ui-sans-serif, system-ui, sans-serif';
}

function updateModeOptions() {
  const view = $('viewMode').value;
  const multiplePeriods = view === 'month' || view === 'week';

  $('multiOptions').hidden = view !== 'multi';
  $('dayOptions').hidden = view !== 'day';
  $('periodOptions').hidden = !multiplePeriods;
  $('periodOptionsTitle').textContent = view === 'week' ? 'Flere uger' : 'Flere måneder';
  $('periodControls').hidden = !multiplePeriods || Number($('periodCount').value || 1) <= 1;
}

function normalizeWeights() {
  const defaults = {
    month: 7,
    week: 7,
    multi: Math.max(1, Math.min(7, Math.round(number('multiColumns', 2)))),
    year: 3
  };

  Object.entries(defaults).forEach(([key, length]) => {
    const values = Array.isArray(state.columns[key])
      ? state.columns[key].map(Number).filter(Number.isFinite).filter(value => value > 0)
      : [];

    state.columns[key] = Array.from({ length }, (_, index) => values[index] || 1);
  });

  const rowDefaults = {
    month: 6,
    multi: Math.max(1, Math.ceil(number('daysCount', 4) / Math.max(1, number('multiColumns', 2)))),
    year: 4
  };

  Object.entries(rowDefaults).forEach(([key, length]) => {
    const values = Array.isArray(state.rows[key])
      ? state.rows[key].map(Number).filter(Number.isFinite).filter(value => value > 0)
      : [];

    state.rows[key] = Array.from({ length }, (_, index) => values[index] || 1);
  });
}

function renderFallback(settings, error) {
  console.error('Kalender preview kunne ikke renderes:', error);

  const preview = $('paperPreview');
  if (!preview) return;

  const date = settings.date;
  const holidays = holidayMap(date.getFullYear());
  const schoolHolidays = schoolHolidayMap(date.getFullYear());

  preview.innerHTML = `
    <div class="calendar-root">
      ${settings.showMonthName ? `<div class="cal-title">${escapeHtml(monthTitle(date, settings.locale))}</div>` : ''}
      <div class="calendar-content">
        ${renderMonth(settings, date, holidays, schoolHolidays)}
      </div>
    </div>
  `;

  applyPaperVariables();
  updatePrintStyle();
}

function render() {
  try {
    updateModeOptions();
    normalizeWeights();

    const settings = getSettings();
    const dates = periodDates(settings);

    state.page = clamp(
      state.page,
      0,
      dates.length - 1
    );

    applyPaperVariables();

    $('paperPreview').innerHTML = paperMarkup(
      settings,
      dates[state.page]
    );

    $('periodLabel').textContent = `${state.page + 1} / ${dates.length}`;
    $('periodPrev').disabled = state.page === 0;
    $('periodNext').disabled = state.page === dates.length - 1;

    updatePrintStyle();
    buildLayoutHandles();
    fitPaperToStage();
    requestAnimationFrame(fitPaperToStage);
    saveSettings();
  } catch (error) {
    renderFallback(getSettings(), error);
  }
}
function fitPaperToStage() {
  const stage = $('previewStage');
  const wrap = stage?.querySelector('.paper-wrap');
  const paper = $('paperPreview');
  if (!stage || !wrap || !paper) return;

  const stageStyle = getComputedStyle(stage);
  const paddingX = parseFloat(stageStyle.paddingLeft || 0) + parseFloat(stageStyle.paddingRight || 0);
  const paddingY = parseFloat(stageStyle.paddingTop || 0) + parseFloat(stageStyle.paddingBottom || 0);
  const availableWidth = Math.max(1, stage.clientWidth - paddingX);
  const availableHeight = Math.max(1, stage.clientHeight - paddingY);

  const nativeWidth = paper.offsetWidth;
  const nativeHeight = paper.offsetHeight;
  if (!nativeWidth || !nativeHeight) return;

  const scale = Math.min(1, availableWidth / nativeWidth, availableHeight / nativeHeight);

  wrap.style.width = `${nativeWidth * scale}px`;
  wrap.style.height = `${nativeHeight * scale}px`;
  paper.style.transform = `scale(${scale})`;
  paper.dataset.fitScale = scale.toFixed(4);
}

function buildLayoutHandles() {
  const content = document.querySelector('.calendar-content');
  const grid = content?.querySelector('[data-key]');
  const overlay = content?.querySelector('.layout-overlay');

  if (!grid || !overlay || !state.editing) return;

  overlay.innerHTML = '';
  addColumnHandles(grid, overlay);
  addRowHandles(grid, overlay);
  addTitleHandle(overlay);
}

function addColumnHandles(grid, overlay) {
  const key = grid.dataset.key;
  const settings = getSettings();
  const count = key === 'year' ? 3 : key === 'multi' ? settings.multiColumns : 7;
  const cells = Array.from(grid.children).slice(0, count);
  const gridRect = grid.getBoundingClientRect();
  if (!gridRect.width || !gridRect.height) return;

  cells.slice(0, -1).forEach((cell, index) => {
    const next = cells[index + 1];
    const firstRect = cell.getBoundingClientRect();
    const nextRect = next.getBoundingClientRect();
    const handle = document.createElement('div');

    handle.className = 'column-handle';
    handle.style.left = `${((firstRect.right + nextRect.left) / 2) - gridRect.left}px`;
    handle.dataset.index = index;
    handle.addEventListener('pointerdown', startColumnDrag);
    handle.addEventListener('dblclick', resetColumn);
    overlay.appendChild(handle);
  });
}

function getRowGroups(grid) {
  const groups = [];
  let current = [];
  let previousTop = null;

  Array.from(grid.children).forEach(element => {
    const top = element.getBoundingClientRect().top;

    if (previousTop === null || Math.abs(top - previousTop) < 2) {
      current.push(element);
    } else {
      groups.push(current);
      current = [element];
    }

    previousTop = top;
  });

  if (current.length) groups.push(current);
  return groups;
}

function addRowHandles(grid, overlay) {
  const key = grid.dataset.key;
  if (key === 'week' || key === 'day') return;

  const groups = getRowGroups(grid);
  const rows = key === 'month' && $('showWeekdays').checked ? groups.slice(1) : groups;
  const gridRect = grid.getBoundingClientRect();

  rows.slice(0, -1).forEach((row, index) => {
    const current = row[0].getBoundingClientRect();
    const next = rows[index + 1][0].getBoundingClientRect();
    const handle = document.createElement('div');

    handle.className = 'row-handle';
    handle.style.top = `${((current.bottom + next.top) / 2) - gridRect.top}px`;
    handle.dataset.index = index;
    handle.addEventListener('pointerdown', startRowDrag);
    handle.addEventListener('dblclick', resetRow);
    overlay.appendChild(handle);
  });
}

function addTitleHandle(overlay) {
  if (!$('showMonthName').checked) return;

  const handle = document.createElement('div');
  handle.className = 'title-gap-handle';
  handle.innerHTML = ICON('up-down');
  handle.addEventListener('pointerdown', startTitleDrag);
  overlay.appendChild(handle);
}

function startColumnDrag(event) {
  event.preventDefault();

  const grid = document.querySelector('[data-key]');
  const key = grid.dataset.key;
  const settings = getSettings();
  const index = Number(event.currentTarget.dataset.index);
  const count = key === 'year' ? 3 : key === 'multi' ? settings.multiColumns : 7;
  const cells = Array.from(grid.children).slice(0, count);
  const first = cells[index]?.getBoundingClientRect();
  const second = cells[index + 1]?.getBoundingClientRect();

  if (!first || !second) return;

  state.drag = {
    type: 'column',
    key,
    index,
    startX: event.clientX,
    firstSize: first.width,
    secondSize: second.width,
    total: state.columns[key][index] + state.columns[key][index + 1]
  };

  window.addEventListener('pointermove', moveColumnDrag);
  window.addEventListener('pointerup', endDrag, { once: true });
}

function moveColumnDrag(event) {
  const drag = state.drag;
  if (!drag) return;

  const firstSize = clamp(drag.firstSize + event.clientX - drag.startX, 28, drag.firstSize + drag.secondSize - 28);
  const ratio = firstSize / (drag.firstSize + drag.secondSize);

  state.columns[drag.key][drag.index] = drag.total * ratio;
  state.columns[drag.key][drag.index + 1] = drag.total * (1 - ratio);

  const grid = document.querySelector(`[data-key="${drag.key}"]`);
  grid.style.gridTemplateColumns = state.columns[drag.key].map(value => `${value}fr`).join(' ');

  buildLayoutHandles();
  saveSettings();
}

function startRowDrag(event) {
  event.preventDefault();

  const grid = document.querySelector('[data-key]');
  const key = grid.dataset.key;
  const index = Number(event.currentTarget.dataset.index);
  const groups = getRowGroups(grid);
  const rows = key === 'month' && $('showWeekdays').checked ? groups.slice(1) : groups;
  const first = rows[index]?.[0]?.getBoundingClientRect();
  const second = rows[index + 1]?.[0]?.getBoundingClientRect();

  if (!first || !second) return;

  state.drag = {
    type: 'row',
    key,
    index,
    startY: event.clientY,
    firstSize: first.height,
    secondSize: second.height,
    total: state.rows[key][index] + state.rows[key][index + 1]
  };

  window.addEventListener('pointermove', moveRowDrag);
  window.addEventListener('pointerup', endDrag, { once: true });
}

function moveRowDrag(event) {
  const drag = state.drag;
  if (!drag) return;

  const firstSize = clamp(drag.firstSize + event.clientY - drag.startY, 24, drag.firstSize + drag.secondSize - 24);
  const ratio = firstSize / (drag.firstSize + drag.secondSize);

  state.rows[drag.key][drag.index] = drag.total * ratio;
  state.rows[drag.key][drag.index + 1] = drag.total * (1 - ratio);

  const grid = document.querySelector(`[data-key="${drag.key}"]`);
  const rowCount = Number(grid.dataset.rows);
  const rows = state.rows[drag.key].slice(0, rowCount).map(value => `${value}fr`).join(' ');
  grid.style.gridTemplateRows = drag.key === 'month' && $('showWeekdays').checked ? `auto ${rows}` : rows;

  buildLayoutHandles();
  saveSettings();
}

function startTitleDrag(event) {
  event.preventDefault();
  state.drag = { type: 'title', startY: event.clientY, value: number('titleGap', 5) };

  window.addEventListener('pointermove', moveTitleDrag);
  window.addEventListener('pointerup', endDrag, { once: true });
}

function moveTitleDrag(event) {
  if (state.drag?.type !== 'title') return;

  const size = paperSize();
  const preview = $('paperPreview');
  const mmPerPixel = size.height / Math.max(1, preview.getBoundingClientRect().height);
  const value = clamp(state.drag.value + (event.clientY - state.drag.startY) * mmPerPixel, 0, 50);

  $('titleGap').value = value.toFixed(1);
  preview.style.setProperty('--title-gap', `${value}mm`);
  saveSettings();
}

function endDrag() {
  state.drag = null;
  window.removeEventListener('pointermove', moveColumnDrag);
  window.removeEventListener('pointermove', moveRowDrag);
  window.removeEventListener('pointermove', moveTitleDrag);
}

function resetColumn(event) {
  const grid = document.querySelector('[data-key]');
  const key = grid.dataset.key;
  const index = Number(event.currentTarget.dataset.index);
  const total = state.columns[key][index] + state.columns[key][index + 1];

  state.columns[key][index] = total / 2;
  state.columns[key][index + 1] = total / 2;
  render();
}

function resetRow(event) {
  const grid = document.querySelector('[data-key]');
  const key = grid.dataset.key;
  const index = Number(event.currentTarget.dataset.index);
  const total = state.rows[key][index] + state.rows[key][index + 1];

  state.rows[key][index] = total / 2;
  state.rows[key][index + 1] = total / 2;
  render();
}

function updatePrintStyle() {
  const size = paperSize();
  let style = $('dynamicPrintStyle');

  if (!style) {
    style = document.createElement('style');
    style.id = 'dynamicPrintStyle';
    document.head.appendChild(style);
  }

  style.textContent = `@media print{@page{size:${size.width}mm ${size.height}mm;margin:0}.paper{width:${size.width}mm!important;height:${size.height}mm!important}}`;
}

function saveSettings() {
  try {
    const settings = Object.fromEntries(SETTINGS_FIELDS.map(id => {
      const element = $(id);
      return [id, element?.type === 'checkbox' ? element.checked : element?.value];
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      settings,
      events: state.events,
      columns: state.columns,
      rows: state.rows
    }));
  } catch (_) {}
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved) return;

    Object.entries(saved.settings || {}).forEach(([id, value]) => {
      const element = $(id);
      if (!element) return;
      element.type === 'checkbox' ? element.checked = Boolean(value) : element.value = value;
    });

    state.events = Array.isArray(saved.events) ? saved.events : [];

    if (saved.columns) {
      Object.entries(saved.columns).forEach(([key, values]) => {
        state.columns[key] = values.map(Number);
      });
    }

    if (saved.rows) {
      Object.entries(saved.rows).forEach(([key, values]) => {
        state.rows[key] = values.map(Number);
      });
    }
  } catch (_) {}
}

function renderCustomEvents() {
  const container = $('customEvents');

  container.innerHTML = state.events.map((event, index) => `
    <span class="tag">
      ${escapeHtml(event.date)} · ${escapeHtml(event.text)}
      <button type="button" data-index="${index}" title="Fjern">
        ${ICON('xmark')}
      </button>
    </span>
  `).join('');

  container.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      state.events.splice(Number(button.dataset.index), 1);
      renderCustomEvents();
      render();
    });
  });
}

function addCustomEvent() {
  const date = $('customDate').value;
  const text = $('customText').value.trim();

  if (!date || !text) return;

  state.events.push({ date, text });
  state.events.sort((a, b) => a.date.localeCompare(b.date));

  $('customDate').value = '';
  $('customText').value = '';

  renderCustomEvents();
  render();
}

function exportSettings() {
  const data = {
    settings: Object.fromEntries(SETTINGS_FIELDS.map(id => {
      const element = $(id);
      return [id, element?.type === 'checkbox' ? element.checked : element?.value];
    })),
    events: state.events,
    columns: state.columns,
    rows: state.rows
  };

  downloadBlob(JSON.stringify(data, null, 2), 'kalender-opsaetning.json', 'application/json');
}

function importSettings(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);

      Object.entries(data.settings || {}).forEach(([id, value]) => {
        const element = $(id);
        if (!element) return;
        element.type === 'checkbox' ? element.checked = Boolean(value) : element.value = value;
      });

      state.events = Array.isArray(data.events) ? data.events : [];
      if (data.columns) Object.entries(data.columns).forEach(([key, values]) => state.columns[key] = values.map(Number));
      if (data.rows) Object.entries(data.rows).forEach(([key, values]) => state.rows[key] = values.map(Number));

      renderCustomEvents();
      render();
    } catch (_) {
      alert('Opsætningen kunne ikke importeres.');
    }
  };

  reader.readAsText(file);
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stylesheetText() {
  let css = '';

  Array.from(document.styleSheets).forEach(sheet => {
    try {
      Array.from(sheet.cssRules).forEach(rule => css += `${rule.cssText}\n`);
    } catch (_) {}
  });

  return css;
}

function dataUrlBytes(dataUrl) {
  const binary = atob(dataUrl.split(',')[1]);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function concatBytes(parts) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;

  parts.forEach(part => {
    result.set(part, offset);
    offset += part.length;
  });

  return result;
}

async function renderPdfImage(date, settings, size) {
  const nativeWidth = size.width * 96 / 25.4;
  const nativeHeight = size.height * 96 / 25.4;
  const scale = Math.min(4960 / nativeWidth, 4960 / nativeHeight);
  const width = Math.max(800, Math.round(nativeWidth * scale));
  const height = Math.max(800, Math.round(nativeHeight * scale));
  const stage = document.createElement('div');
  const paper = document.createElement('div');
  const source = getComputedStyle($('paperPreview'));

  stage.style.cssText = 'position:absolute;left:-99999px;top:0;opacity:0;pointer-events:none;overflow:hidden';
  paper.className = 'paper';
  paper.style.cssText = `width:${size.width}mm;height:${size.height}mm;overflow:hidden;background:#fff;box-shadow:none`;

  [
    '--margin', '--gap', '--title-gap', '--font-size', '--date-size', '--title-size',
    '--radius', '--border-width', '--border-style', '--border-color', '--weekend-color',
    '--text-color', '--title-align', '--font-family'
  ].forEach(property => paper.style.setProperty(property, source.getPropertyValue(property)));

  paper.innerHTML = paperMarkup(settings, date, false);
  stage.appendChild(paper);
  document.body.appendChild(stage);

  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const html = `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${nativeWidth}px;height:${nativeHeight}px;overflow:hidden;background:#fff"><style>${stylesheetText()}</style>${paper.outerHTML}</div>`;
  stage.remove();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${nativeWidth} ${nativeHeight}"><rect width="100%" height="100%" fill="#fff"/><foreignObject width="${nativeWidth}" height="${nativeHeight}">${html}</foreignObject></svg>`;
  const image = new Image();

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return {
    data: dataUrlBytes(canvas.toDataURL('image/jpeg', .94)),
    width,
    height
  };
}

function createPdf(pages, size) {
  const pageWidth = size.width * 72 / 25.4;
  const pageHeight = size.height * 72 / 25.4;
  const objects = [null, null];
  const pageObjects = [];
  const encoder = new TextEncoder();
  const output = [];
  const offsets = [];
  let position = 0;

  const write = value => {
    const bytes = encoder.encode(value);
    output.push(bytes);
    position += bytes.length;
  };

  pages.forEach(page => {
    const pageObject = objects.length + 1;
    const contentObject = pageObject + 1;
    const imageObject = pageObject + 2;
    const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ`;

    pageObjects.push(pageObject);
    objects.push({
      stream: false,
      source: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 ${imageObject} 0 R >> >> /Contents ${contentObject} 0 R >>`
    });
    objects.push({
      stream: true,
      source: `<< /Length ${encoder.encode(content).length} >>`,
      data: encoder.encode(content)
    });
    objects.push({
      stream: true,
      source: `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.data.length} >>`,
      data: page.data
    });
  });

  objects[0] = { stream: false, source: '<< /Type /Catalog /Pages 2 0 R >>' };
  objects[1] = {
    stream: false,
    source: `<< /Type /Pages /Kids [${pageObjects.map(value => `${value} 0 R`).join(' ')}] /Count ${pageObjects.length} >>`
  };

  write('%PDF-1.4\n%\n');

  objects.forEach((object, index) => {
    offsets[index + 1] = position;
    write(`${index + 1} 0 obj\n${object.source}\n`);

    if (object.stream) {
      write('stream\n');
      output.push(object.data);
      position += object.data.length;
      write('\nendstream\n');
    }

    write('endobj\n');
  });

  const xrefPosition = position;
  write(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);

  for (let index = 1; index <= objects.length; index++) {
    write(`${String(offsets[index]).padStart(10, '0')} 00000 n \n`);
  }

  write(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF\n`);
  return concatBytes(output);
}

async function exportPdf() {
  const button = $('printBtn');
  const original = button.innerHTML;
  const settings = getSettings();
  const dates = periodDates(settings);
  const size = paperSize();
  const pages = [];

  button.disabled = true;
  button.innerHTML = `${ICON('spinner')} <span>Opretter PDF</span>`;

  try {
    for (const date of dates) pages.push(await renderPdfImage(date, settings, size));

    const filename = `kalender-${monthTitle(dates[0], settings.locale)}`
      .replace(/[^a-z0-9æøå _-]/gi, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase();

    const pdf = createPdf(pages, size);
    downloadBlob(pdf, `${filename || 'kalender'}.pdf`, 'application/pdf');
  } catch (error) {
    console.error(error);
    alert('PDF kunne ikke oprettes.');
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
}

function resetCalendar() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function toggleLayoutEditing() {
  state.editing = !state.editing;
  $('layoutEditBtn').classList.toggle('active', state.editing);
  render();
}

function bindSettings() {
  SETTINGS_FIELDS.forEach(id => {
    const element = $(id);
    if (!element) return;

    const update = () => {
      if (['viewMode', 'startDate', 'periodCount'].includes(id)) state.page = 0;

      if (id === 'weekStartSelect') {
        state.columns.month = Array(7).fill(1);
        state.columns.week = Array(7).fill(1);
      }

      render();
    };

    element.addEventListener('change', update);
    element.addEventListener('input', update);
  });
}


$('layoutEditBtn').addEventListener('click', toggleLayoutEditing);
$('periodPrev').addEventListener('click', () => {
  state.page = Math.max(0, state.page - 1);
  render();
});
$('periodNext').addEventListener('click', () => {
  state.page = Math.min(getSettings().periods - 1, state.page + 1);
  render();
});
$('printBtn').addEventListener('click', exportPdf);
$('resetBtn').addEventListener('click', resetCalendar);
$('exportJsonBtn').addEventListener('click', exportSettings);
$('importJson').addEventListener('change', event => importSettings(event.target.files?.[0]));
$('addCustom').addEventListener('click', addCustomEvent);
$('customText').addEventListener('keydown', event => {
  if (event.key === 'Enter') addCustomEvent();
});


loadSettings();
renderCustomEvents();
bindSettings();
render();

const previewStage = $('previewStage');
if (previewStage && 'ResizeObserver' in window) {
  const previewObserver = new ResizeObserver(() => fitPaperToStage());
  previewObserver.observe(previewStage);
} else {
  window.addEventListener('resize', fitPaperToStage);
}

