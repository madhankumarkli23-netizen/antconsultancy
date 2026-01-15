document.addEventListener('DOMContentLoaded', () => {
  smoothScroll();
  setupAccordions();
  setupCountUps();
  setupCarousel();
  setupForm();
  setupNews();
  setupAudio();
  setYear();
});

function smoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function setupAccordions() {
  const items = document.querySelectorAll('.accordion-item');
  items.forEach((item) => {
    const trigger = item.querySelector('.accordion-trigger');
    trigger?.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      items.forEach((i) => i.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });
}

function setupCountUps() {
  const targets = document.querySelectorAll('[data-countup]');
  if (!targets.length) return;

  const animate = (el) => {
    const target = parseFloat(el.dataset.countup);
    if (Number.isNaN(target)) return;
    const isDecimal = !Number.isInteger(target);
    const duration = 900;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = target * easeOutCubic(progress);
      el.textContent = isDecimal ? value.toFixed(1) : Math.round(value).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          if (!el.dataset.played) {
            animate(el);
            el.dataset.played = 'true';
          }
          obs.unobserve(el);
        }
      });
    },
    { threshold: 0.3 }
  );

  targets.forEach((el) => observer.observe(el));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function setupCarousel() {
  const track = document.querySelector('.carousel-track');
  const slides = track ? Array.from(track.children) : [];
  if (!track || slides.length === 0) return;

  let index = 0;
  const prev = document.getElementById('prevTestimonial');
  const next = document.getElementById('nextTestimonial');

  const update = () => {
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
  };

  const goPrev = () => {
    index = index === 0 ? slides.length - 1 : index - 1;
    update();
  };

  const goNext = () => {
    index = index === slides.length - 1 ? 0 : index + 1;
    update();
  };

  prev?.addEventListener('click', goPrev);
  next?.addEventListener('click', goNext);

  let auto = setInterval(goNext, 5500);
  const resetAuto = () => {
    clearInterval(auto);
    auto = setInterval(goNext, 5500);
  };

  prev?.addEventListener('click', resetAuto);
  next?.addEventListener('click', resetAuto);

  update();
}

function setupForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const hint = form.querySelector('.form-hint');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = data.get('name') || 'there';
    if (hint) {
      hint.textContent = `Thanks, ${name}! We will reach out within one business day.`;
    }
    form.reset();
  });
}

function setYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

function setupNews() {
  const list = document.getElementById('newsList');
  const refresh = document.getElementById('refreshNews');
  if (!list) return;

  const sources = [
    {
      label: 'Money & tax',
      url: 'https://api.allorigins.win/raw?url=https%3A%2F%2Fwww.livemint.com%2Frss%2Fmoney'
    }
  ];

  const renderPlaceholder = (text) => {
    list.innerHTML = `<div class="news-placeholder">${text}</div>`;
  };

  const fetchFeed = async () => {
    try {
      renderPlaceholder('Loading live headlines…');
      const feed = sources[0];
      const res = await fetch(feed.url, { cache: 'no-store' });
      if (!res.ok) throw new Error('Feed unavailable');
      const xml = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      const items = Array.from(doc.querySelectorAll('item')).slice(0, 6);
      if (!items.length) throw new Error('No items found');
      list.innerHTML = items
        .map((item) => {
          const title = item.querySelector('title')?.textContent?.trim() || 'Untitled';
          const link = item.querySelector('link')?.textContent?.trim() || '#';
          const date = item.querySelector('pubDate')?.textContent;
          const pub = date ? new Date(date).toLocaleString() : 'Recent';
          const desc = item.querySelector('description')?.textContent?.replace(/<[^>]*>/g, '') || '';
          return `
            <article class="news-item">
              <h4><a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a></h4>
              <div class="news-meta-line">
                <span>${feed.label}</span>
                <span>•</span>
                <span>${pub}</span>
              </div>
              <p>${desc.slice(0, 180)}${desc.length > 180 ? '…' : ''}</p>
            </article>
          `;
        })
        .join('');
    } catch (err) {
      renderPlaceholder('Could not load live headlines right now. Please retry in a moment.');
    }
  };

  refresh?.addEventListener('click', fetchFeed);
  fetchFeed();
}

function setupAudio() {
  const toggle = document.getElementById('bgmToggle');
  if (!toggle) return;
  let audio;
  let isPlaying = false;
  const sources = [
    'https://cdn.pixabay.com/download/audio/2022/10/31/audio_c3d80b4bce.mp3?filename=ambient-11277.mp3',
    'https://cdn.pixabay.com/download/audio/2022/10/22/audio_72b36e9a18.mp3?filename=calm-ambient-11065.mp3'
  ];
  let sourceIndex = 0;

  const updateLabel = () => {
    toggle.textContent = isPlaying ? 'Pause focus BGM' : 'Play focus BGM';
  };

  toggle.addEventListener('click', async () => {
    try {
      if (!audio) {
        audio = new Audio(sources[sourceIndex]);
        audio.loop = true;
        audio.volume = 0.25;
        audio.addEventListener('error', () => {
          if (sourceIndex < sources.length - 1) {
            sourceIndex += 1;
            audio.src = sources[sourceIndex];
            audio.load();
            audio.play().catch(() => {});
          } else {
            toggle.textContent = 'BGM unavailable';
            toggle.disabled = true;
          }
        });
      }
      if (isPlaying) {
        audio.pause();
        isPlaying = false;
      } else {
        await audio.play();
        isPlaying = true;
      }
      updateLabel();
    } catch (err) {
      toggle.textContent = 'BGM unavailable';
      toggle.disabled = true;
    }
  });

  updateLabel();
}
