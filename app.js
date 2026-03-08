// API KEY & KONFIGURASI GLOBAL
const TMDB_API_KEY = "2ccdbf4ad31bdcf48c138529f82cdcfe";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Daftar Genre
const TMDB_GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
];

const MOOD_GENRE_MAPPING = {
  happy: [35, 10749, 10751],
  excited: [28, 12, 14],
  thoughtful: [18, 9648, 53],
  family: [10751, 16, 12],
};

// Variabel Global
let currentUser = null;
let currentMethod = "quiz";
let selectedMoods = [];
let currentPage = 1;
let maxPages = 1;
const MOVIES_PER_LOAD = 10;

// ==============================================
// PILAR 1: ENKAPSULASI
// ==============================================

class Person {
  #name;
  #age;

  constructor(name, age) {
    this.#validateName(name);
    this.#name = this.#formatName(name);
    this.#age = age;
  }

  get name() {
    return this.#name;
  }

  get age() {
    return this.#age;
  }

  set age(newAge) {
    this.#validateAge(newAge);
    this.#age = parseInt(newAge);
  }

  #validateAge(age) {
    const ageInt = parseInt(age);
    if (isNaN(ageInt) || ageInt < 1 || ageInt > 120) {
      throw new Error("Usia harus di antara 1 dan 120 tahun.");
    }
  }

  #validateName(name) {
    const regex = /^[a-zA-Z\s\.\']+$/;
    if (!name || !name.trim()) {
      throw new Error("Nama tidak boleh kosong.");
    }
    if (!regex.test(name)) {
      throw new Error("Nama hanya boleh berisi huruf, spasi, titik (.), dan tanda petik (').");
    }
  }

  #formatName(name) {
    return name.toLowerCase().split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }

  getInfo() {
    return `${this.#name} (${this.#age} tahun)`;
  }
}

// ==============================================
// PILAR 2: PEWARISAN (INHERITANCE)
// ==============================================

class User extends Person {
  #preferences;

  constructor(name, age) {
    super(name, age);
    this.#preferences = {
      genres: [],
      minRating: 7.0
    };
  }

  get preferences() {
    return { ...this.#preferences };
  }

  updatePreferences(genres, rating) {
    this.#preferences.genres = genres;
    this.#preferences.minRating = rating;
  }

  getInfo() {
    return `User: ${super.getInfo()} - Preferensi: ${this.#preferences.genres.length} genre`;
  }
}

class Media {
  #title;
  #year;
  #rating;
  #poster;

  constructor(title, year, rating, poster) {
    if (this.constructor === Media) {
      throw new Error("Cannot instantiate abstract class Media");
    }
    this.#title = title;
    this.#year = year;
    this.#rating = rating;
    this.#poster = poster;
  }

  get title() { return this.#title; }
  get year() { return this.#year; }
  get rating() { return this.#rating; }
  get poster() { return this.#poster; }

  getMediaType() {
    throw new Error("Method 'getMediaType()' must be implemented");
  }

  getDisplayInfo() {
    throw new Error("Method 'getDisplayInfo()' must be implemented");
  }

  getBasicInfo() {
    return `${this.#title} (${this.#year})`;
  }
}

// ==============================================
// PILAR 3: POLIMORFISME (POLYMORPHISM)
// ==============================================

class Film extends Media {
  #genreIds;
  #id;

  constructor(data) {
    const title = data.title || data.name;
    const year = data.release_date ? data.release_date.substring(0, 4) : "N/A";
    const rating = data.vote_average ? data.vote_average.toFixed(1) : "N/A";
    const poster = data.poster_path
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
      : "N/A";

    super(title, year, rating, poster);
    this.#genreIds = data.genre_ids || [];
    this.#id = data.id;
  }

  get genreIds() { return [...this.#genreIds]; }
  get id() { return this.#id; }

  getMediaType() {
    return "Film";
  }

  getDisplayInfo() {
    return `🎬 ${this.title} (${this.year}) - Rating: ${this.rating}/10`;
  }

  get info() {
    return this.getBasicInfo();
  }
}

class TVSeries extends Media {
  #seasons;
  #id;

  constructor(data) {
    const title = data.name || data.title;
    const year = data.first_air_date ? data.first_air_date.substring(0, 4) : "N/A";
    const rating = data.vote_average ? data.vote_average.toFixed(1) : "N/A";
    const poster = data.poster_path
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
      : "N/A";

    super(title, year, rating, poster);
    this.#seasons = data.number_of_seasons || 0;
    this.#id = data.id;
  }

  get seasons() { return this.#seasons; }
  get id() { return this.#id; }

  getMediaType() {
    return "TV Series";
  }

  getDisplayInfo() {
    return `📺 ${this.title} (${this.year}) - ${this.#seasons} Seasons - Rating: ${this.rating}/10`;
  }
}

// ==============================================
// PILAR 4: ABSTRAKSI
// ==============================================

class MediaService {
  #apiKey;
  #baseUrl;

  constructor(apiKey, baseUrl) {
    if (this.constructor === MediaService) {
      throw new Error("Cannot instantiate abstract class MediaService");
    }
    this.#apiKey = apiKey;
    this.#baseUrl = baseUrl;
  }

  get apiKey() { return this.#apiKey; }
  get baseUrl() { return this.#baseUrl; }

  async fetchData(params) {
    throw new Error("Method 'fetchData()' must be implemented");
  }

  async fetchDetails(id) {
    throw new Error("Method 'fetchDetails()' must be implemented");
  }

  buildUrl(endpoint, params = {}) {
    let url = `${this.#baseUrl}${endpoint}?api_key=${this.#apiKey}`;
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        url += `&${key}=${value}`;
      }
    }
    return url;
  }

  handleError(error) {
    console.error("Service Error:", error);
    throw error;
  }
}

class MovieService extends MediaService {
  constructor(apiKey, baseUrl) {
    super(apiKey, baseUrl);
  }

  async fetchData(params) {
    const {
      genres,
      rating,
      sortBy = "popularity.desc",
      yearMin = 1900,
      yearMax = new Date().getFullYear(),
      page: page,
      userAge = 120 // Default restriction free
    } = params;

    const queryParams = {
      language: "en-US",
      sort_by: sortBy,
      "vote_average.gte": rating,
      "primary_release_date.gte": `${yearMin}-01-01`,
      "primary_release_date.lte": `${yearMax}-12-31`,
      page: page,
      certification_country: "US"
    };

    // Age-based certification filtering
    if (userAge < 13) {
      queryParams["certification.lte"] = "PG";
    } else if (userAge < 17) {
      queryParams["certification.lte"] = "PG-13";
    }
    // Age >= 17 sees all (no restriction added)

    if (genres && genres.length > 0) {
      queryParams.with_genres = genres.join(",");
    }

    const url = this.buildUrl("/discover/movie", queryParams);
    console.log("Movie API URL:", url);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      return {
        results: data.results.map(movie => new Film(movie)),
        totalPages: data.total_pages,
        currentPage: data.page
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async fetchDetails(movieId) {
    const url = this.buildUrl(`/movie/${movieId}`, {
      append_to_response: "release_dates"
    });

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      this.handleError(error);
    }
  }
}

class FilterStrategy {
  #selectedGenreIds;
  #minRating;

  constructor() {
    if (this.constructor === FilterStrategy) {
      throw new Error("Cannot instantiate abstract class FilterStrategy");
    }
    this.#selectedGenreIds = [];
    this.#minRating = 7.0;
  }

  get selectedGenreIds() { return [...this.#selectedGenreIds]; }
  get minRating() { return this.#minRating; }

  setGenres(genres) { this.#selectedGenreIds = genres; }
  setRating(rating) { this.#minRating = rating; }

  getFilterParams() {
    throw new Error("Method 'getFilterParams()' must be implemented");
  }

  validate() {
    throw new Error("Method 'validate()' must be implemented");
  }
}

class QuizFilter extends FilterStrategy {
  #yearMin;

  constructor() {
    super();
    this.#yearMin = 2000;
  }

  get yearMin() { return this.#yearMin; }
  setYearMin(year) { this.#yearMin = year; }

  getFilterParams(page = 1) {
    return {
      genres: this.selectedGenreIds,
      rating: this.minRating,
      yearMin: this.#yearMin,
      yearMax: new Date().getFullYear(),
      sortBy: "popularity.desc",
      page: page
    };
  }

  validate() {
    if (this.selectedGenreIds.length === 0) {
      throw new Error("Pilih minimal satu Genre untuk mode Quiz!");
    }
    return true;
  }
}

class ManualFilter extends FilterStrategy {
  #sortBy;
  #yearMin;
  #yearMax;

  constructor() {
    super();
    this.#sortBy = "popularity.desc";
    this.#yearMin = 2000;
    this.#yearMax = new Date().getFullYear();
  }

  get sortBy() { return this.#sortBy; }
  get yearMin() { return this.#yearMin; }
  get yearMax() { return this.#yearMax; }

  setSortBy(sortBy) { this.#sortBy = sortBy; }
  setYearRange(min, max) {
    this.#yearMin = min;
    this.#yearMax = max;
  }

  getFilterParams(page = 1) {
    return {
      genres: this.selectedGenreIds,
      rating: this.minRating,
      yearMin: this.#yearMin,
      yearMax: this.#yearMax,
      sortBy: this.#sortBy,
      page: page
    };
  }

  validate() {
    return true;
  }
}

class AppStateManager {
  static #instance = null;
  #quizFilter;
  #manualFilter;
  #movieService;

  constructor() {
    if (AppStateManager.#instance) {
      return AppStateManager.#instance;
    }

    this.#quizFilter = new QuizFilter();
    this.#manualFilter = new ManualFilter();
    this.#movieService = new MovieService(TMDB_API_KEY, TMDB_BASE_URL);

    AppStateManager.#instance = this;
  }

  static getInstance() {
    if (!AppStateManager.#instance) {
      AppStateManager.#instance = new AppStateManager();
    }
    return AppStateManager.#instance;
  }

  getFilter(method) {
    return method === "quiz" ? this.#quizFilter : this.#manualFilter;
  }

  getMovieService() {
    return this.#movieService;
  }

  saveState(user, method, page) {
    const state = {
      user: user ? { name: user.name, age: user.age } : null,
      quiz: {
        genres: this.#quizFilter.selectedGenreIds,
        rating: this.#quizFilter.minRating,
        yearMin: this.#quizFilter.yearMin
      },
      manual: {
        genres: this.#manualFilter.selectedGenreIds,
        rating: this.#manualFilter.minRating,
        sortBy: this.#manualFilter.sortBy,
        yearMin: this.#manualFilter.yearMin,
        yearMax: this.#manualFilter.yearMax
      },
      currentMethod: method,
      currentPage: page
    };
    try {
      localStorage.setItem("movieMatchState", JSON.stringify(state));
    } catch (e) {
      console.log("LocalStorage not available");
    }
  }

  clearState() {
    try {
      localStorage.removeItem("movieMatchState");
    } catch (e) {
      console.log("LocalStorage not available");
    }
  }
}

const appState = AppStateManager.getInstance();

// ==============================================
// UI CONTROLLER FUNCTIONS
// ==============================================

function loginUser() {
  const name = document.getElementById("name-input").value;
  const age = document.getElementById("age-input").value;
  const modal = document.getElementById("login-modal");
  const appHeader = document.getElementById("app-header");

  try {
    const validAge = validateUserAge(age);
    currentUser = new User(name, validAge);

    modal.classList.add("hidden");
    appHeader.classList.remove("hidden");
    document.getElementById("main-app-content").classList.remove("hidden");
    document.getElementById("welcome-name").textContent = currentUser.name;
    document.getElementById("welcome-name-result").textContent = currentUser.name;

    updateHeader();
    setMethod("quiz");
    appState.saveState(currentUser, currentMethod, getCurrentPage());
  } catch (error) {
    alert("Login Gagal: " + error.message);
  }
}

function validateUserAge(ageInput) {
  const age = parseInt(ageInput);
  if (isNaN(age) || age < 1 || age > 120) {
    throw new Error("Usia harus berupa angka antara 1 sampai 120 tahun.");
  }
  return age;
}

function setMethod(method) {
  currentMethod = method;
  const criteriaContainer = document.getElementById("criteria-container");

  document.querySelectorAll(".method-btn")
    .forEach(btn => btn.classList.remove("active"));

  const targetBtn = document.getElementById(`${method}-btn`);
  if (targetBtn) {
    targetBtn.classList.add("active");
  }

  if (method === "quiz") {
    criteriaContainer.innerHTML = generateQuizForm();
  } else if (method === "manual") {
    criteriaContainer.innerHTML = generateManualFilterForm();
  }

  criteriaContainer.classList.add("visible");
  document.getElementById("action-buttons-container").classList.remove("hidden");

  appState.saveState(currentUser, currentMethod, getCurrentPage());
}

function showFilterPage() {
  document.getElementById("results-page").classList.add("hidden");
  document.getElementById("main-app-content").classList.remove("hidden");
  document.getElementById("criteria-container").classList.add("visible");
}

function updateHeader() {
  if (currentUser) {
    document.getElementById("display-user-name").textContent = currentUser.name;
    document.getElementById("display-user-age").textContent = `${currentUser.age} tahun`;
    document.getElementById("update-age-btn").classList.remove("hidden");
  }
}

function promptNewAge() {
  if (!currentUser) {
    alert("Silakan login terlebih dahulu!");
    return;
  }

  const newAgeInput = prompt(
    `Usia Anda saat ini: ${currentUser.age} tahun.\nMasukkan usia baru (misal: 13):`
  );

  if (newAgeInput === null) return;

  try {
    const validAge = validateUserAge(newAgeInput.trim());
    currentUser.age = validAge;
    updateHeader();
    appState.saveState(currentUser, currentMethod, getCurrentPage());
    alert(`Usia berhasil diperbarui menjadi ${currentUser.age} tahun.`);

    if (!document.getElementById("results-page").classList.contains("hidden")) {
      const confirmRefresh = confirm(
        "Usia Anda telah diperbarui. Apakah Anda ingin mencari rekomendasi ulang berdasarkan usia baru ini?"
      );
      if (confirmRefresh) {
        showFilterPage();
      }
    }
  } catch (error) {
    alert("Gagal update usia: " + error.message);
  }
}

function generateQuizForm() {
  const filter = appState.getFilter("quiz");

  const moodButtons = Object.keys(MOOD_GENRE_MAPPING)
    .map(mood => {
      const displayMood = mood.charAt(0).toUpperCase() + mood.slice(1);
      const selectedClass = selectedMoods.includes(mood) ? "selected" : "";
      return `
          <button 
            class="mood-tag ${selectedClass}" 
            data-mood="${mood}" 
            onclick="toggleMoodSelection(this, '${mood}')">
            ${displayMood}
          </button>
        `;
    }).join("");

  const genreButtons = TMDB_GENRES.map(genre => {
    const selectedClass = filter.selectedGenreIds.includes(genre.id) ? "selected" : "";
    return `
        <button 
          class="filter-tag ${selectedClass}" 
          data-id="${genre.id}" 
          onclick="toggleGenreSelection(this, ${genre.id})">
          ${genre.name}
        </button>
      `;
  }).join("");

  return `
      <h3>Mood Saat Ini</h3> 
      <div id="mood-container" class="tag-container" style="margin-bottom: 30px;">
        ${moodButtons} 
      </div>
      
      <h3>Pilih Kriteria Quiz Anda:</h3>
      
      <div class="filter-group">
        <h4>Genre Favorit (Pilih Minimal 1)</h4>
        <div id="genre-container" class="tag-container">
          ${genreButtons}
        </div>
      </div>
      
      <div class="filter-group">
        <h4>Minimum Rating: <span id="rating-display">${filter.minRating.toFixed(1)}</span></h4>
        <input type="range" 
          id="min-rating-slider" 
          min="1.0" 
          max="10.0" 
          step="0.1" 
          value="${filter.minRating}"
          oninput="updateRating(this.value)">
      </div>
      
      <div class="filter-group">
        <h4>Tahun Rilis Minimal: <span id="year-display">${filter.yearMin}</span></h4>
        <input type="range" 
          id="min-year-slider" 
          min="1990" 
          max="${new Date().getFullYear()}" 
          step="1" 
          value="${filter.yearMin}"
          oninput="updateYear(this.value)">
      </div>
    `;
}

function generateManualFilterForm() {
  const filter = appState.getFilter("manual");

  const SORT_OPTIONS = [
    { value: "popularity.desc", name: "Paling Populer" },
    { value: "vote_average.desc", name: "Rating Tertinggi" },
    { value: "release_date.desc", name: "Terbaru" },
    { value: "release_date.asc", name: "Terlama" },
  ];

  const genreButtons = TMDB_GENRES.map(genre => {
    const selectedClass = filter.selectedGenreIds.includes(genre.id) ? "selected" : "";
    return `
        <button 
          class="filter-tag ${selectedClass}" 
          data-id="${genre.id}" 
          onclick="toggleManualGenre(this, ${genre.id})">
          ${genre.name}
        </button>
      `;
  }).join("");

  const sortOptionsHtml = SORT_OPTIONS.map(option => `
      <option value="${option.value}" ${filter.sortBy === option.value ? "selected" : ""}>
        ${option.name}
      </option>
    `).join("");

  return `
      <h3>Atur Kriteria Filter Detail Anda:</h3>
      
      <div class="filter-group">
        <h4>Urutkan Film Berdasarkan:</h4>
        <select id="sort-by-select" onchange="updateSortBy(this.value)">
          ${sortOptionsHtml}
        </select>
      </div>

      <div class="filter-group">
        <h4>Genre Favorit (Pilih 1 atau Lebih)</h4>
        <div id="manual-genre-container" class="tag-container">
          ${genreButtons}
        </div>
      </div>
      
      <div class="filter-group">
        <h4>Minimum Rating: <span id="manual-rating-display">${filter.minRating.toFixed(1)}</span></h4>
        <input type="range" 
          id="manual-min-rating-slider" 
          min="1.0" 
          max="10.0" 
          step="0.1" 
          value="${filter.minRating}"
          oninput="updateManualRating(this.value)">
      </div>
      
      <div class="filter-group">
        <h4>Rentang Tahun Rilis: 
          <span id="manual-year-min-display">${filter.yearMin}</span> – 
          <span id="manual-year-max-display">${filter.yearMax}</span>
        </h4>
        <div style="display: flex; gap: 15px;">
          <input type="range" 
            id="manual-year-min-slider" 
            min="1900" 
            max="${new Date().getFullYear()}" 
            step="1" 
            value="${filter.yearMin}"
            oninput="updateManualYearRange()">
          <input type="range" 
            id="manual-year-max-slider" 
            min="1900" 
            max="${new Date().getFullYear()}" 
            step="1" 
            value="${filter.yearMax}"
            oninput="updateManualYearRange()">
        </div>
      </div>
    `;
}

function resetFilters() {
  appState.clearState();

  const quizFilter = appState.getFilter("quiz");
  const manualFilter = appState.getFilter("manual");

  quizFilter.setGenres([]);
  quizFilter.setRating(7.0);
  quizFilter.setYearMin(2000);

  manualFilter.setGenres([]);
  manualFilter.setRating(7.0);
  manualFilter.setSortBy("popularity.desc");
  manualFilter.setYearRange(2000, new Date().getFullYear());

  selectedMoods = [];

  alert("Semua kriteria yang telah di pilih akan di hapus dan kembali ke setelan awal");
  setMethod(currentMethod);
  document.getElementById("criteria-container").classList.add("visible");
}

function toggleGenreSelection(element, genreId) {
  const filter = appState.getFilter("quiz");
  const genres = filter.selectedGenreIds;
  const index = genres.indexOf(genreId);

  if (index > -1) {
    genres.splice(index, 1);
    element.classList.remove("selected");
  } else {
    genres.push(genreId);
    element.classList.add("selected");
  }

  filter.setGenres(genres);
  appState.saveState(currentUser, currentMethod, getCurrentPage());
}

function updateRating(value) {
  const filter = appState.getFilter("quiz");
  filter.setRating(parseFloat(value));
  document.getElementById("rating-display").textContent = filter.minRating.toFixed(1);
  appState.saveState(currentUser, currentMethod, getCurrentPage());
}

function updateYear(value) {
  const filter = appState.getFilter("quiz");
  filter.setYearMin(parseInt(value));
  document.getElementById("year-display").textContent = value;
  appState.saveState(currentUser, currentMethod, getCurrentPage());
}

function toggleManualGenre(element, genreId) {
  const filter = appState.getFilter("manual");
  const genres = filter.selectedGenreIds;
  const index = genres.indexOf(genreId);

  if (index > -1) {
    genres.splice(index, 1);
    element.classList.remove("selected");
  } else {
    genres.push(genreId);
    element.classList.add("selected");
  }

  filter.setGenres(genres);
  appState.saveState(currentUser, currentMethod, getCurrentPage());
}

function updateSortBy(value) {
  const filter = appState.getFilter("manual");
  filter.setSortBy(value);
  appState.saveState(currentUser, currentMethod, getCurrentPage());
}

function updateManualRating(value) {
  const filter = appState.getFilter("manual");
  filter.setRating(parseFloat(value));
  document.getElementById("manual-rating-display").textContent = filter.minRating.toFixed(1);
  appState.saveState(currentUser, currentMethod, getCurrentPage());
}

function updateManualYearRange() {
  const minSlider = document.getElementById("manual-year-min-slider");
  const maxSlider = document.getElementById("manual-year-max-slider");

  let minVal = parseInt(minSlider.value);
  let maxVal = parseInt(maxSlider.value);

  if (minVal > maxVal) {
    minVal = maxVal;
    minSlider.value = maxVal;
  }

  const filter = appState.getFilter("manual");
  filter.setYearRange(minVal, maxVal);

  document.getElementById("manual-year-min-display").textContent = minVal;
  document.getElementById("manual-year-max-display").textContent = maxVal;
  appState.saveState(currentUser, currentMethod, getCurrentPage());
}

function toggleMoodSelection(element, mood) {
  const genreIdsToToggle = MOOD_GENRE_MAPPING[mood];
  const moodIndex = selectedMoods.indexOf(mood);
  let shouldSelect = true;

  if (moodIndex > -1) {
    selectedMoods.splice(moodIndex, 1);
    element.classList.remove("selected");
    shouldSelect = false;
  } else {
    selectedMoods.push(mood);
    element.classList.add("selected");
  }

  const filter = appState.getFilter("quiz");
  const genres = filter.selectedGenreIds;

  genreIdsToToggle.forEach(genreId => {
    const genreButton = document.querySelector(`.filter-tag[data-id="${genreId}"]`);
    const genreIsCurrentlySelected = genres.includes(genreId);

    if (shouldSelect && !genreIsCurrentlySelected) {
      toggleGenreSelection(genreButton, genreId);
    } else if (!shouldSelect && genreIsCurrentlySelected) {
      toggleGenreSelection(genreButton, genreId);
    }
  });

  appState.saveState(currentUser, currentMethod, getCurrentPage());
}

async function fetchRecommendations(isLoadMore = false) {
  document.getElementById("loading-spinner").classList.remove("hidden");
  const listContainer = document.getElementById("recommendation-list");

  let pageToFetch = 1;
  if (isLoadMore) {
    if (currentPage < maxPages) {
      currentPage++;
      pageToFetch = currentPage;
    } else {
      return;
    }
  } else {
    currentPage = 1;
    pageToFetch = 1;
    listContainer.innerHTML = "";
  }

  try {
    const filter = appState.getFilter(currentMethod);
    filter.validate();

    const movieService = appState.getMovieService();
    const params = filter.getFilterParams(pageToFetch);

    // Pass user age for filtering
    params.userAge = currentUser ? currentUser.age : 0;


    console.log(`Fetching ${currentMethod} recommendations (Page ${pageToFetch}):`, params);

    const result = await movieService.fetchData(params);

    if (result.results && result.results.length > 0) {
      maxPages = result.totalPages;
      const limitedResults = result.results.slice(0, MOVIES_PER_LOAD);
      displayRecommendations(limitedResults, isLoadMore);
    } else {
      alert("Ups! Tidak ada film yang cocok dengan kriteria Anda. Coba filter yang lebih longgar.");
      document.getElementById("results-page").classList.remove("hidden");
      listContainer.innerHTML = '<p style="text-align: center;">Tidak ada film yang ditemukan.</p>';
    }
  } catch (error) {
    console.error("Gagal mengambil data:", error);
    alert(error.message || "Terjadi error saat mencari rekomendasi.");
  } finally {
    document.getElementById("loading-spinner").classList.add("hidden");
  }
}

function displayRecommendations(mediaList, append = false) {
  const listContainer = document.getElementById("recommendation-list");
  const loadMoreBtn = document.getElementById("load-more-btn");
  const loadMoreContainer = document.getElementById("load-more-container");

  document.getElementById("main-app-content").classList.add("hidden");
  document.getElementById("results-page").classList.remove("hidden");

  if (maxPages > currentPage) {
    loadMoreContainer.classList.remove("hidden");
    loadMoreBtn.disabled = false;
    loadMoreBtn.style.opacity = "1";
    loadMoreBtn.style.cursor = "pointer";
    loadMoreBtn.textContent = `Muat 10 Film Lainnya (Page ${currentPage + 1}/${maxPages})`;
    loadMoreBtn.setAttribute("onclick", "fetchRecommendations(true)");
  } else if (maxPages > 1) {
    loadMoreContainer.classList.remove("hidden");
    loadMoreBtn.disabled = true;
    loadMoreBtn.style.opacity = "0.6";
    loadMoreBtn.style.cursor = "not-allowed";
    loadMoreBtn.textContent = "Semua film rekomendasi sudah dimuat";
    loadMoreBtn.removeAttribute("onclick");
  } else {
    loadMoreContainer.classList.add("hidden");
  }

  mediaList.forEach(media => {
    try {
      const movieCard = document.createElement("div");
      movieCard.className = "movie-card";
      movieCard.onclick = () => fetchMovieDetails(media.id);

      movieCard.innerHTML = `
          <img src="${media.poster}" alt="${media.title}" class="movie-poster">
          <div class="movie-info">
            <h4>${media.title}</h4>
            <p>Tahun: ${media.year}</p>
            <p>Rating: ${media.rating} / 10</p>
          </div>
        `;
      listContainer.appendChild(movieCard);
    } catch (e) {
      console.error("Gagal membuat media card:", e);
    }
  });
}

async function fetchMovieDetails(movieId) {
  const detailModal = document.getElementById("detail-modal");
  const detailDisplay = document.getElementById("movie-detail-display");

  detailModal.classList.remove("hidden");
  detailDisplay.innerHTML = "<h3>Loading Detail Film...</h3>";

  try {
    const movieService = appState.getMovieService();
    const data = await movieService.fetchDetails(movieId);

    const releaseDates = data.release_dates?.results || [];
    let certification = "Unrated";
    let regionRelease = releaseDates.find(r => r.iso_3166_1 === "US" || r.iso_3166_1 === "ID");

    if (regionRelease && regionRelease.release_dates[0]) {
      certification = regionRelease.release_dates[0].certification || "Unrated";
    }

    displayDetail(data, certification);
  } catch (error) {
    console.error("Gagal fetch detail:", error);
    detailDisplay.innerHTML = "<h3>Gagal memuat detail film.</h3>";
  }
}

function displayDetail(data, certification) {
  const detailDisplay = document.getElementById("movie-detail-display");
  const userAge = currentUser ? currentUser.age : 1;

  let minAge = 0;
  if (["R", "NC-17", "MA", "17+"].includes(certification)) {
    minAge = 17;
  } else if (["PG-13", "13+"].includes(certification)) {
    minAge = 13;
  } else if (["PG", "G", "SU"].includes(certification)) {
    minAge = 0;
  }

  let warningHtml = "";
  if (userAge < minAge && minAge > 0) {
    warningHtml = `
        <div class="detail-warning">
          ⚠️ Peringatan: Film ini memiliki rating usia **${certification}** (Minimal ${minAge} tahun). Usia Anda (${userAge}) di bawah batas rekomendasi.
        </div>
      `;
  }

  detailDisplay.innerHTML = `
      <div class="movie-detail-container">
        <img src="https://image.tmdb.org/t/p/w500${data.poster_path}" alt="${data.title}" class="detail-poster">
        <div class="detail-text">
          <h3>${data.title} (${data.release_date ? data.release_date.substring(0, 4) : "N/A"})</h3>
          ${warningHtml}
          <p><strong>Rating Usia:</strong> ${certification}</p>
          <p><strong>Rating:</strong> ${data.vote_average ? data.vote_average.toFixed(1) : "N/A"} / 10</p>
          <p><strong>Genre:</strong> ${data.genres.map(g => g.name).join(", ")}</p>
          <p><strong>Durasi:</strong> ${data.runtime || "N/A"} menit</p>
          <p><strong>Ringkasan:</strong> ${data.overview || "Tidak ada ringkasan tersedia."}</p>
        </div>
      </div>
    `;
}

function getCurrentPage() {
  if (!document.getElementById("login-modal").classList.contains("hidden")) {
    return "login";
  } else if (!document.getElementById("main-app-content").classList.contains("hidden")) {
    return "filter";
  } else if (!document.getElementById("results-page").classList.contains("hidden")) {
    return "results";
  }
  return "login";
}

function restorePage(pageName) {
  if (pageName === "filter" || pageName === "results") {
    document.getElementById("login-modal").classList.add("hidden");
    document.getElementById("app-header").classList.remove("hidden");
    document.getElementById("main-app-content").classList.remove("hidden");
    document.getElementById("welcome-name").textContent = currentUser.name;
    document.getElementById("welcome-name-result").textContent = currentUser.name;

    updateHeader();
    setMethod(currentMethod);
  }
}

function restartApp() {
  const confirmRestart = window.confirm(
    "Apakah Anda yakin ingin logout?\n\nSemua filter dan hasil akan direset."
  );

  if (!confirmRestart) return;

  appState.clearState();

  currentUser = null;
  currentMethod = "quiz";
  selectedMoods = [];

  const quizFilter = appState.getFilter("quiz");
  const manualFilter = appState.getFilter("manual");

  quizFilter.setGenres([]);
  quizFilter.setRating(7.0);
  quizFilter.setYearMin(2000);

  manualFilter.setGenres([]);
  manualFilter.setRating(7.0);
  manualFilter.setSortBy("popularity.desc");
  manualFilter.setYearRange(2000, new Date().getFullYear());

  document.getElementById("name-input").value = "";
  document.getElementById("age-input").value = "";
  document.getElementById("app-header").classList.add("hidden");
  document.getElementById("main-app-content").classList.add("hidden");
  document.getElementById("results-page").classList.add("hidden");
  document.getElementById("login-modal").classList.remove("hidden");
  document.getElementById("recommendation-list").innerHTML = "";

  alert("✅ Berhasil Logout! Silakan login kembali.");
  console.log("🔄 App restarted successfully!");
}