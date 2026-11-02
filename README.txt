TÁROVAÉ website: deployment notes
==================================

FILES
  index.html      Home
  services.html   Services
  about.html      About Us
  contact.html    Contact Us (FAQ + enquiry form)
  css/style.css   All styles (colours, fonts, sizes are variables at the top, in :root)
  js/main.js      Menu, tabs, FAQ, team slider, form
  assets/images/  All images

DEPLOY
  Upload the whole folder to the web root (public_html / htdocs / any static host).
  No build step or database needed. Open index.html to start.
  Fonts load from Google Fonts, so the server/visitor needs internet access.

CONTACT FORM (contact.html)
  The form validates in the browser and sends the enquiry to the salon's WhatsApp
  (see WHATSAPP NOTIFICATIONS below). Optional: set data-endpoint on
  <form id="contactForm" data-endpoint="https://..."> (Formspree etc.) to also receive it there.

CONTENT THAT STILL NEEDS THE CLIENT'S REAL DATA
  - services.html: Women, Common Services and Kids tabs (sample services and prices).
  - index.html: Nails & Beauty, Makeup and Hair tabs (sample services and prices).
  - about.html: team cards (4 sample cards using the same photo, name ZOYA).
  - contact.html: FAQ answers for Skin (questions 2-5), and all Hair / Aesthetics FAQs.
  - Social media links in the footer (currently "#").

SEO / EXTRAS TO ADD BEFORE GO-LIVE (optional)
  favicon, Open Graph image, Google Analytics, Google Maps embed, privacy / terms pages.


BOOKING MODAL (every "Book Appointment" button)
  js/booking.js  : 4-step flow: Service > Your Details > Select Slot > Consent > Success (membership step removed).
  css/booking.css : modal styles (dark brand theme #1f0302) (560px wide on desktop, full-screen sheet on phones).
  - Services, prices, time slots and consent texts are lists at the top of js/booking.js.
  - Clicking "Book Appointment" on a service card opens the modal with that service pre-selected.
  - To RECEIVE bookings: set CONFIG.endpoint in js/booking.js to a URL that accepts a JSON POST
    (Formspree, Google Apps Script, your own API). Payload: service, category, price, name, email,
    whatsapp, date, time, consent, source.
  - Every booking is also sent to the salon's WhatsApp (see WHATSAPP NOTIFICATIONS below).
  - Sample service names/prices for Brows and Body are placeholders: confirm with the client.

CHANGES (31 Oct 2026, designer feedback)
  - Logo in header and mobile menu is 30px tall; header logo colour is #F4F1EA.
  - Brand name is written TÁROVAÉ everywhere in the text (email address unchanged).
  - Same dark header (#1f0302) on every page; the light header on About / Contact is removed.
  - Header and buttons use #F4F1EA instead of white, and #1f0302 for dark.
  - Every button uses the header button design: 4px radius, 13px 28px padding (45px tall),
    Inter 14px semibold. Change them all at once with --radius-btn and --btn-pad in css/style.css.
  - Rounded corners on photos: --radius-img (32px) and --radius-img-sm (24px) in css/style.css.
  - Long dashes removed from the site text.
  - All headings are semibold (600): --fw-heading in css/style.css.

CHANGES (31 Oct 2026, second round)
  - Contact page FAQ: new Skin, Hair and Aesthetics questions and answers (5 each).
  - Booking modal: membership (5th) step removed; dark brand theme for header, steps,
    selected category, day, time slot and success icon.
  - Services page: "View More" smoothly opens a "Chemical Hair Treatments" section
    (Keratin, Botox, Smoothening, Kera Smooth, Perming) in the Women and Men tabs; the button
    then reads "View Less" and closes it smoothly. Tabs without extra services hide the button.
    To add more services there, copy a card inside <div class="s-extra"> in services.html.

CHANGES (31 Oct 2026, third round)
  - Services page opens on the Women tab.
  - Common Services: "Manicure & Pedicure" (Classic, Premium, Luxury) is shown first; "View More"
    opens the Skin services. A consultation charges note (First Visit, Second Visit) shows below.
  - Booking modal has a close (X) icon on desktop and mobile.
  - Contact page FAQ keeps the accordion design: the first question of each tab is open, the rest
    are closed, and opening one closes the others. Inside an open question, a photo sits beside the
    answer. All 15 answers use assets/images/faq-thumb.jpg for now: to use a different photo for a
    question, change its <img src> in contact.html (portrait photo, about 300 x 400 px).

CHANGES (31 Oct 2026, fourth round)
  - Every button on the site (including the contact form and booking popup) has the same size and
    style as the header "Book Appointment" button: 45px tall, 28px side padding, 4px radius,
    Inter 14px semibold.
  - Hover swaps the colours smoothly: light buttons turn dark brand (#1f0302) with light text,
    dark buttons turn light (#F4F1EA) with dark text, outline buttons fill dark with light text.

WHATSAPP NOTIFICATIONS (booking popup + contact form)
  Alerts go to +91 8160440298 and +91 8780715510. Numbers and keys are at the top of
  js/main.js (TAROVAE_NOTIFY.numbers).

  A) Automatic (recommended): the alert arrives on BOTH numbers by itself after every submit.
     Uses the free CallMeBot service. Do this once on EACH of the two phones:
       1. Open https://www.callmebot.com/blog/free-api-whatsapp-messages/ on that phone.
       2. Save the CallMeBot number shown there in contacts.
       3. Send it this WhatsApp message: I allow callmebot to send me messages
       4. You get a reply with that phone's API key, for example 123456.
       5. In js/main.js put the key next to that number:  { phone: '918160440298', key: '123456' },
     Upload the site again. A number without a key gets no automatic alert.
     Note: CallMeBot's free API is meant for personal use and has no guarantee. For a business-grade
     setup, the official WhatsApp Business API (through a provider such as Interakt, WATI or Twilio)
     needs a small backend; ask your developer.

  B) Until a key is set: after submitting, WhatsApp opens on the visitor's phone with all the
     details already typed to the FIRST number (8160440298), and the visitor taps Send.
     WhatsApp can only send to one chat at a time this way, so the second number needs option A.
