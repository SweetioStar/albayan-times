/* ============================================
   THE OPEN ALBAYAN TIMES - LIGHTBOX
   ============================================
   Opens gallery items in a full-screen view.
   ============================================ */

const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxAuthor = document.getElementById('lightboxAuthor');
const lightboxDate = document.getElementById('lightboxDate');
const lightboxClose = document.getElementById('lightboxClose');

if (lightbox) {
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            const img = item.querySelector('img');
            const title = item.getAttribute('data-title') || '';
            const author = item.getAttribute('data-author') || '';
            const date = item.getAttribute('data-date') || '';

            if (img) {
                lightboxImage.src = img.src;
                lightboxImage.alt = img.alt;
                lightboxTitle.textContent = title;
                lightboxAuthor.textContent = author;
                lightboxDate.textContent = date;

                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    // Close on button click
    lightboxClose.addEventListener('click', closeLightbox);

    // Close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
}