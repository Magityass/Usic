// Jalankan kode setelah struktur HTML dimuat
document.addEventListener("DOMContentLoaded", () => {
  const mainContent = document.getElementById("main-content");
  const appLayout = document.getElementById("app-layout");
  const vinylDisc = document.getElementById("vinyl-disc");
  const npTitle = document.getElementById("np-title");
  const npArtist = document.getElementById("np-artist");
  const npCurrent = document.getElementById("np-current");
  const npDuration = document.getElementById("np-duration");
  const npBarFill = document.getElementById("np-bar-fill");
  const npPlayBtn = document.getElementById("np-play");
  const npLikeBtn = document.getElementById("np-like");

  // Status pemutar dan timer progress
  let isPaused = false;
  let isLiked = false;
  let elapsedSeconds = 0;
  let totalSeconds = 210;
  let timerId = null;

  // Ubah teks durasi (misal "3:55") menjadi total detik
  const parseDuration = (str) => {
    const parts = (str || "3:30").split(":");
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return Math.max(mins * 60 + secs, 1);
  };

  // Ubah detik menjadi format menit:detik (misal 94 -> "1:34")
  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Perbarui teks waktu dan lebar garis hijau
  const updateProgressUI = () => {
    if (npCurrent) npCurrent.textContent = formatTime(elapsedSeconds);
    if (npBarFill) {
      const percent = Math.min((elapsedSeconds / totalSeconds) * 100, 100);
      npBarFill.style.width = `${percent}%`;
    }
  };

  // Jalankan hitungan waktu tiap 1 detik saat tidak di-pause
  const startTimer = () => {
    clearInterval(timerId);
    timerId = setInterval(() => {
      if (!isPaused && elapsedSeconds < totalSeconds) {
        elapsedSeconds += 1;
        updateProgressUI();
      }
    }, 1000);
  };

  // Ambil file halaman dari folder pages/ lalu tampilkan di #main-content
  const loadPage = async (pageName) => {
    try {
      const response = await fetch(`pages/${pageName}.html`);
      if (!response.ok) throw new Error(`Halaman ${pageName} belum dibuat`);

      const htmlText = await response.text();
      mainContent.innerHTML = htmlText;

      // Tandai menu yang sedang aktif di sidebar kiri
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

  // Set info lagu, reset progress ke 0, buka sidebar kanan, dan mulai timer
  const playTrack = (title, artist, duration) => {
    if (npTitle) npTitle.textContent = title;
    if (npArtist) npArtist.textContent = artist;
    if (npDuration) npDuration.textContent = duration || "3:30";

    elapsedSeconds = 0;
    totalSeconds = parseDuration(duration);
    updateProgressUI();

    if (appLayout) {
      appLayout.classList.add("is-playing");
      appLayout.classList.remove("is-paused");
    }

    isPaused = false;
    if (vinylDisc) vinylDisc.style.animationPlayState = "running";
    if (npPlayBtn) npPlayBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
    startTimer();
  };

  // Tangkap klik navigasi, panah carousel, kartu lagu, play/pause, dan like
  document.body.addEventListener("click", (e) => {
    // Pindah halaman lewat elemen ber-class .nav-link
    const link = e.target.closest(".nav-link");
    if (link) {
      e.preventDefault();
      const targetPage = link.getAttribute("data-target");
      if (targetPage) loadPage(targetPage);
      return;
    }

    // Geser carousel trending ke kanan
    if (e.target.closest("#trending-next")) {
      const carousel = document.getElementById("trending-carousel");
      if (carousel)
        carousel.scrollBy({
          left: carousel.clientWidth + 20,
          behavior: "smooth",
        });
      return;
    }

    // Geser carousel trending ke kiri
    if (e.target.closest("#trending-prev")) {
      const carousel = document.getElementById("trending-carousel");
      if (carousel)
        carousel.scrollBy({
          left: -(carousel.clientWidth + 20),
          behavior: "smooth",
        });
      return;
    }

    // Putar lagu saat kartu di trending songs diklik
    const songCard = e.target.closest(".trending-card");
    if (songCard) {
      const title = songCard.querySelector("h4")?.textContent || "Unknown";
      const artist = songCard.querySelector("p")?.textContent || "Unknown";
      const duration =
        songCard.querySelector(".duration")?.textContent || "3:30";
      playTrack(title, artist, duration);
      return;
    }

    // Toggle play/pause serta putar/jeda piringan vinyl
    if (e.target.closest("#np-play") && npPlayBtn) {
      isPaused = !isPaused;
      if (appLayout) appLayout.classList.toggle("is-paused", isPaused);
      if (vinylDisc)
        vinylDisc.style.animationPlayState = isPaused ? "paused" : "running";
      npPlayBtn.innerHTML = isPaused
        ? `<i class="fa-solid fa-play"></i>`
        : `<i class="fa-solid fa-pause"></i>`;
      return;
    }

    // Toggle status tombol like
    if (e.target.closest("#np-like") && npLikeBtn) {
      isLiked = !isLiked;
      npLikeBtn.classList.toggle("liked", isLiked);
      npLikeBtn.innerHTML = isLiked
        ? `<i class="fa-solid fa-heart"></i>`
        : `<i class="fa-regular fa-heart"></i>`;
    }
  });

  // Muat halaman home saat aplikasi pertama kali dibuka
  loadPage("home");
});
