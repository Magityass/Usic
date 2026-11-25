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
  const themeToggleBtn = document.getElementById("theme-toggle");

  const THEME_KEY = "usic_theme";

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
  let isSeeking = false;
  let currentTrackIndex = -1;
  let elapsedSeconds = 0;
  let totalSeconds = 210;
  let timerId = null;

  // Ambil daftar lagu dari kartu lagu yang ada di halaman aktif
  const getTrackElements = () =>
    Array.from(document.querySelectorAll(".trending-card"));

  const parseTrackCard = (card) => ({
    title: card.querySelector("h4")?.textContent.trim() || "Unknown",
    artist: card.querySelector("p")?.textContent.trim() || "Unknown",
    duration: card.querySelector(".duration")?.textContent.trim() || "3:30",
  });

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
    } catch (error) {
      mainContent.innerHTML = `<div style="padding: 2rem; color: #ff5555;"><h3>Error: ${error.message}</h3></div>`;
    }
  };

  // Set info lagu, reset progress ke 0, buka player, dan mulai timer
  const playTrack = (title, artist, duration, index = -1) => {
    currentTrackIndex = index;
    if (npTitle) npTitle.textContent = title;
    if (npArtist) npArtist.textContent = artist;
    if (miniTitle) miniTitle.textContent = title;
    if (miniArtist) miniArtist.textContent = artist;
    if (npDuration) npDuration.textContent = duration || "3:30";

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
    playTrack(track.title, track.artist, track.duration, nextIndex);
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

    // Pindah halaman saat elemen .nav-link diklik
    const link = e.target.closest(".nav-link");
    if (link) {
      e.preventDefault();
      const targetPage = link.getAttribute("data-target");
      if (targetPage) loadPage(targetPage);
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
      playTrack(track.title, track.artist, track.duration, index);
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

    // Toggle status tombol like (hati)
    if (e.target.closest("#np-like") && npLikeBtn) {
      isLiked = !isLiked;
      npLikeBtn.classList.toggle("liked", isLiked);
      npLikeBtn.innerHTML = isLiked
        ? `<i class="fa-solid fa-heart"></i>`
        : `<i class="fa-regular fa-heart"></i>`;
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

  // Tampilkan halaman home saat web pertama kali dibuka
  loadPage("home");
});
