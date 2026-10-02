import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* ✅ Favicons */}
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" type="image/png" href="/favicon.png" />
          <link rel="apple-touch-icon" href="/favicon.png" />
          <link rel="shortcut icon" href="/favicon.ico" />

          {/* ✅ SEO Meta Tags */}
          <meta name="description" content="Momanto – India's #1 celebration platform. Birthdays, weddings, anniversaries delivered to your doorstep in Bhopal and across India." />
          <meta name="keywords" content="event planner Bhopal, birthday delivery, wedding planner, anniversary celebration, Momanto, celebration platform India" />
          <meta name="author" content="Momanto" />
          <meta name="robots" content="index, follow" />
          <meta name="theme-color" content="#ffffff" />
          <link rel="canonical" href="https://www.momanto.in" />

          {/* ✅ Google Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />


          {/* ✅ Open Graph (Facebook, WhatsApp, LinkedIn) */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Momanto" />
          <meta property="og:title" content="Momanto – Celebrations Delivered" />
          <meta property="og:description" content="India's #1 celebration platform. Birthdays, weddings, anniversaries delivered to your doorstep." />
          <meta property="og:url" content="https://www.momanto.in" />
          <meta property="og:image" content="https://www.momanto.in/og-image.jpg" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:locale" content="en_IN" />

          {/* ✅ Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Momanto – Celebrations Delivered" />
          <meta name="twitter:description" content="India's #1 celebration platform. Birthdays, weddings, anniversaries delivered to your doorstep." />
          <meta name="twitter:image" content="https://www.momanto.in/og-image.jpg" />
          <meta name="twitter:site" content="@momanto" />

          {/* ✅ Schema - Organization */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Momanto",
                "url": "https://www.momanto.in",
                "logo": "https://www.momanto.in/logo.png",
                "description": "India's #1 celebration platform for birthdays, weddings and anniversaries.",
                "sameAs": [
                  "https://www.facebook.com/momanto",
                  "https://twitter.com/momanto",
                  "https://www.instagram.com/momanto"
                ],
                "contactPoint": {
                  "@type": "ContactPoint",
                  "telephone": "+91-123-456-7890",
                  "contactType": "customer service",
                  "areaServed": "IN",
                  "availableLanguage": ["English", "Hindi"]
                }
              })
            }}
          />

          {/* ✅ Schema - LocalBusiness */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                "name": "Momanto",
                "image": "https://www.momanto.in/logo.png",
                "logo": "https://www.momanto.in/logo.png",
                "url": "https://www.momanto.in",
                "telephone": "+91-123-456-7890",
                "priceRange": "₹₹",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "123 Event Street",
                  "addressLocality": "Bhopal",
                  "addressRegion": "Madhya Pradesh",
                  "postalCode": "462001",
                  "addressCountry": "IN"
                },
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": "23.2599",
                  "longitude": "77.4126"
                },
                "openingHoursSpecification": [
                  {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
                    "opens": "09:00",
                    "closes": "17:00"
                  }
                ]
              })
            }}
          />

          {/* ✅ Schema - WebSite with SearchAction */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "Momanto",
                "url": "https://www.momanto.in",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://www.momanto.in/search?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              })
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
