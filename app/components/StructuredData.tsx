// JSON-LD Structured Data Component for SEO
export function LocalBusinessStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://resonancejamroom.in",
    name: "Resonance Jam Room",
    alternateName: "Resonance Studio",
    description:
      "Professional recording studio and jam room in Pune offering music recording, mixing, mastering, podcast production, karaoke sessions, and band rehearsals.",
    url: "https://resonancejamroom.in",
    telephone: ["+919822029235", "+919890158080", "+919011307068"],
    email: "resonancestudio12@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "45, Shivprasad Housing Society, Dattawadi",
      addressLocality: "Pune",
      addressRegion: "Maharashtra",
      postalCode: "411030",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 18.4929,
      longitude: 73.8505,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "08:00",
      closes: "22:00",
    },
    priceRange: "₹200 - ₹1200",
    image: "https://resonancejamroom.in/android-chrome-512x512.png",
    sameAs: [],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Studio Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Jam Room / Rehearsal Studio",
            description: "Professional rehearsal space for bands and musicians",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Karaoke Room",
            description: "Karaoke sessions with professional sound system",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Audio Recording",
            description: "Professional music recording, mixing, and mastering",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Video Recording",
            description: "4K music video recording with professional editing",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Podcast Production",
            description: "Professional podcast recording studio",
          },
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// FAQ Page Structured Data for rich snippets
export function FAQPageStructuredData() {
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I book a studio at Resonance Jam Room?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can book online through our website by filling the booking request form, or contact us directly via phone.",
        },
      },
      {
        "@type": "Question",
        name: "What are your operating hours?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our standard operating hours are from 8:00 AM to 10:00 PM. Outside hours can be arranged with prior request.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need to pay in advance?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No advance payment required. You pay at the studio after your session via cash or UPI.",
        },
      },
      {
        "@type": "Question",
        name: "Which studio should I choose?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Studio A is best for large bands and karaoke groups (up to 30). Studio B is ideal for medium karaoke groups (up to 12) and small bands. Studio C is perfect for recording, podcasts, and intimate sessions.",
        },
      },
      {
        "@type": "Question",
        name: "Do you provide instruments?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! Studio A has drums, electric guitars, keyboard, guitar amps, and bass amp. Other studios have basic equipment.",
        },
      },
      {
        "@type": "Question",
        name: "What is your cancellation policy?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Free cancellation with 24+ hours notice. Less than 24 hours: ₹100 fee. No-show: ₹200 penalty (payable at next booking).",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
    />
  );
}
