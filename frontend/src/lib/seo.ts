export interface ExamPage {
  slug: string;
  title: string;
  description: string;
  examFullName: string;
}

export const examPages: ExamPage[] = [
  {
    slug: "jee-mock-test",
    title: "JEE Mock Test — Free AI-Powered Practice for JEE Main & Advanced",
    description:
      "Practice JEE Main and Advanced with AI-generated mock tests. Upload past papers and get instant practice tests with detailed explanations. Free online JEE mock test series.",
    examFullName: "Joint Entrance Examination (JEE)",
  },
  {
    slug: "neet-mock-test",
    title: "NEET Mock Test — Free AI Practice for NEET UG",
    description:
      "Prepare for NEET UG with AI-powered mock tests. Upload question papers and get instant practice tests with solutions. Free online NEET mock test series.",
    examFullName: "National Eligibility cum Entrance Test (NEET)",
  },
  {
    slug: "wbjee-mock-test",
    title: "WBJEE Mock Test — Free AI Practice for WBJEE",
    description:
      "Practice WBJEE with AI-generated mock tests. Upload past papers and get instant practice tests. Free online WBJEE mock test series for West Bengal engineering aspirants.",
    examFullName: "West Bengal Joint Entrance Examination (WBJEE)",
  },
  {
    slug: "cuet-mock-test",
    title: "CUET Mock Test — Free AI Practice for CUET UG & PG",
    description:
      "Prepare for CUET UG and PG with AI-powered mock tests. Upload question papers and get instant practice tests. Free online CUET mock test series.",
    examFullName: "Common University Entrance Test (CUET)",
  },
];

export function generateWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "FOURI.IN",
    url: "https://fouri.in",
    description:
      "AI-powered mock test platform. Upload question papers and get instant AI-generated practice tests for JEE, NEET, WBJEE, CUET and more.",
    applicationCategory: "EducationalApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  };
}

export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateCourseJsonLd(
  name: string,
  description: string,
  exam: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    provider: {
      "@type": "Organization",
      name: "FOURI.IN",
      sameAs: "https://fouri.in",
    },
    teaches: exam,
  };
}
