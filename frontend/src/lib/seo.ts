export interface ExamPage {
  slug: string;
  title: string;
  description: string;
  examFullName: string;
  heroTitle: string;
  heroSubtitle: string;
  badge: string;
  features: { icon: string; title: string; desc: string }[];
  howItWorks: { title: string; desc: string }[];
  subjects: string[];
  whoShouldUse: string[];
  benefits: { title: string; desc: string }[];
  studyTips: { icon: string; title: string; desc: string }[];
  faqs: { q: string; a: string }[];
  comparison: { feature: string; available: boolean }[];
}

export const examPages: ExamPage[] = [
  {
    slug: "jee-mock-test",
    title: "JEE Mock Test — Free AI-Powered Practice for JEE Main & Advanced",
    description:
      "Practice JEE Main and Advanced with AI-generated mock tests. Upload past papers and get instant practice tests with detailed explanations. Free online JEE mock test series.",
    examFullName: "Joint Entrance Examination (JEE)",
    heroTitle: "Practice JEE with AI-Generated Mock Tests",
    heroSubtitle:
      "Upload JEE Main and Advanced question papers and get instant practice tests with AI-powered analysis.",
    badge: "JEE Main & Advanced",
    features: [
      {
        icon: "Upload",
        title: "Upload Question Papers",
        desc: "Upload JEE question papers in PDF, JPG, or PNG format. The system accepts printed and handwritten documents.",
      },
      {
        icon: "Brain",
        title: "AI Extracts Questions",
        desc: "AI reads every question from your uploaded paper, identifies MCQs and subjective questions, and organizes them into a structured test.",
      },
      {
        icon: "Clock",
        title: "Timed Practice Sessions",
        desc: "Practice under exam-like conditions with a built-in countdown timer. Customize the duration or use the default 30-minute setting.",
      },
      {
        icon: "CheckSquare",
        title: "Answer Evaluation",
        desc: "MCQ answers are evaluated instantly. Subjective answers are analyzed using semantic matching for accurate assessment.",
      },
      {
        icon: "BarChart3",
        title: "Performance Reports",
        desc: "View your score, accuracy, and per-question results after each test. Track performance across multiple attempts.",
      },
      {
        icon: "RefreshCw",
        title: "Unlimited Practice",
        desc: "Upload as many question papers as you like. Each upload generates a new mock test with no restrictions.",
      },
    ],
    howItWorks: [
      {
        title: "Upload Your Paper",
        desc: "Upload any JEE question paper in PDF, JPG, or PNG format. Handwritten documents are also supported.",
      },
      {
        title: "AI Analyzes Questions",
        desc: "The system extracts every question from your paper, identifies MCQs and subjective questions, and prepares them for practice.",
      },
      {
        title: "Mock Test is Generated",
        desc: "Within minutes, a fully interactive mock test is created with a live timer, question palette, and answer submission system.",
      },
      {
        title: "Practice and Review",
        desc: "Attempt the test under timed conditions, review detailed explanations for each question, and track your accuracy over time.",
      },
    ],
    subjects: [
      "Physics — Mechanics, Thermodynamics, Optics, Electromagnetism",
      "Chemistry — Physical, Organic, Inorganic Chemistry",
      "Mathematics — Algebra, Calculus, Geometry, Trigonometry",
      "Previous Year Question Papers with AI Analysis",
    ],
    whoShouldUse: [
      "JEE aspirants looking for additional practice beyond coaching materials",
      "Self-study students who want to test themselves with real exam patterns",
      "Students who have previous year JEE papers and want them converted into interactive tests",
    ],
    benefits: [
      {
        title: "Free to Use",
        desc: "All features are available at no cost. No subscription or payment required.",
      },
      {
        title: "Works on Any Device",
        desc: "The platform is designed to work on phones, tablets, and desktop computers.",
      },
      {
        title: "Instant Results",
        desc: "Scores, accuracy, and answer explanations are available immediately after each test.",
      },
    ],
    studyTips: [
      {
        icon: "Clock",
        title: "Practice with a Timer",
        desc: "Simulate real exam conditions by timing yourself. The platform includes a built-in timer for every test.",
      },
      {
        icon: "RefreshCw",
        title: "Review Your Mistakes",
        desc: "After each test, go through incorrect answers to understand gaps in your preparation.",
      },
      {
        icon: "Target",
        title: "Focus on Weak Areas",
        desc: "Identify subjects or topics where you score lower and dedicate more practice time to them.",
      },
      {
        icon: "Upload",
        title: "Use Past Papers",
        desc: "Upload actual previous year JEE papers to practice with questions that reflect the real exam pattern.",
      },
      {
        icon: "TrendingUp",
        title: "Track Progress Over Time",
        desc: "Take multiple tests and compare your scores across attempts to see improvement.",
      },
      {
        icon: "Sparkles",
        title: "Try the Quiz Generator",
        desc: "Use the AI quiz generator to create custom practice quizzes on specific subjects and topics.",
      },
    ],
    faqs: [
      {
        q: "How do I start practicing for JEE?",
        a: "Create a free account, upload a JEE question paper in PDF, JPG, or PNG format, and the system will generate a mock test automatically.",
      },
      {
        q: "What file formats are supported?",
        a: "PDF, JPG, PNG, and JPEG formats are supported. The system can process both printed and handwritten documents.",
      },
      {
        q: "Can I practice on my phone?",
        a: "Yes. The platform is designed to work on mobile devices, tablets, and desktop computers.",
      },
      {
        q: "Is the platform really free?",
        a: "Yes. All features are available without any subscription. There are no hidden charges.",
      },
      {
        q: "Does it include subjective questions?",
        a: "Yes. Both MCQ and subjective questions are supported. Subjective answers are evaluated using automated semantic matching.",
      },
      {
        q: "Can I pause and resume a test?",
        a: "Yes. The system automatically saves your progress, allowing you to resume a test from where you left off.",
      },
    ],
    comparison: [
      { feature: "AI-Generated Mock Tests", available: true },
      { feature: "Upload Own Question Papers", available: true },
      { feature: "MCQ and Subjective Questions", available: true },
      { feature: "Timed Practice Sessions", available: true },
      { feature: "Answer Explanations", available: true },
      { feature: "Performance Tracking", available: true },
      { feature: "Multiple Exam Types", available: true },
      { feature: "Mobile-Friendly Interface", available: true },
      { feature: "Video Lectures", available: false },
      { feature: "Live Classes", available: false },
      { feature: "One-on-One Doubt Solving", available: false },
    ],
  },
  {
    slug: "neet-mock-test",
    title: "NEET Mock Test — Free AI Practice for NEET UG",
    description:
      "Prepare for NEET UG with AI-powered mock tests. Upload question papers and get instant practice tests with solutions. Free online NEET mock test series.",
    examFullName: "National Eligibility cum Entrance Test (NEET)",
    heroTitle: "Prepare for NEET with AI-Generated Mock Tests",
    heroSubtitle:
      "Upload NEET UG question papers and get instant practice tests with AI-powered analysis.",
    badge: "NEET UG",
    features: [
      {
        icon: "Upload",
        title: "Upload Question Papers",
        desc: "Upload NEET question papers in PDF, JPG, or PNG format. The system accepts printed and handwritten documents.",
      },
      {
        icon: "Brain",
        title: "AI Extracts Questions",
        desc: "AI reads every question from your uploaded paper, identifies MCQs and subjective questions, and organizes them into a structured test.",
      },
      {
        icon: "Clock",
        title: "Timed Practice Sessions",
        desc: "Practice under exam-like conditions with a built-in countdown timer. Customize the duration or use the default 30-minute setting.",
      },
      {
        icon: "CheckSquare",
        title: "Answer Evaluation",
        desc: "MCQ answers are evaluated instantly. Subjective answers are analyzed using semantic matching for accurate assessment.",
      },
      {
        icon: "BarChart3",
        title: "Performance Reports",
        desc: "View your score, accuracy, and per-question results after each test. Track performance across multiple attempts.",
      },
      {
        icon: "RefreshCw",
        title: "Unlimited Practice",
        desc: "Upload as many question papers as you like. Each upload generates a new mock test with no restrictions.",
      },
    ],
    howItWorks: [
      {
        title: "Upload Your Paper",
        desc: "Upload any NEET question paper in PDF, JPG, or PNG format. Handwritten documents are also supported.",
      },
      {
        title: "AI Analyzes Questions",
        desc: "The system extracts every question from your paper, identifies MCQs and subjective questions, and prepares them for practice.",
      },
      {
        title: "Mock Test is Generated",
        desc: "Within minutes, a fully interactive mock test is created with a live timer, question palette, and answer submission system.",
      },
      {
        title: "Practice and Review",
        desc: "Attempt the test under timed conditions, review detailed explanations for each question, and track your accuracy over time.",
      },
    ],
    subjects: [
      "Physics — Mechanics, Thermodynamics, Optics, Electromagnetism",
      "Chemistry — Physical, Organic, Inorganic Chemistry",
      "Biology — Botany, Zoology, Genetics, Ecology",
      "Previous Year Question Papers with AI Analysis",
    ],
    whoShouldUse: [
      "NEET aspirants looking for additional practice beyond coaching materials",
      "Self-study students who want to test themselves with real exam patterns",
      "Students who have previous year NEET papers and want them converted into interactive tests",
    ],
    benefits: [
      {
        title: "Free to Use",
        desc: "All features are available at no cost. No subscription or payment required.",
      },
      {
        title: "Works on Any Device",
        desc: "The platform is designed to work on phones, tablets, and desktop computers.",
      },
      {
        title: "Instant Results",
        desc: "Scores, accuracy, and answer explanations are available immediately after each test.",
      },
    ],
    studyTips: [
      {
        icon: "Clock",
        title: "Practice with a Timer",
        desc: "Simulate real exam conditions by timing yourself. The platform includes a built-in timer for every test.",
      },
      {
        icon: "RefreshCw",
        title: "Review Your Mistakes",
        desc: "After each test, go through incorrect answers to understand gaps in your preparation.",
      },
      {
        icon: "Target",
        title: "Focus on Weak Areas",
        desc: "Identify subjects or topics where you score lower and dedicate more practice time to them.",
      },
      {
        icon: "Upload",
        title: "Use Past Papers",
        desc: "Upload actual previous year NEET papers to practice with questions that reflect the real exam pattern.",
      },
      {
        icon: "TrendingUp",
        title: "Track Progress Over Time",
        desc: "Take multiple tests and compare your scores across attempts to see improvement.",
      },
      {
        icon: "Sparkles",
        title: "Try the Quiz Generator",
        desc: "Use the AI quiz generator to create custom practice quizzes on specific subjects and topics.",
      },
    ],
    faqs: [
      {
        q: "How do I start preparing for NEET?",
        a: "Create a free account, upload a NEET question paper in PDF, JPG, or PNG format, and the system will generate a mock test automatically.",
      },
      {
        q: "What file formats are supported?",
        a: "PDF, JPG, PNG, and JPEG formats are supported. The system can process both printed and handwritten documents.",
      },
      {
        q: "Does the platform cover Biology for NEET?",
        a: "Yes. The system supports Biology (Botany and Zoology) along with Physics and Chemistry question papers.",
      },
      {
        q: "Is the platform really free?",
        a: "Yes. All features are available without any subscription. There are no hidden charges.",
      },
      {
        q: "Can I practice on my phone?",
        a: "Yes. The platform is designed to work on mobile devices, tablets, and desktop computers.",
      },
      {
        q: "How are subjective answers evaluated?",
        a: "Subjective answers are evaluated using automated text matching that compares your response with the expected answer.",
      },
    ],
    comparison: [
      { feature: "AI-Generated Mock Tests", available: true },
      { feature: "Upload Own Question Papers", available: true },
      { feature: "MCQ and Subjective Questions", available: true },
      { feature: "Timed Practice Sessions", available: true },
      { feature: "Answer Explanations", available: true },
      { feature: "Performance Tracking", available: true },
      { feature: "Multiple Exam Types", available: true },
      { feature: "Mobile-Friendly Interface", available: true },
      { feature: "Video Lectures", available: false },
      { feature: "Live Classes", available: false },
      { feature: "One-on-One Doubt Solving", available: false },
    ],
  },
  {
    slug: "wbjee-mock-test",
    title: "WBJEE Mock Test — Free AI Practice for WBJEE",
    description:
      "Practice WBJEE with AI-generated mock tests. Upload past papers and get instant practice tests. Free online WBJEE mock test series for West Bengal engineering aspirants.",
    examFullName: "West Bengal Joint Entrance Examination (WBJEE)",
    heroTitle: "Practice WBJEE with AI-Generated Mock Tests",
    heroSubtitle:
      "Upload WBJEE question papers and get instant practice tests with AI-powered analysis.",
    badge: "WBJEE",
    features: [
      {
        icon: "Upload",
        title: "Upload Question Papers",
        desc: "Upload WBJEE question papers in PDF, JPG, or PNG format. The system accepts printed and handwritten documents.",
      },
      {
        icon: "Brain",
        title: "AI Extracts Questions",
        desc: "AI reads every question from your uploaded paper, identifies MCQs and subjective questions, and organizes them into a structured test.",
      },
      {
        icon: "Clock",
        title: "Timed Practice Sessions",
        desc: "Practice under exam-like conditions with a built-in countdown timer. Customize the duration or use the default 30-minute setting.",
      },
      {
        icon: "CheckSquare",
        title: "Answer Evaluation",
        desc: "MCQ answers are evaluated instantly. Subjective answers are analyzed using semantic matching for accurate assessment.",
      },
      {
        icon: "BarChart3",
        title: "Performance Reports",
        desc: "View your score, accuracy, and per-question results after each test. Track performance across multiple attempts.",
      },
      {
        icon: "RefreshCw",
        title: "Unlimited Practice",
        desc: "Upload as many question papers as you like. Each upload generates a new mock test with no restrictions.",
      },
    ],
    howItWorks: [
      {
        title: "Upload Your Paper",
        desc: "Upload any WBJEE question paper in PDF, JPG, or PNG format. Handwritten documents are also supported.",
      },
      {
        title: "AI Analyzes Questions",
        desc: "The system extracts every question from your paper, identifies MCQs and subjective questions, and prepares them for practice.",
      },
      {
        title: "Mock Test is Generated",
        desc: "Within minutes, a fully interactive mock test is created with a live timer, question palette, and answer submission system.",
      },
      {
        title: "Practice and Review",
        desc: "Attempt the test under timed conditions, review detailed explanations for each question, and track your accuracy over time.",
      },
    ],
    subjects: [
      "Physics — Mechanics, Thermodynamics, Optics, Electromagnetism",
      "Chemistry — Physical, Organic, Inorganic Chemistry",
      "Mathematics — Algebra, Calculus, Geometry, Trigonometry",
      "Previous Year Question Papers with AI Analysis",
    ],
    whoShouldUse: [
      "WBJEE aspirants looking for additional practice beyond coaching materials",
      "Self-study students who want to test themselves with real exam patterns",
      "Students who have previous year WBJEE papers and want them converted into interactive tests",
    ],
    benefits: [
      {
        title: "Free to Use",
        desc: "All features are available at no cost. No subscription or payment required.",
      },
      {
        title: "Works on Any Device",
        desc: "The platform is designed to work on phones, tablets, and desktop computers.",
      },
      {
        title: "Instant Results",
        desc: "Scores, accuracy, and answer explanations are available immediately after each test.",
      },
    ],
    studyTips: [
      {
        icon: "Clock",
        title: "Practice with a Timer",
        desc: "Simulate real exam conditions by timing yourself. The platform includes a built-in timer for every test.",
      },
      {
        icon: "RefreshCw",
        title: "Review Your Mistakes",
        desc: "After each test, go through incorrect answers to understand gaps in your preparation.",
      },
      {
        icon: "Target",
        title: "Focus on Weak Areas",
        desc: "Identify subjects or topics where you score lower and dedicate more practice time to them.",
      },
      {
        icon: "Upload",
        title: "Use Past Papers",
        desc: "Upload actual previous year WBJEE papers to practice with questions that reflect the real exam pattern.",
      },
      {
        icon: "TrendingUp",
        title: "Track Progress Over Time",
        desc: "Take multiple tests and compare your scores across attempts to see improvement.",
      },
      {
        icon: "Sparkles",
        title: "Try the Quiz Generator",
        desc: "Use the AI quiz generator to create custom practice quizzes on specific subjects and topics.",
      },
    ],
    faqs: [
      {
        q: "How do I start practicing for WBJEE?",
        a: "Create a free account, upload a WBJEE question paper in PDF, JPG, or PNG format, and the system will generate a mock test automatically.",
      },
      {
        q: "What file formats are supported?",
        a: "PDF, JPG, PNG, and JPEG formats are supported. The system can process both printed and handwritten documents.",
      },
      {
        q: "Does the platform support Bengali language?",
        a: "Yes. The OCR system supports Bengali, Hindi, and English for text extraction from uploaded documents.",
      },
      {
        q: "Is the platform really free?",
        a: "Yes. All features are available without any subscription. There are no hidden charges.",
      },
      {
        q: "Can I practice on my phone?",
        a: "Yes. The platform is designed to work on mobile devices, tablets, and desktop computers.",
      },
      {
        q: "Can I pause and resume a test?",
        a: "Yes. The system automatically saves your progress, allowing you to resume a test from where you left off.",
      },
    ],
    comparison: [
      { feature: "AI-Generated Mock Tests", available: true },
      { feature: "Upload Own Question Papers", available: true },
      { feature: "MCQ and Subjective Questions", available: true },
      { feature: "Timed Practice Sessions", available: true },
      { feature: "Answer Explanations", available: true },
      { feature: "Performance Tracking", available: true },
      { feature: "Multiple Exam Types", available: true },
      { feature: "Mobile-Friendly Interface", available: true },
      { feature: "Video Lectures", available: false },
      { feature: "Live Classes", available: false },
      { feature: "One-on-One Doubt Solving", available: false },
    ],
  },
  {
    slug: "cuet-mock-test",
    title: "CUET Mock Test — Free AI Practice for CUET UG & PG",
    description:
      "Prepare for CUET UG and PG with AI-powered mock tests. Upload question papers and get instant practice tests. Free online CUET mock test series.",
    examFullName: "Common University Entrance Test (CUET)",
    heroTitle: "Prepare for CUET with AI-Generated Mock Tests",
    heroSubtitle:
      "Upload CUET UG and PG question papers and get instant practice tests with AI-powered analysis.",
    badge: "CUET UG & PG",
    features: [
      {
        icon: "Upload",
        title: "Upload Question Papers",
        desc: "Upload CUET question papers in PDF, JPG, or PNG format. The system accepts printed and handwritten documents.",
      },
      {
        icon: "Brain",
        title: "AI Extracts Questions",
        desc: "AI reads every question from your uploaded paper, identifies MCQs and subjective questions, and organizes them into a structured test.",
      },
      {
        icon: "Clock",
        title: "Timed Practice Sessions",
        desc: "Practice under exam-like conditions with a built-in countdown timer. Customize the duration or use the default 30-minute setting.",
      },
      {
        icon: "CheckSquare",
        title: "Answer Evaluation",
        desc: "MCQ answers are evaluated instantly. Subjective answers are analyzed using semantic matching for accurate assessment.",
      },
      {
        icon: "BarChart3",
        title: "Performance Reports",
        desc: "View your score, accuracy, and per-question results after each test. Track performance across multiple attempts.",
      },
      {
        icon: "RefreshCw",
        title: "Unlimited Practice",
        desc: "Upload as many question papers as you like. Each upload generates a new mock test with no restrictions.",
      },
    ],
    howItWorks: [
      {
        title: "Upload Your Paper",
        desc: "Upload any CUET question paper in PDF, JPG, or PNG format. Handwritten documents are also supported.",
      },
      {
        title: "AI Analyzes Questions",
        desc: "The system extracts every question from your paper, identifies MCQs and subjective questions, and prepares them for practice.",
      },
      {
        title: "Mock Test is Generated",
        desc: "Within minutes, a fully interactive mock test is created with a live timer, question palette, and answer submission system.",
      },
      {
        title: "Practice and Review",
        desc: "Attempt the test under timed conditions, review detailed explanations for each question, and track your accuracy over time.",
      },
    ],
    subjects: [
      "Domain-specific subjects as per CUET syllabus",
      "Language Comprehension & Grammar",
      "General Knowledge & Current Affairs",
      "Logical Reasoning & Analytical Ability",
      "Previous Year Question Papers with AI Analysis",
    ],
    whoShouldUse: [
      "CUET aspirants looking for additional practice beyond school materials",
      "Self-study students who want to test themselves with real exam patterns",
      "Students who have previous year CUET papers and want them converted into interactive tests",
    ],
    benefits: [
      {
        title: "Free to Use",
        desc: "All features are available at no cost. No subscription or payment required.",
      },
      {
        title: "Works on Any Device",
        desc: "The platform is designed to work on phones, tablets, and desktop computers.",
      },
      {
        title: "Instant Results",
        desc: "Scores, accuracy, and answer explanations are available immediately after each test.",
      },
    ],
    studyTips: [
      {
        icon: "Clock",
        title: "Practice with a Timer",
        desc: "Simulate real exam conditions by timing yourself. The platform includes a built-in timer for every test.",
      },
      {
        icon: "RefreshCw",
        title: "Review Your Mistakes",
        desc: "After each test, go through incorrect answers to understand gaps in your preparation.",
      },
      {
        icon: "Target",
        title: "Focus on Weak Areas",
        desc: "Identify subjects or topics where you score lower and dedicate more practice time to them.",
      },
      {
        icon: "Upload",
        title: "Use Past Papers",
        desc: "Upload actual previous year CUET papers to practice with questions that reflect the real exam pattern.",
      },
      {
        icon: "TrendingUp",
        title: "Track Progress Over Time",
        desc: "Take multiple tests and compare your scores across attempts to see improvement.",
      },
      {
        icon: "Sparkles",
        title: "Try the Quiz Generator",
        desc: "Use the AI quiz generator to create custom practice quizzes on specific subjects and topics.",
      },
    ],
    faqs: [
      {
        q: "How do I start preparing for CUET?",
        a: "Create a free account, upload a CUET question paper in PDF, JPG, or PNG format, and the system will generate a mock test automatically.",
      },
      {
        q: "What file formats are supported?",
        a: "PDF, JPG, PNG, and JPEG formats are supported. The system can process both printed and handwritten documents.",
      },
      {
        q: "Does the platform cover all CUET domains?",
        a: "The system supports a wide range of domain-specific subjects, language sections, and general test papers as per the CUET format.",
      },
      {
        q: "Is the platform really free?",
        a: "Yes. All features are available without any subscription. There are no hidden charges.",
      },
      {
        q: "Can I practice on my phone?",
        a: "Yes. The platform is designed to work on mobile devices, tablets, and desktop computers.",
      },
      {
        q: "Can I pause and resume a test?",
        a: "Yes. The system automatically saves your progress, allowing you to resume a test from where you left off.",
      },
    ],
    comparison: [
      { feature: "AI-Generated Mock Tests", available: true },
      { feature: "Upload Own Question Papers", available: true },
      { feature: "MCQ and Subjective Questions", available: true },
      { feature: "Timed Practice Sessions", available: true },
      { feature: "Answer Explanations", available: true },
      { feature: "Performance Tracking", available: true },
      { feature: "Multiple Exam Types", available: true },
      { feature: "Mobile-Friendly Interface", available: true },
      { feature: "Video Lectures", available: false },
      { feature: "Live Classes", available: false },
      { feature: "One-on-One Doubt Solving", available: false },
    ],
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

export function generateFAQJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}
