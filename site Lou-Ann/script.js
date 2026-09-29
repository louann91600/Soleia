const product = { id: 'soleia-spf50', name: 'Crème solaire SPF 50', price: 24, size: '50 ml' };
const cartKey = 'soleia-cart-v1';
let quantity = 1;
let toastTimer;

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(cartKey) || '[]');
    return Array.isArray(saved) ? saved.filter((item) => item.id === product.id && Number.isInteger(item.quantity) && item.quantity > 0) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(cartKey, JSON.stringify(cart));
  renderCart();
}

function cartQuantity() {
  return readCart().reduce((total, item) => total + item.quantity, 0);
}

function formatPrice(price) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
}

function renderCart() {
  const cart = readCart();
  const count = cartQuantity();
  document.querySelectorAll('[data-cart-count]').forEach((element) => { element.textContent = String(count); });
  const content = document.querySelector('[data-cart-content]');
  if (!content) return;
  if (!cart.length) {
    content.innerHTML = '<div class="cart-empty"><p>Votre panier attend<br>son premier rayon de soleil.</p><a class="button button-dark" href="produit.html">Découvrir la crème <span>↗</span></a></div>';
    return;
  }
  const item = cart[0];
  const subtotal = item.quantity * product.price;
  content.innerHTML = `<div class="cart-line"><div class="cart-mini-tube"><div class="tube"><div class="tube-cap"></div><div class="tube-print"><span class="tube-brand">soleia</span><span class="tube-title">Crème<br>solaire</span><span class="tube-spf">SPF 50</span></div></div><img class="cart-mini-image" data-cart-product-image src="images/11.png" alt="Crème solaire Soleia SPF 50"></div><div class="cart-line-info"><strong>${product.name}</strong><span>${product.size} · Visage & corps</span><div class="cart-qty"><button type="button" data-cart-decrease aria-label="Retirer une unité">−</button><span>${item.quantity}</span><button type="button" data-cart-increase aria-label="Ajouter une unité">+</button></div></div><span class="cart-line-price">${formatPrice(subtotal)}</span></div><div class="cart-totals"><p><span>Sous-total</span><strong>${formatPrice(subtotal)}</strong></p><button type="button" class="button button-dark" data-checkout>Continuer vers le paiement <span>↗</span></button><small>Livraison calculée à l'étape suivante. Paiement non disponible dans cette maquette.</small></div>`;
  const cartImage = content.querySelector('[data-cart-product-image]');
  const setCartImageState = () => content.querySelector('.cart-mini-tube')?.classList.toggle('is-image-loaded', cartImage.naturalWidth > 0);
  cartImage.addEventListener('load', setCartImageState, { once: true });
  cartImage.addEventListener('error', () => content.querySelector('.cart-mini-tube')?.classList.remove('is-image-loaded'), { once: true });
  if (cartImage.complete) setCartImageState();
}

function showToast(message) {
  const toast = document.querySelector('[data-toast]');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

function updateQuantity(nextQuantity) {
  quantity = Math.max(1, Math.min(99, nextQuantity));
  const output = document.querySelector('[data-quantity]');
  if (output) output.textContent = String(quantity);
}

function setupCarousel() {
  const carousel = document.querySelector('[data-carousel]');
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll('[data-carousel-slide]')];
  const dots = carousel.querySelector('[data-carousel-dots]');
  const currentCount = document.querySelector('[data-carousel-count]');
  const currentNumber = document.querySelector('[data-carousel-current]');
  if (!slides.length || !dots) return;

  let activeIndex = 0;
  let paused = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (currentCount) currentCount.textContent = String(slides.length).padStart(2, '0');

  slides.forEach((slide, index) => {
    const image = slide.querySelector('img');
    const setImageState = () => slide.classList.toggle('image-ready', image.naturalWidth > 0);
    image.addEventListener('load', setImageState);
    image.addEventListener('error', () => slide.classList.remove('image-ready'));
    if (image.complete) setImageState();

    const dot = document.createElement('button');
    dot.className = 'carousel-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Afficher l'image ${index + 1} sur ${slides.length}`);
    dot.setAttribute('aria-pressed', String(index === activeIndex));
    dot.dataset.carouselTo = String(index);
    dots.append(dot);
  });

  function showSlide(nextIndex) {
    activeIndex = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      const isActive = index === activeIndex;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
      dots.children[index].setAttribute('aria-pressed', String(isActive));
    });
    if (currentNumber) currentNumber.textContent = String(activeIndex + 1).padStart(2, '0');
  }

  carousel.querySelector('[data-carousel-prev]')?.addEventListener('click', () => showSlide(activeIndex - 1));
  carousel.querySelector('[data-carousel-next]')?.addEventListener('click', () => showSlide(activeIndex + 1));
  dots.addEventListener('click', (event) => {
    const dot = event.target.closest('[data-carousel-to]');
    if (dot) showSlide(Number(dot.dataset.carouselTo));
  });
  carousel.addEventListener('pointerenter', () => { paused = true; });
  carousel.addEventListener('pointerleave', () => { paused = false; });
  carousel.addEventListener('focusin', () => { paused = true; });
  carousel.addEventListener('focusout', (event) => {
    if (!carousel.contains(event.relatedTarget)) paused = false;
  });
  window.setInterval(() => {
    if (!paused && !document.hidden && !reducedMotion) showSlide(activeIndex + 1);
  }, 5000);
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target) return;
  if (target.matches('[data-quantity-minus]')) updateQuantity(quantity - 1);
  if (target.matches('[data-quantity-plus]')) updateQuantity(quantity + 1);
  if (target.matches('[data-add-to-cart]')) {
    const cart = readCart();
    const existing = cart.find((item) => item.id === product.id);
    if (existing) existing.quantity = Math.min(99, existing.quantity + quantity);
    else cart.push({ id: product.id, quantity });
    saveCart(cart);
    document.querySelector('[data-cart-dialog]')?.showModal();
  }
  if (target.matches('[data-open-cart]')) document.querySelector('[data-cart-dialog]')?.showModal();
  if (target.matches('[data-close-cart]')) document.querySelector('[data-cart-dialog]')?.close();
  if (target.matches('[data-cart-increase]') || target.matches('[data-cart-decrease]')) {
    const cart = readCart();
    const item = cart.find((entry) => entry.id === product.id);
    if (!item) return;
    item.quantity += target.matches('[data-cart-increase]') ? 1 : -1;
    saveCart(cart.filter((entry) => entry.quantity > 0));
  }
  if (target.matches('[data-checkout]')) showToast('Le paiement sera bientôt disponible. Merci pour votre intérêt !');
  if (target.matches('[data-menu-toggle]')) {
    const nav = document.querySelector('[data-main-nav]');
    const expanded = target.getAttribute('aria-expanded') === 'true';
    target.setAttribute('aria-expanded', String(!expanded));
    nav?.classList.toggle('is-open', !expanded);
  }
});

document.querySelector('[data-cart-dialog]')?.addEventListener('click', (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});

document.querySelectorAll('[data-main-nav] a').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelector('[data-main-nav]')?.classList.remove('is-open');
    document.querySelector('[data-menu-toggle]')?.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('[data-newsletter]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = form.querySelector('[data-newsletter-message]');
    if (message) message.textContent = 'Merci, votre inscription de démonstration est notée.';
    form.reset();
  });
});

renderCart();
setupCarousel();