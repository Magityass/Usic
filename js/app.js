// Jalankan kode setelah struktur HTML selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  const mainContent = document.getElementById("main-content");
  const appLayout = document.getElementById("app-layout");
  const vinylDisc = document.getElementById("vinyl-disc");
  const npTitle = document.getElementById("np-title");
  const npArtist = document.getElementById("np-artist");
  const miniTitle = document.getElementById("mini-title");
  const miniArtist = document.getElementById("mini-artist");
  const npCurrent = document.getElementById("np-current");
  const npDuration = document.getElementById("np-duration");
  const npBarFill = document.getElementById("np-bar-fill");
  const miniBarFill = document.getElementById("mini-bar-fill");
  const progressBarBg = document.querySelector(".np-bar-bg");
  const npPlayBtn = document.getElementById("np-play");
  const miniPlayBtn = document.getElementById("mini-play");
  const npLikeBtn = document.getElementById("np-like");
  const npAddToLibraryBtn = document.getElementById("np-add-to-library");
  const playerLibraryPicker = document.getElementById("player-library-picker");
  const playerLibrarySelect = document.getElementById("player-library-select");
  const playerLibraryStatus = document.getElementById("player-library-status");
  const themeToggleBtn = document.getElementById("theme-toggle");

  const THEME_KEY = "usic_theme";
  const LIBRARY_KEY = "usic_named_libraries";
  const LEGACY_LIBRARY_KEY = "usic_saved_tracks";
  let activeLibraryId = null;

  // Data contoh album beserta lagu yang ditampilkan pada halaman Album.
  const albums = [
    {
      id: "senja",
      title: "Cerita Senja",
      artist: "Nara",
      year: 2024,
      cover: "cover-violet",
      tracks: [
        { id: "langit-sore", title: "Langit Sore", duration: "3:42" },
        { id: "pulang-perlahan", title: "Pulang Perlahan", duration: "4:05" },
        { id: "satu-kota", title: "Satu Kota", duration: "3:28" },
      ],
    },
    {
      id: "ruang",
      title: "Ruang Antara",
      artist: "Arunika",
      year: 2023,
      cover: "cover-blue",
      tracks: [
        { id: "ruang-kecil", title: "Ruang Kecil", duration: "3:51" },
        { id: "berjalan", title: "Berjalan", duration: "4:16" },
        { id: "jeda", title: "Jeda", duration: "3:34" },
      ],
    },
    {
      id: "warna",
      title: "Warna-Warni",
      artist: "Matahari Pagi",
      year: 2022,
      cover: "cover-orange",
      tracks: [
        { id: "mulai-lagi", title: "Mulai Lagi", duration: "3:37" },
        { id: "hari-baru", title: "Hari Baru", duration: "3:59" },
        { id: "beranda", title: "Beranda", duration: "4:02" },
      ],
    },
    {
      id: "hijau",
      title: "Tumbuh",
      artist: "Damar",
      year: 2021,
      cover: "cover-green",
      tracks: [
        { id: "akar", title: "Akar", duration: "3:46" },
        { id: "daun-baru", title: "Daun Baru", duration: "3:31" },
        { id: "terang", title: "Terang", duration: "4:12" },
      ],
    },
  ];

  // Escape teks sebelum dimasukkan ke dalam template HTML.
  const escapeHTML = (value) =>
    String(value).replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[character];
    });

  // Baca koleksi bernama; migrasikan lagu lama ke koleksi default bila ada.
  const readLibraries = () => {
    const storedLibraries = localStorage.getItem(LIBRARY_KEY);
    if (storedLibraries !== null) {
      const libraries = JSON.parse(storedLibraries);
      if (
        !Array.isArray(libraries) ||
        libraries.some(
          (library) =>
            !library ||
            typeof library.id !== "string" ||
            typeof library.name !== "string" ||
            !Array.isArray(library.tracks) ||
            library.tracks.some(
              (track) =>
                !track ||
                typeof track.id !== "string" ||
                typeof track.title !== "string" ||
                typeof track.artist !== "string",
            ),
        )
      ) {
        throw new Error("Data Library tidak valid.");
      }
      return ensureLikedSongsLibrary(libraries);
    }

    const oldData = localStorage.getItem(LEGACY_LIBRARY_KEY);
    if (oldData === null) return ensureLikedSongsLibrary([]);

    const oldTracks = JSON.parse(oldData);
    if (
      !Array.isArray(oldTracks) ||
      oldTracks.some(
        (track) =>
          !track ||
          typeof track.id !== "string" ||
          typeof track.title !== "string" ||
          typeof track.artist !== "string",
      )
    ) {
      throw new Error("Data Library lama tidak valid.");
    }
    if (!oldTracks.length) return ensureLikedSongsLibrary([]);

    const migratedLibraries = [
      { id: "library-default", name: "Library Saya", tracks: oldTracks },
    ];
    return ensureLikedSongsLibrary(migratedLibraries);
  };

  const writeLibraries = (libraries) => {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(libraries));
  };

  // Pastikan Library sistem Liked Songs selalu tersedia dan tersimpan.
  const ensureLikedSongsLibrary = (libraries) => {
    if (!libraries.some((library) => library.id === "liked-songs")) {
      libraries.unshift({
        id: "liked-songs",
        name: "Liked Songs",
        tracks: [],
        isSystem: true,
      });
      writeLibraries(libraries);
    }
    return libraries;
  };

  const getCoverClass = (cover) =>
    ["cover-violet", "cover-blue", "cover-orange", "cover-green"].includes(
      cover,
    )
      ? cover
      : "cover-violet";

  // Tampilkan koleksi yang sudah dibuat pada sidebar YOUR LIBRARY.
  const renderSidebarLibraries = () => {
    const libraryList = document.getElementById("user-library-list");
    if (!libraryList) return;

    try {
      const libraries = readLibraries();
      libraryList.innerHTML = libraries.length
        ? libraries
            .map(
              (library) => `
                <li class="library-item nav-link" data-target="library" data-library-id="${escapeHTML(library.id)}">
                  <div class="item-thumb"><i class="fa-solid fa-music"></i></div>
                  <div class="item-info">
                    <h4>${escapeHTML(library.name)}</h4>
                    <p>${library.tracks.length} lagu</p>
                  </div>
                </li>
              `,
            )
            .join("")
        : `<li class="library-empty">Belum ada Library</li>`;
    } catch (error) {
      libraryList.innerHTML = `<li class="library-empty is-error">${escapeHTML(error.message)}</li>`;
    }
  };

  // Tampilkan album mock data sebagai grid kartu yang dapat dibuka.
  const renderAlbumGrid = () => {
    const albumContent = document.getElementById("album-content");
    if (!albumContent) return;

    albumContent.innerHTML = `
      <div class="album-grid">
        ${albums
          .map(
            (album) => `
              <button class="album-card" type="button" data-album-id="${escapeHTML(album.id)}">
                <span class="album-cover ${album.cover}" aria-hidden="true">
                  <span class="album-art-title">${escapeHTML(album.title)}</span>
                </span>
                <h2>${escapeHTML(album.title)}</h2>
                <p class="album-meta">${escapeHTML(album.artist)} &middot; ${album.year}</p>
              </button>
            `,
          )
          .join("")}
      </div>
    `;
  };

  // Tampilkan detail album dengan pilihan koleksi tujuan untuk setiap lagu.
  const renderAlbumDetail = (album, message = "") => {
    const albumContent = document.getElementById("album-content");
    if (!albumContent) return;

    let libraries = [];
    let storageError = "";
    try {
      libraries = readLibraries();
    } catch (error) {
      storageError = error.message;
    }

    albumContent.innerHTML = `
      <button class="text-button" type="button" data-show-albums>&larr; Kembali ke Album</button>
      <div class="album-detail-header">
        <div class="album-cover ${album.cover}" aria-hidden="true">
          <span class="album-art-title">${escapeHTML(album.title)}</span>
        </div>
        <div class="album-detail-info">
          <p>ALBUM &middot; ${album.year}</p>
          <h2>${escapeHTML(album.title)}</h2>
          <p>${escapeHTML(album.artist)} &middot; ${album.tracks.length} lagu</p>
        </div>
      </div>
      <div class="track-list">
        ${album.tracks
          .map((track) => {
            return `
              <article class="track-row">
                <div class="track-meta">
                  <h3>${escapeHTML(track.title)}</h3>
                  <p>${escapeHTML(album.artist)}</p>
                </div>
                <div class="track-actions">
                  <span class="track-duration">${escapeHTML(track.duration)}</span>
                  <label class="sr-only" for="library-target-${escapeHTML(track.id)}">Pilih Library untuk ${escapeHTML(track.title)}</label>
                  <select class="library-target-select" id="library-target-${escapeHTML(track.id)}" data-library-for="${escapeHTML(track.id)}" ${libraries.length ? "" : "disabled"}>
                    <option value="">Pilih Library</option>
                    ${libraries
                      .map(
                        (library) => `
                          <option value="${escapeHTML(library.id)}" ${library.id === activeLibraryId ? "selected" : ""}>${escapeHTML(library.name)}</option>
                        `,
                      )
                      .join("")}
                  </select>
                  <button
                    class="save-track-button"
                    type="button"
                    data-add-track="${escapeHTML(track.id)}"
                    ${libraries.length ? "" : "disabled"}
                  >Tambah</button>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
      <p class="feature-message ${storageError ? "is-error" : ""}" role="status" aria-live="polite">${escapeHTML(storageError || message || (libraries.length ? "" : "Buat Library terlebih dahulu dari halaman Library."))}</p>
    `;
  };

  // Masukkan lagu ke koleksi yang dipilih tanpa menggandakan lagu.
  const addTrackToLibrary = (trackId, libraryId) => {
    const album = albums.find((item) =>
      item.tracks.some((track) => track.id === trackId),
    );
    const track = album?.tracks.find((item) => item.id === trackId);
    if (!album || !track) return;
    if (!libraryId) {
      renderAlbumDetail(album, "Pilih Library tujuan terlebih dahulu.");
      return;
    }

    try {
      const libraries = readLibraries();
      const library = libraries.find((item) => item.id === libraryId);
      if (!library) {
        renderAlbumDetail(album, "Library tujuan tidak ditemukan.");
        return;
      }
      if (library.tracks.some((item) => item.id === track.id)) {
        activeLibraryId = library.id;
        renderAlbumDetail(album, `Lagu ini sudah ada di "${library.name}".`);
        return;
      }

      library.tracks.push({
        ...track,
        artist: album.artist,
        album: album.title,
        year: album.year,
        cover: album.cover,
      });
      writeLibraries(libraries);
      activeLibraryId = library.id;
      renderSidebarLibraries();
      syncCurrentTrackLike();
      renderAlbumDetail(album, `Lagu ditambahkan ke "${library.name}".`);
    } catch (error) {
      renderAlbumDetail(album, `Gagal menambahkan lagu: ${error.message}`);
      document.querySelector("#album-content .feature-message")?.classList.add("is-error");
    }
  };

  // Render daftar koleksi bernama atau lagu di koleksi yang sedang dibuka.
  const renderLibraryPage = (message = "", isError = false) => {
    const libraryContent = document.getElementById("library-content");
    if (!libraryContent) return;

    let libraries;
    try {
      libraries = readLibraries();
    } catch (error) {
      libraries = [];
      message = `Gagal membaca Library: ${error.message}`;
      isError = true;
    }

    const statusMessage = message
      ? `<p class="feature-message ${isError ? "is-error" : ""}" role="${isError ? "alert" : "status"}" aria-live="polite">${escapeHTML(message)}</p>`
      : "";
    const library = libraries.find((item) => item.id === activeLibraryId);

    if (activeLibraryId && !library) activeLibraryId = null;

    if (library) {
      libraryContent.innerHTML = `
        <button class="text-button" type="button" data-show-libraries>&larr; Semua Library</button>
        <header class="library-detail-header">
          <div class="item-thumb"><i class="fa-solid fa-music"></i></div>
          <div>
            <p class="eyebrow">LIBRARY</p>
            <h2>${escapeHTML(library.name)}</h2>
            <p>${library.tracks.length} lagu</p>
          </div>
        </header>
        ${
          library.tracks.length
            ? `<div class="saved-track-list">
                ${library.tracks
                  .map(
                    (track) => `
                      <article class="saved-track-row">
                        <span class="album-cover ${getCoverClass(track.cover)}" aria-hidden="true">
                          <span class="album-art-title">${escapeHTML(track.album || "Library")}</span>
                        </span>
                        <div class="saved-track-meta">
                          <h2>${escapeHTML(track.title)}</h2>
                          <p>${escapeHTML(track.artist)} &middot; ${escapeHTML(track.album || "Album")} (${escapeHTML(track.year || "")})</p>
                        </div>
                        <button class="remove-track-button" type="button" data-remove-track="${escapeHTML(track.id)}" data-from-library="${escapeHTML(library.id)}">Hapus</button>
                      </article>
                    `,
                  )
                  .join("")}
              </div>`
            : `<p class="empty-library">Library ini masih kosong. Buka Album untuk memilih lagu yang ingin ditambahkan.</p>`
        }
        ${statusMessage}
      `;
      return;
    }

    libraryContent.innerHTML = `
      <form class="create-library-form" id="create-library-form">
        <label for="library-name">Buat Library baru</label>
        <div class="create-library-controls">
          <input id="library-name" name="libraryName" type="text" maxlength="40" placeholder="Contoh: Lagu Favorit" required>
          <button class="create-library-button" type="submit">Buat Library</button>
        </div>
      </form>
      ${statusMessage}
      ${
        libraries.length
          ? `<div class="library-collection-grid">
              ${libraries
              .map(
                  (item) => `
                    <button class="library-collection-card" type="button" data-open-library="${escapeHTML(item.id)}">
                      <span class="collection-icon"><i class="fa-solid fa-music"></i></span>
                      <span class="collection-card-info">
                        <strong>${escapeHTML(item.name)}</strong>
                        <span>${item.tracks.length} lagu</span>
                      </span>
                    </button>
                  `,
              )
              .join("")}
            </div>`
          : `<p class="empty-library">Belum ada Library. Buat Library dengan nama di atas, lalu tambahkan lagu dari halaman Album.</p>`
      }
    `;
  };

  // Buat koleksi bernama agar dapat dipilih dari sidebar dan halaman Album.
  const createLibrary = (name) => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        renderLibraryPage("Nama Library tidak boleh kosong.", true);
        return;
      }

      const libraries = readLibraries();
      if (
        libraries.some(
          (library) => library.name.toLowerCase() === trimmedName.toLowerCase(),
        )
      ) {
        renderLibraryPage("Nama Library tersebut sudah digunakan.", true);
        return;
      }

      const library = {
        id: `library-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: trimmedName,
        tracks: [],
      };
      libraries.push(library);
      writeLibraries(libraries);
      activeLibraryId = library.id;
      renderSidebarLibraries();
      renderLibraryPage(`Library "${library.name}" berhasil dibuat.`);
    } catch (error) {
      renderLibraryPage(`Gagal membuat Library: ${error.message}`, true);
    }
  };

  // Hapus lagu hanya dari Library tempat lagu tersebut tersimpan.
  const removeTrackFromLibrary = (trackId, libraryId) => {
    try {
      const libraries = readLibraries();
      const library = libraries.find((item) => item.id === libraryId);
      if (!library) throw new Error("Library tidak ditemukan.");

      library.tracks = library.tracks.filter((track) => track.id !== trackId);
      writeLibraries(libraries);
      activeLibraryId = library.id;
      renderSidebarLibraries();
      if (library.id === "liked-songs") syncCurrentTrackLike();
      renderLibraryPage(`Lagu dihapus dari "${library.name}".`);
    } catch (error) {
      renderLibraryPage(`Gagal menghapus lagu: ${error.message}`, true);
    }
  };

  // Terapkan tema dark atau light dan ubah ikon matahari/bulan
  const applyTheme = (theme) => {
    const isLight = theme === "light";
    document.documentElement.setAttribute(
      "data-theme",
      isLight ? "light" : "dark",
    );
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = isLight
        ? `<i class="fa-regular fa-moon"></i>`
        : `<i class="fa-regular fa-sun"></i>`;
    }
    localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
  };

  // Muat tema terakhir yang disimpan user
  applyTheme(localStorage.getItem(THEME_KEY) || "dark");

  // Status pemutar, indeks lagu aktif, seek, dan timer progress
  let isPaused = false;
  let isLiked = false;
  let currentTrack = null;
  let isSeeking = false;
  let currentTrackIndex = -1;
  let elapsedSeconds = 0;
  let totalSeconds = 210;
  let timerId = null;

  // Ambil daftar lagu dari kartu lagu yang ada di halaman aktif
  const getTrackElements = () =>
    Array.from(document.querySelectorAll(".trending-card"));

  const parseTrackCard = (card) => {
    const title = card.querySelector("h4")?.textContent.trim() || "Unknown";
    const artist = card.querySelector("p")?.textContent.trim() || "Unknown";
    return {
      id: card.dataset.trackId || `${artist.toLowerCase()}::${title.toLowerCase()}`,
      title,
      artist,
      duration: card.querySelector(".duration")?.textContent.trim() || "3:30",
    };
  };

  const setPlayerLibraryStatus = (message = "", isError = false) => {
    if (!playerLibraryStatus) return;
    playerLibraryStatus.textContent = message;
    playerLibraryStatus.classList.toggle("is-error", isError);
  };

  const updateLikeButton = (liked) => {
    isLiked = liked;
    if (!npLikeBtn) return;
    npLikeBtn.classList.toggle("liked", isLiked);
    npLikeBtn.setAttribute(
      "aria-pressed",
      isLiked ? "true" : "false",
    );
    npLikeBtn.innerHTML = isLiked
      ? `<i class="fa-solid fa-heart"></i>`
      : `<i class="fa-regular fa-heart"></i>`;
  };

  // Sinkronkan ikon hati dengan isi Library Liked Songs.
  const syncCurrentTrackLike = () => {
    if (!currentTrack) {
      updateLikeButton(false);
      return;
    }

    try {
      const likedLibrary = readLibraries().find(
        (library) => library.id === "liked-songs",
      );
      updateLikeButton(
        Boolean(
          likedLibrary?.tracks.some((track) => track.id === currentTrack.id),
        ),
      );
    } catch (error) {
      setPlayerLibraryStatus(`Gagal membaca Liked Songs: ${error.message}`, true);
    }
  };

  // Tambah atau hapus lagu aktif dari Library otomatis Liked Songs.
  const toggleCurrentTrackLike = () => {
    if (!currentTrack) return;

    try {
      const libraries = readLibraries();
      const likedLibrary = libraries.find(
        (library) => library.id === "liked-songs",
      );
      if (!likedLibrary) throw new Error("Library Liked Songs tidak ditemukan.");

      const likedIndex = likedLibrary.tracks.findIndex(
        (track) => track.id === currentTrack.id,
      );
      if (likedIndex === -1) {
        likedLibrary.tracks.push(currentTrack);
      } else {
        likedLibrary.tracks.splice(likedIndex, 1);
      }

      writeLibraries(libraries);
      renderSidebarLibraries();
      updateLikeButton(likedIndex === -1);
      setPlayerLibraryStatus(
        likedIndex === -1
          ? "Lagu ditambahkan ke Liked Songs."
          : "Lagu dihapus dari Liked Songs.",
      );
    } catch (error) {
      setPlayerLibraryStatus(`Gagal memperbarui Liked Songs: ${error.message}`, true);
    }
  };

  // Isi pilihan koleksi pada pemutar lagu.
  const openPlayerLibraryPicker = () => {
    if (!playerLibraryPicker || !playerLibrarySelect) return;
    playerLibraryPicker.hidden = false;
    npAddToLibraryBtn?.setAttribute("aria-expanded", "true");

    try {
      const libraries = readLibraries();
      playerLibrarySelect.innerHTML = `
        <option value="">Pilih Library</option>
        ${libraries
          .map(
            (library) => `
              <option value="${escapeHTML(library.id)}">${escapeHTML(library.name)}</option>
            `,
          )
          .join("")}
      `;
      setPlayerLibraryStatus(
        currentTrack ? "" : "Putar lagu terlebih dahulu untuk menambahkannya.",
      );
      if (currentTrack) playerLibrarySelect.focus();
    } catch (error) {
      setPlayerLibraryStatus(`Gagal memuat Library: ${error.message}`, true);
    }
  };

  // Simpan lagu yang sedang diputar ke Library pilihan dari pemutar.
  const addCurrentTrackToLibrary = () => {
    if (!currentTrack) {
      setPlayerLibraryStatus("Putar lagu terlebih dahulu.", true);
      return;
    }

    const libraryId = playerLibrarySelect?.value;
    if (!libraryId) {
      setPlayerLibraryStatus("Pilih Library tujuan terlebih dahulu.", true);
      return;
    }

    try {
      const libraries = readLibraries();
      const library = libraries.find((item) => item.id === libraryId);
      if (!library) throw new Error("Library tidak ditemukan.");
      if (library.tracks.some((track) => track.id === currentTrack.id)) {
        setPlayerLibraryStatus(`Lagu sudah ada di "${library.name}".`, true);
        return;
      }

      library.tracks.push(currentTrack);
      writeLibraries(libraries);
      renderSidebarLibraries();
      if (library.id === "liked-songs") syncCurrentTrackLike();
      setPlayerLibraryStatus(`Lagu ditambahkan ke "${library.name}".`);
    } catch (error) {
      setPlayerLibraryStatus(`Gagal menambahkan lagu: ${error.message}`, true);
    }
  };

  // Sinkronkan ikon play/pause di panel penuh maupun mini player
  const syncPlayIcons = () => {
    const iconHtml = isPaused
      ? `<i class="fa-solid fa-play"></i>`
      : `<i class="fa-solid fa-pause"></i>`;
    if (npPlayBtn) npPlayBtn.innerHTML = iconHtml;
    if (miniPlayBtn) miniPlayBtn.innerHTML = iconHtml;
    if (vinylDisc)
      vinylDisc.style.animationPlayState = isPaused ? "paused" : "running";
    if (appLayout) appLayout.classList.toggle("is-paused", isPaused);
  };

  // Ubah teks durasi (misal "3:55") menjadi total detik
  const parseDuration = (str) => {
    const parts = (str || "3:30").split(":");
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return Math.max(mins * 60 + secs, 1);
  };

  // Ubah angka detik menjadi format menit:detik (misal 94 -> "1:34")
  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Perbarui angka waktu dan lebar garis hijau di panel utama maupun mini player
  const updateProgressUI = () => {
    if (npCurrent) npCurrent.textContent = formatTime(elapsedSeconds);
    const percent = Math.min((elapsedSeconds / totalSeconds) * 100, 100);
    if (npBarFill) npBarFill.style.width = `${percent}%`;
    if (miniBarFill) miniBarFill.style.width = `${percent}%`;
  };

  // Hitung posisi klik/geser pada progress bar lalu lompat ke detik tujuan
  const seekToPosition = (clientX) => {
    if (!progressBarBg) return;
    const rect = progressBarBg.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const ratio = rect.width ? clickX / rect.width : 0;

    elapsedSeconds = Math.floor(ratio * totalSeconds);
    updateProgressUI();
  };

  // Jalankan hitungan waktu tiap 1 detik selama lagu tidak di-pause
  const startTimer = () => {
    clearInterval(timerId);
    timerId = setInterval(() => {
      if (!isPaused && !isSeeking && elapsedSeconds < totalSeconds) {
        elapsedSeconds += 1;
        updateProgressUI();
      }
    }, 1000);
  };

  // Ambil potongan HTML dari folder pages/ lalu tampilkan di #main-content
  const loadPage = async (pageName) => {
    try {
      const response = await fetch(`pages/${pageName}.html`);
      if (!response.ok) throw new Error(`Halaman ${pageName} belum dibuat`);

      const htmlText = await response.text();
      mainContent.innerHTML = htmlText;

      // Tandai menu navigasi yang sedang aktif di sidebar kiri
      document.querySelectorAll(".main-nav .nav-link").forEach((nav) => {
        nav.classList.remove("active");
        if (nav.getAttribute("data-target") === pageName) {
          nav.classList.add("active");
        }
      });

      // Hubungkan halaman yang perlu dirender dari data mock atau LocalStorage.
      if (pageName === "album") renderAlbumGrid();
      if (pageName === "library") renderLibraryPage();
    } catch (error) {
      mainContent.innerHTML = `<div style="padding: 2rem; color: #ff5555;"><h3>Error: ${error.message}</h3></div>`;
    }
  };

  // Set info lagu, reset progress ke 0, buka player, dan mulai timer
  const playTrack = (title, artist, duration, index = -1, trackId = "") => {
    currentTrackIndex = index;
    currentTrack = {
      id: trackId || `${artist.toLowerCase()}::${title.toLowerCase()}`,
      title,
      artist,
      duration: duration || "3:30",
      cover: "cover-violet",
    };
    if (npTitle) npTitle.textContent = title;
    if (npArtist) npArtist.textContent = artist;
    if (miniTitle) miniTitle.textContent = title;
    if (miniArtist) miniArtist.textContent = artist;
    if (npDuration) npDuration.textContent = duration || "3:30";
    if (playerLibraryPicker) playerLibraryPicker.hidden = true;
    npAddToLibraryBtn?.setAttribute("aria-expanded", "false");
    setPlayerLibraryStatus();
    syncCurrentTrackLike();

    elapsedSeconds = 0;
    totalSeconds = parseDuration(duration);
    updateProgressUI();

    if (appLayout) {
      appLayout.classList.add("is-playing");
      appLayout.classList.remove("is-paused", "is-minimized");
    }

    isPaused = false;
    syncPlayIcons();
    startTimer();
  };

  // Lompat ke lagu sebelumnya (-1) atau berikutnya (+1)
  const skipTrack = (step) => {
    const cards = getTrackElements();
    if (!cards.length) return;
    const nextIndex =
      currentTrackIndex === -1
        ? 0
        : (currentTrackIndex + step + cards.length) % cards.length;
    const track = parseTrackCard(cards[nextIndex]);
    playTrack(track.title, track.artist, track.duration, nextIndex, track.id);
  };

  // Event klik dan drag pada garis progress untuk pindah menit/detik
  if (progressBarBg) {
    progressBarBg.addEventListener("mousedown", (e) => {
      isSeeking = true;
      seekToPosition(e.clientX);
    });

    document.addEventListener("mousemove", (e) => {
      if (isSeeking) seekToPosition(e.clientX);
    });

    document.addEventListener("mouseup", () => {
      isSeeking = false;
    });

    progressBarBg.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length) seekToPosition(e.touches[0].clientX);
      },
      { passive: true },
    );

    progressBarBg.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length) seekToPosition(e.touches[0].clientX);
      },
      { passive: true },
    );
  }

  // Satu event listener untuk menangani semua aksi klik di halaman
  document.body.addEventListener("click", (e) => {
    // Toggle Dark Mode / Light Mode
    if (e.target.closest("#theme-toggle")) {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      applyTheme(currentTheme === "light" ? "dark" : "light");
      return;
    }

    // Buka form Library dan langsung fokus ke kolom nama.
    if (e.target.closest("[data-create-library-shortcut]")) {
      activeLibraryId = null;
      loadPage("library").then(() => {
        document.getElementById("library-name")?.focus();
      });
      return;
    }

    // Atur koleksi tujuan untuk lagu yang sedang diputar.
    if (e.target.closest("#np-add-to-library")) {
      if (playerLibraryPicker?.hidden) {
        openPlayerLibraryPicker();
      } else if (playerLibraryPicker) {
        playerLibraryPicker.hidden = true;
        npAddToLibraryBtn?.setAttribute("aria-expanded", "false");
      }
      return;
    }

    if (e.target.closest("#player-library-add")) {
      addCurrentTrackToLibrary();
      return;
    }

    // Buka album atau pilih lagu untuk dimasukkan ke Library tertentu.
    const albumCard = e.target.closest("[data-album-id]");
    if (albumCard) {
      const album = albums.find((item) => item.id === albumCard.dataset.albumId);
      if (album) renderAlbumDetail(album);
      return;
    }

    if (e.target.closest("[data-show-albums]")) {
      renderAlbumGrid();
      return;
    }

    if (e.target.closest("[data-show-libraries]")) {
      activeLibraryId = null;
      renderLibraryPage();
      return;
    }

    const libraryCard = e.target.closest("[data-open-library]");
    if (libraryCard) {
      activeLibraryId = libraryCard.dataset.openLibrary;
      renderLibraryPage();
      return;
    }

    const addButton = e.target.closest("[data-add-track]");
    if (addButton) {
      const targetSelect = addButton
        .closest(".track-row")
        ?.querySelector("[data-library-for]");
      addTrackToLibrary(addButton.dataset.addTrack, targetSelect?.value || "");
      return;
    }

    const removeButton = e.target.closest("[data-remove-track]");
    if (removeButton) {
      removeTrackFromLibrary(
        removeButton.dataset.removeTrack,
        removeButton.dataset.fromLibrary,
      );
      return;
    }

    // Pindah halaman saat elemen .nav-link diklik
    const link = e.target.closest(".nav-link");
    if (link) {
      e.preventDefault();
      const targetPage = link.getAttribute("data-target");
      if (targetPage) {
        if (targetPage === "library") {
          activeLibraryId = link.dataset.libraryId || null;
        }
        loadPage(targetPage);
      }
      return;
    }

    // Geser daftar Trending Songs ke kanan
    if (e.target.closest("#trending-next")) {
      const carousel = document.getElementById("trending-carousel");
      if (carousel)
        carousel.scrollBy({
          left: carousel.clientWidth + 20,
          behavior: "smooth",
        });
      return;
    }

    // Geser daftar Trending Songs ke kiri
    if (e.target.closest("#trending-prev")) {
      const carousel = document.getElementById("trending-carousel");
      if (carousel)
        carousel.scrollBy({
          left: -(carousel.clientWidth + 20),
          behavior: "smooth",
        });
      return;
    }

    // Putar lagu saat kartu lagu diklik
    const songCard = e.target.closest(".trending-card");
    if (songCard) {
      const cards = getTrackElements();
      const index = cards.indexOf(songCard);
      const track = parseTrackCard(songCard);
      playTrack(track.title, track.artist, track.duration, index, track.id);
      return;
    }

    // Skip ke lagu berikutnya dari mini player maupun panel utama
    if (e.target.closest("#mini-next") || e.target.closest("#np-next")) {
      skipTrack(1);
      return;
    }

    // Skip ke lagu sebelumnya dari mini player maupun panel utama
    if (e.target.closest("#mini-prev") || e.target.closest("#np-prev")) {
      skipTrack(-1);
      return;
    }

    // Toggle play/pause dari tombol player utama maupun mini player
    if (e.target.closest("#np-play") || e.target.closest("#mini-play")) {
      isPaused = !isPaused;
      syncPlayIcons();
      return;
    }

    // Simpan atau hapus lagu aktif pada Library Liked Songs.
    if (e.target.closest("#np-like") && npLikeBtn) {
      toggleCurrentTrackLike();
      return;
    }

    // Minimize player penuh ke mini player di bawah (lagu tetap berjalan)
    if (e.target.closest("#np-close")) {
      appLayout?.classList.add("is-minimized");
      return;
    }

    // Buka kembali player penuh saat area info mini player diklik
    if (e.target.closest("#mini-player-expand")) {
      appLayout?.classList.remove("is-minimized");
    }
  });

  // Tangani form pembuatan Library tanpa memuat ulang seluruh aplikasi.
  document.body.addEventListener("submit", (e) => {
    const form = e.target.closest("#create-library-form");
    if (!form) return;

    e.preventDefault();
    createLibrary(form.elements.libraryName.value);
  });

  renderSidebarLibraries();

  // Tampilkan halaman home saat web pertama kali dibuka
  loadPage("home");
});
