/**
 * Centralized Portfolio Data for KOWSTHUBHA
 * 
 * Confirmed Details:
 * - Name: KOWSTHUBHA
 * - Education: B.Tech
 * - Department: Computer Science and Engineering
 * - Academic Year: Second Year
 * - Professional Identity: Computer Science Engineering Student
 * - Design Direction: Modern Editorial
 * - Profile Photograph: Available in public/assets/kowsthuba-profile.jpg
 * 
 * Note: Unknown or unconfirmed details remain configured with null values
 * or empty arrays. No fictional or placeholder content has been invented.
 */

export const portfolioData = {
  personalInfo: {
    name: "KOWSTHUBHA",
    tagline: "PERSONAL PORTFOLIO",
    subheading: "A distinctive digital identity in progress.",
    professionalIdentity: "Computer Science Engineering Student",
    education: {
      degree: "B.Tech",
      department: "Computer Science and Engineering",
      academicYear: "Second Year",
      university: null,
      cgpa: null,
    },
    specialization: null,
    profilePhoto: "/assets/kowsthuba-profile.jpg",
  },
  hero: {
    editorialLabel: "PERSONAL PORTFOLIO / 2026",
    headline: "A journey into the world of computer science.",
    greeting: "Hello, I'm KOWSTHUBHA.",
    professionalDescription: "A second-year B.Tech student in Computer Science and Engineering.",
    supportingDescription: "This portfolio is a space to document my academic journey, learning, and projects as they take shape.",
    academicMetadata: [
      "B.TECH STUDENT",
      "COMPUTER SCIENCE & ENGINEERING",
      "SECOND YEAR",
    ],
    ctaText: "Explore My Journey",
    ctaTarget: "#about",
    imageCaption: "FIG. 01 / PROFILE",
  },
  about: {
    sectionLabel: "02 / ABOUT ME",
    heading: "Getting to know me.",
    introduction: "I'm KOWSTHUBHA, a second-year B.Tech student in Computer Science and Engineering.",
    supportingContent: "This space introduces my academic background and documents my journey through computer science.",
    academicPanel: {
      title: "ACADEMIC PROFILE",
      subtitle: "CONFIRMED ENROLLMENT",
      details: [
        { label: "DEGREE", value: "B.TECH" },
        { label: "DEPARTMENT", value: "COMPUTER SCIENCE AND ENGINEERING" },
        { label: "ACADEMIC STATUS", value: "SECOND YEAR" },
      ],
    },
  },
  skills: {
    sectionLabel: "03 / TECHNICAL SKILLS",
    heading: "Tools and technologies.",
    emptyStateMessage: "Technical skills will be added as the portfolio profile is completed.",
    categories: [
      {
        id: "languages",
        title: "Programming Languages",
        items: [],
      },
      {
        id: "frameworks",
        title: "Frameworks & Libraries",
        items: [],
      },
      {
        id: "tools",
        title: "Tools & Platforms",
        items: [],
      },
      {
        id: "other",
        title: "Other Technical Skills",
        items: [],
      },
    ],
  },
  projectsSection: {
    sectionLabel: "04 / SELECTED WORK",
    heading: "Ideas into projects.",
    supportingDescription: "A selection of work, experiments and things I've built.",
    emptyState: {
      heading: "Every journey starts with an idea.",
      description: "Projects and experiments will be showcased here as the portfolio evolves.",
      badge: "CURATION IN PROGRESS",
    },
  },
  projects: [],
  education: {
    sectionLabel: "05 / EDUCATION",
    heading: "Where my journey is taking shape.",
    entries: [
      {
        id: "btech-cse",
        degree: "B.Tech",
        department: "Computer Science and Engineering",
        status: "Second Year",
        timingBadge: "Currently pursuing",
        institution: null,
        startYear: null,
        expectedGraduation: null,
        focusAreas: "Core computational foundations, data structures, algorithms, and systems engineering.",
      },
    ],
  },
  achievementsSection: {
    sectionLabel: "06 / ACHIEVEMENTS & CERTIFICATIONS",
    heading: "Milestones and recognition.",
    achievements: {
      title: "Achievements & Recognition",
      emptyMessage: "Milestones and accomplishments will be showcased here as they are verified.",
      items: [],
    },
    certifications: {
      title: "Licenses & Certifications",
      emptyMessage: "Verified credentials will appear here when available.",
      items: [],
    },
  },
  contact: {
    sectionLabel: "07 / GET IN TOUCH",
    heading: "Let's start a conversation.",
    description: "Have a question, an opportunity or an idea to discuss? Get in touch.",
    email: null,
    phone: null,
    socials: [],
    formEndpoint: null,
    deliveryNote: "Message delivery has not been configured yet. This form validates your details client-side.",
  },
  footer: {
    brandName: "KOWSTHUBHA",
    copyright: "All rights reserved.",
    currentYear: 2026,
    navLinks: [
      { label: "Home", href: "#home" },
      { label: "About", href: "#about" },
      { label: "Skills", href: "#skills" },
      { label: "Projects", href: "#projects" },
      { label: "Education", href: "#education" },
      { label: "Achievements", href: "#achievements" },
      { label: "Contact", href: "#contact" },
    ],
    socials: [],
  },
};

export default portfolioData;
