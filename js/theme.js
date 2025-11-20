(function () {
	function normalizeKey(str) {
		if (!str) return '';
		const from = "ÁÉÍÓÚáéíóúÑñÜü";
		const to   = "AEIOUaeiouNnUu";
		let s = str.trim();
		for (let i = 0; i < from.length; i++) s = s.replace(new RegExp(from[i], 'g'), to[i]);
		s = s.toLowerCase();
		s = s.replace(/[^a-z0-9]+/g, '-');
		s = s.replace(/-+/g, '-').replace(/(^-|-$)/g, '');
		return s;
	}

	function init() {
	  /* ========== FILTRADO ANIMADO ========== */
	  (function () {
			const filtroNav = document.querySelector('.filtro-nav');
			const filtroLinks = filtroNav ? Array.from(filtroNav.querySelectorAll('.filtro-link')) : [];
			const cards = Array.from(document.querySelectorAll('.propiedad-card'));

			if (!filtroNav || !filtroLinks.length || !cards.length) {
			  // nothing to do
			} else {
			  // Pre-calc status por tarjeta para evitar recalcular en cada click
			  cards.forEach(card => {
				let status = (card.dataset.status || '').toString().trim();
				if (!status) {
				  const tag = card.querySelector('.propiedad-estado');
				  status = tag ? tag.innerText : '';
				}
				card.dataset._statusNorm = normalizeKey(status);
			  });

			  function setActive(link) {
				filtroLinks.forEach(l => l.classList.toggle('active', l === link));
			  }

			  function clearPendingTransition(card) {
				// Si había un handler pendiente, eliminarlo para evitar que ejecute y oculte la tarjeta después
				if (card._onEndHandler) {
				  card.removeEventListener('transitionend', card._onEndHandler);
				  delete card._onEndHandler;
				}
				// quitar la marca de "hiding" si existe (porque se está mostrando)
				if (card.dataset.hiding) delete card.dataset.hiding;
			  }

			  function hideCard(card) {
				// si ya está oculto por completo, no hacer nada
				if (card.style.display === 'none' || card.classList.contains('hidden') && card.dataset.hiding === '1') return;

				// cancelar handlers pendientes previos (evita race conditions)
				clearPendingTransition(card);

				card.dataset.hiding = '1';
				// iniciar animación de salida
				card.classList.add('hidden');

				// crear handler con referencia para poder eliminarlo si se muestra antes de que termine
				const onEnd = function (e) {
				  if (e.propertyName !== 'opacity') return;
				  card.style.display = 'none';
				  card.removeEventListener('transitionend', onEnd);
				  delete card._onEndHandler;
				  if (card.dataset.hiding) delete card.dataset.hiding;
				};
				card._onEndHandler = onEnd;
				card.addEventListener('transitionend', onEnd);
			  }

			  function showCard(card) {
				// cancelar cualquier transitionend pendiente que pudiera ocultar la tarjeta después
				clearPendingTransition(card);

				// asegurar display antes de quitar la clase hidden para que la transición ocurra
				if (card.style.display === 'none' || getComputedStyle(card).display === 'none') {
				  card.style.display = '';
				}
				// forzar reflow
				card.offsetHeight;
				card.classList.remove('hidden');
			  }

			  function applyFilter(filterKey) {
				const key = normalizeKey(filterKey || 'all');
				if (key === 'all' || !key) {
				  cards.forEach(c => showCard(c));
				  return;
				}
				cards.forEach(c => {
				  const statusNorm = (c.dataset._statusNorm || '').toLowerCase();
				  if (statusNorm !== key) hideCard(c);
				  else showCard(c);
				});
			  }

			  // Delegación: único listener en filtroNav
			  filtroNav.addEventListener('click', function (e) {
				const link = e.target.closest('.filtro-link');
				if (!link) return;
				e.preventDefault();
				const key = link.dataset.filter || 'all';
				setActive(link);
				applyFilter(key);
			  });

			  // aplicar filtro inicial (sin animación)
			  const initial = document.querySelector('.filtro-link.active');
			  if (initial) {
				applyFilter(initial.dataset.filter || 'all');
			  }
			}
		  })();

		  /* ========== LANGUAGE SELECTOR ========== */
		  (function initLangMenu() {
			const container = document.querySelector('.navbar-traductor');
			if (!container) return;
			if (container.querySelector('.lang-menu')) return;

			// mapa de idiomas -> flag PNG/JPEG
			const languages = [
			  { code: 'es', label: 'Español', flag: 'gt.png' },        // Guatemala
			  { code: 'en', label: 'English', flag: 'us.png' },         // USA
			  { code: 'zh-CN', label: '中文', flag: 'cn.png' },         // China
			  { code: 'hi', label: 'हिन्दी', flag: 'in.png' },         // India
			  { code: 'ar', label: 'العربية', flag: 'sa.png' },        // Saudi Arabia
			  { code: 'bn', label: 'বাংলা', flag: 'bd.png' },          // Bangladesh
			  { code: 'pt', label: 'Português', flag: 'pt.png' },       // Portugal
			  { code: 'ru', label: 'Русский', flag: 'ru.png' },         // Russia
			  { code: 'ja', label: '日本語', flag: 'jp.png' },          // Japan
			  { code: 'fr', label: 'Français', flag: 'fr.png' }         // France
			];

			const menu = document.createElement('div');
			menu.className = 'lang-menu';

			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'lang-button';
			btn.setAttribute('aria-haspopup', 'listbox');
			btn.setAttribute('aria-expanded', 'false');

			const list = document.createElement('ul');
			list.className = 'lang-dropdown';
			list.setAttribute('role', 'listbox');

			const match = document.cookie.match(/googtrans=\/[a-zA-Z-]+\/([a-zA-Z-]+)/);
			let current = match ? match[1] : (navigator.language || 'es').split('-')[0];

			function renderButton(selectedCode) {
			  const item = languages.find(l => l.code === selectedCode) || languages[0];
			  btn.innerHTML = `<img src="images/flags/${item.flag}" alt="${item.label}" class="lang-flag"> <span class="lang-label">${item.label}</span> <span class="lang-caret">▾</span>`;
			}

			languages.forEach(l => {
			  const li = document.createElement('li');
			  li.className = 'lang-item';
			  li.setAttribute('role', 'option');
			  li.dataset.lang = l.code;
			  li.innerHTML = `<img src="images/flags/${l.flag}" alt="${l.label}" class="lang-flag"> <span class="lang-text">${l.label}</span>`;
			  li.addEventListener('click', () => {
				const expires = new Date(Date.now() + 365*24*60*60*1000).toUTCString();
				document.cookie = `googtrans=/es/${l.code};path=/;expires=${expires}`;
				list.classList.remove('open');
				btn.setAttribute('aria-expanded', 'false');
				setTimeout(() => location.reload(), 80);
			  });
			  list.appendChild(li);
			  if (l.code === current) li.setAttribute('aria-selected', 'true');
			});

			renderButton(current);
			menu.appendChild(btn);
			menu.appendChild(list);
			container.appendChild(menu);

			btn.addEventListener('click', () => {
			  const open = list.classList.toggle('open');
			  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
			});

			document.addEventListener('click', e => {
			  if (!menu.contains(e.target)) {
				list.classList.remove('open');
				btn.setAttribute('aria-expanded', 'false');
			  }
			});

			const googleWidget = document.querySelector('.goog-te-gadget-simple');
			if (googleWidget) googleWidget.style.display = 'none';
		  })();

		  /* ========== THEME TOGGLE (multiples botones) ========== */
		  (function () {
			const root = document.documentElement;
			const toggles = Array.from(document.querySelectorAll('.theme-toggle'));
			if (!toggles.length) return;

			// estado guardado / preferencia sistema
			const saved = localStorage.getItem('theme');
			const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
			const initialDark = saved === 'dark' || (!saved && prefersDark);

			function applyTheme(isDark) {
			  if (isDark) root.setAttribute('data-theme', 'dark');
			  else root.removeAttribute('data-theme');
			  
			  toggles.forEach(t => {
				t.classList.toggle('active', isDark);
				t.setAttribute('aria-pressed', isDark ? 'true' : 'false');
			  });
			}

			// Aplica tema inicial
			applyTheme(initialDark);

			// Listeners
			toggles.forEach(t => {
			  if (!t.dataset.listenerAttached) {
				t.addEventListener('click', () => {
				  const nowDark = root.getAttribute('data-theme') === 'dark';
				  applyTheme(!nowDark);
				  localStorage.setItem('theme', !nowDark ? 'dark' : 'light');
				});
				t.dataset.listenerAttached = '1';
			  }
			});

			// Responder cambios en preferencia del sistema
			if (window.matchMedia) {
			  try {
				window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
				  if (!localStorage.getItem('theme')) applyTheme(e.matches);
				});
			  } catch (err) {
				const mq = window.matchMedia('(prefers-color-scheme: dark)');
				if (mq.addListener) mq.addListener(e => { if (!localStorage.getItem('theme')) applyTheme(e.matches); });
			  }
			}
		  })();

		  /* ========== FAQ Y MATERIALES TOGGLES ========== */
		  (function () {
			const faqToggles = document.querySelectorAll('.faq-toggle');
			const materialToggles = document.querySelectorAll('.material-toggle');

			faqToggles.forEach(toggle => {
			  toggle.addEventListener('click', () => {
				const info = toggle.nextElementSibling;
				info.style.display = info.style.display === 'block' ? 'none' : 'block';
			  });
			});

			materialToggles.forEach(toggle => {
			  toggle.addEventListener('click', () => {
				const info = toggle.nextElementSibling;
				info.style.display = info.style.display === 'block' ? 'none' : 'block';
			  });
			});
		  })();

		  /* ========== LIGHTBOX MINIATURAS ========== */
	  (function () {
		const lightbox = document.getElementById('lightbox');
		if (!lightbox) return;

		const lightboxImg = document.getElementById('lightbox-img');
		const miniaturas = Array.from(document.querySelectorAll('.miniatura'));
		const btnPrev = document.querySelector('.lightbox-nav.prev');
		const btnNext = document.querySelector('.lightbox-nav.next');

		let currentIndex = 0;
		let zoomed = false;
		let startX = 0;

		function showImage(index) {
		  currentIndex = index;
		  const img = miniaturas[index];
		  lightboxImg.src = img.src;
		  lightbox.style.display = 'flex';
		  lightboxImg.style.transform = 'scale(1)';
		  lightboxImg.style.cursor = 'zoom-in';
		  zoomed = false;
		  miniaturas.forEach(m => m.classList.remove('selected'));
		  img.classList.add('selected');
		}

		miniaturas.forEach((img, i) => {
		  img.addEventListener('click', () => showImage(i));
		});

		if (btnPrev) {
		  btnPrev.addEventListener('click', () => {
			currentIndex = (currentIndex - 1 + miniaturas.length) % miniaturas.length;
			showImage(currentIndex);
		  });
		}

		if (btnNext) {
		  btnNext.addEventListener('click', () => {
			currentIndex = (currentIndex + 1) % miniaturas.length;
			showImage(currentIndex);
		  });
		}

		lightbox.addEventListener('click', (e) => {
		  if (e.target === lightbox || e.target === lightboxImg) {
			lightbox.style.display = 'none';
			miniaturas.forEach(m => m.classList.remove('selected'));
		  }
		});

		document.addEventListener('keydown', (e) => {
		  if (lightbox.style.display === 'flex') {
			if (e.key === 'Escape') lightbox.style.display = 'none';
			if (e.key === 'ArrowLeft' && btnPrev) btnPrev.click();
			if (e.key === 'ArrowRight' && btnNext) btnNext.click();
		  }
		});

		lightboxImg.addEventListener('dblclick', () => {
		  zoomed = !zoomed;
		  lightboxImg.style.transform = zoomed ? 'scale(1.8)' : 'scale(1)';
		  lightboxImg.style.cursor = zoomed ? 'zoom-out' : 'zoom-in';
		});

		lightboxImg.addEventListener('wheel', (e) => {
		  e.preventDefault();
		  zoomed = !zoomed;
		  lightboxImg.style.transform = zoomed ? 'scale(1.8)' : 'scale(1)';
		  lightboxImg.style.cursor = zoomed ? 'zoom-out' : 'zoom-in';
		});

		lightbox.addEventListener('touchstart', (e) => {
		  startX = e.touches[0].clientX;
		});

		lightbox.addEventListener('touchend', (e) => {
		  const endX = e.changedTouches[0].clientX;
		  const deltaX = endX - startX;
		  if (Math.abs(deltaX) > 50) {
			if (deltaX > 0 && btnPrev) btnPrev.click();
			else if (deltaX < 0 && btnNext) btnNext.click();
		  }
		});
	  })();
	}

	// Ejecutar init inmediatamente si el DOM ya se cargó, else esperar DOMContentLoaded
	if (document.readyState === 'loading') {
	  document.addEventListener('DOMContentLoaded', init);
	} else {
	  init();
	}
  }());
