// Define the Therapist type
export type Therapist = {
  id: string;
  name: { ar: string; en: string };
  image: string;
  specialties: string[];
  rating?: number;
  reviewCount?: number;
  credentials: {
    yearsExperience: number;
    scfhsVerified: boolean;
    education: string[];
    certificates: string[];
  };
  languages: string[];
  bio: { ar: string; en: string };
  approach: { ar: string; en: string };
  expertise: string[];
  city: string;
  gender: "male" | "female";
  modes: Array<"home" | "online">; // Only home and online
  durations: number[];
  basePrice: number;
  homeVisitFee: number;
  nextAvailable: string;
  availability: Record<string, Record<"home" | "online", string[]>>;
  reviews: any[]; // You can define a proper Review type later
};

// Helper function to create realistic availability patterns
const createAvailabilityPattern = (
  therapistType: "busy" | "moderate" | "available",
  modes: ("online" | "home")[],
  workingDaysPerWeek: 3 | 4 | 5 = 5
): Record<string, Record<"home" | "online", string[]>> => {
  const availability: Record<string, Record<"home" | "online", string[]>> = {};

  // Define working days based on therapist preference
  const getWorkingDays = () => {
    switch (workingDaysPerWeek) {
      case 3:
        return [1, 2, 3]; // Monday, Tuesday, Wednesday
      case 4:
        return [0, 1, 2, 3]; // Sunday, Monday, Tuesday, Wednesday
      case 5:
        return [0, 1, 2, 3, 4]; // Sunday through Thursday
      default:
        return [0, 1, 2, 3, 4];
    }
  };

  const workingDays = getWorkingDays();

  // November 2024
  const getNovemberSlots = () => {
    const availableDates = [];
    for (let day = 1; day <= 30; day++) {
      const date = new Date(2024, 10, day);
      const dayOfWeek = date.getDay();

      if (workingDays.includes(dayOfWeek)) {
        switch (therapistType) {
          case "busy":
            if (day % 3 === 0 || day % 7 === 0)
              availableDates.push(date.toISOString().split("T")[0]);
            break;
          case "moderate":
            if (day % 2 === 0)
              availableDates.push(date.toISOString().split("T")[0]);
            break;
          case "available":
            availableDates.push(date.toISOString().split("T")[0]);
            break;
        }
      }
    }

    return {
      dates: availableDates,
      online:
        therapistType === "busy"
          ? ["14:00", "15:00"]
          : therapistType === "moderate"
          ? ["09:00", "10:00", "14:00", "15:00"]
          : ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
      home:
        therapistType === "busy"
          ? ["14:00"]
          : therapistType === "moderate"
          ? ["09:00", "15:00"]
          : ["09:00", "10:00", "14:00", "15:00"],
    };
  };

  // December 2024
  const getDecemberSlots = () => {
    const availableDates = [];
    for (let day = 1; day <= 31; day++) {
      const date = new Date(2024, 11, day);
      const dayOfWeek = date.getDay();

      if (workingDays.includes(dayOfWeek) && day < 20) {
        switch (therapistType) {
          case "busy":
            if (day % 5 === 0)
              availableDates.push(date.toISOString().split("T")[0]);
            break;
          case "moderate":
            if (day % 3 === 0)
              availableDates.push(date.toISOString().split("T")[0]);
            break;
          case "available":
            if (day % 2 === 0)
              availableDates.push(date.toISOString().split("T")[0]);
            break;
        }
      }
    }

    return {
      dates: availableDates,
      online:
        therapistType === "busy"
          ? ["15:00", "16:00"]
          : therapistType === "moderate"
          ? ["09:00", "10:00", "15:00", "16:00"]
          : ["09:00", "10:00", "14:00", "15:00", "16:00"],
      home:
        therapistType === "busy"
          ? ["15:00"]
          : therapistType === "moderate"
          ? ["10:00", "15:00"]
          : ["09:00", "14:00", "15:00"],
    };
  };

  // Apply November
  const novSlots = getNovemberSlots();
  novSlots.dates.forEach((date) => {
    availability[date] = {
      online: modes.includes("online") ? novSlots.online : [],
      home: modes.includes("home") ? novSlots.home : [],
    };
  });

  // Apply December
  const decSlots = getDecemberSlots();
  decSlots.dates.forEach((date) => {
    availability[date] = {
      online: modes.includes("online") ? decSlots.online : [],
      home: modes.includes("home") ? decSlots.home : [],
    };
  });

  // 2025
  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(2025, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(2025, month, day);
      const dayOfWeek = date.getDay();

      if (workingDays.includes(dayOfWeek)) {
        const dateStr = date.toISOString().split("T")[0];

        availability[dateStr] = {
          online: modes.includes("online")
            ? [
                "08:00",
                "09:00",
                "10:00",
                "11:00",
                "14:00",
                "15:00",
                "16:00",
                "17:00",
              ]
            : [],
          home: modes.includes("home")
            ? ["09:00", "10:00", "14:00", "15:00", "16:00"]
            : [],
        };
      }
    }
  }

  // 2026
  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(2026, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(2026, month, day);
      const dayOfWeek = date.getDay();

      if (workingDays.includes(dayOfWeek)) {
        const dateStr = date.toISOString().split("T")[0];

        availability[dateStr] = {
          online: modes.includes("online")
            ? [
                "08:00",
                "09:00",
                "10:00",
                "11:00",
                "12:00",
                "14:00",
                "15:00",
                "16:00",
                "17:00",
                "18:00",
              ]
            : [],
          home: modes.includes("home")
            ? ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]
            : [],
        };
      }
    }
  }

  return availability;
};

// -------------------------
// 🔥 NEW THERAPISTS DATA
// -------------------------

export const therapists: Therapist[] = [
  {
    id: "Thamer-alshahrani",
    name: { ar: "ثامر الشهراني", en: "Thamer Alshahrani" },
    specialties: ["musculoskeletal", "sports"],
    reviewCount: 0,
    basePrice: 200,
    languages: ["Arabic"],
    modes: ["online", "home"],
    durations: [45, 60],
    bio: {
      ar: "العلاج الطبيعي العضلي الهيكلي والإصابات الرياضية.",
      en: "Musculoskeletal physiotherapy and sports injuries.",
    },
    approach: {
      ar: "نهج علاجي متخصص لاستعادة الحركة وتقليل الألم.",
      en: "Specialized therapeutic approach focused on restoring movement and reducing pain.",
    },
    credentials: {
      scfhsVerified: true,
      yearsExperience: 5,
      education: ["Bachelor of Physiotherapy"],
      certificates: ["SCFHS Licensed"],
    },
    expertise: ["Sports Injuries", "Muscle Pain"],
    homeVisitFee: 0,
    nextAvailable: "2024-11-05",
    city: "Riyadh",
    gender: "male",
    image: "/thamir.png",
    availability: createAvailabilityPattern("moderate", ["online"], 5),
    reviews: [],
  },

  {
    id: "Ayman-Alsaadi",
    name: { ar: "ايمن الصاعدي", en: "Ayman Alsaadi" },
    specialties: ["general"],
    reviewCount: 0,
    basePrice: 200,
    languages: ["Arabic"],
    modes: ["home", "online"],
    durations: [45, 60],
    bio: {
      ar: "إعادة التأهيل والعلاج الطبيعي العام.",
      en: "General physical therapy and rehabilitation.",
    },
    approach: {
      ar: "نهج علاجي شامل يناسب مختلف الحالات.",
      en: "Comprehensive rehabilitation-focused therapeutic approach.",
    },
    credentials: {
      scfhsVerified: true,
      yearsExperience: 4,
      education: ["Bachelor of Physiotherapy"],
      certificates: ["SCFHS Licensed"],
    },
    expertise: ["Rehabilitation", "General PT"],
    homeVisitFee: 100,
    nextAvailable: "2024-11-06",
    city: "Riyadh",
    gender: "male",
    image: "/Ayman.jpg",
    availability: createAvailabilityPattern("busy", ["home"], 3),
    reviews: [],
  },

  {
    id: "Khaled-Habib",
    name: { ar: "خالد حبيب", en: "Khaled Habib" },
    specialties: ["Orthopedic Physiotherapy", "العلاج الطبيعي العظمي"],
    reviewCount: 0,
    basePrice: 200,
    languages: ["Arabic"],
    modes: ["home"],
    durations: [45, 60],
    bio: {
      ar: "مشاكل العضلات، العظام، والعلاج اليدوي المتقدم.",
      en: "Muscle and skeletal disorders, advanced manual therapy.",
    },
    approach: {
      ar: "نهج علاجي يدوي متخصص في استعادة التوازن وتقليل الألم.",
      en: "Manual therapy approach tailored to restore balance and reduce pain.",
    },
    credentials: {
      scfhsVerified: true,
      yearsExperience: 6,
      education: ["Bachelor of Physiotherapy"],
      certificates: ["SCFHS Licensed"],
    },
    expertise: ["Orthopedic Issues", "Manual Therapy"],
    homeVisitFee: 100,
    nextAvailable: "2024-11-07",
    city: "Riyadh",
    gender: "male",
    image: "/khalid.jpg",
    availability: createAvailabilityPattern("moderate", ["home"], 4),
    reviews: [],
  },

  {
    id: "Abdullah-Alshahrani",
    name: { ar: "عبدالله الشهراني", en: "Abdullah Alshahrani" },
    specialties: ["orthopedic", "sports","إصابات العظام، الإصابات الرياضية، والعلاج اليدوي.>و"],
    reviewCount: 0,
    basePrice: 200,
    languages: ["Arabic"],
    modes: ["online"],
    durations: [45, 60],
    bio: {
      ar: "إصابات العظام، الإصابات الرياضية، والعلاج اليدوي المتقدم.",
      en: "Orthopedic injuries, sports injuries, and advanced manual therapy.",
    },
    approach: {
      ar: "نهج علاجي يجمع بين العلاج اليدوي وتمارين التأهيل.",
      en: "Therapeutic approach combining manual therapy and movement rehab.",
    },
    credentials: {
      scfhsVerified: true,
      yearsExperience: 5,
      education: ["Bachelor of Physiotherapy"],
      certificates: ["SCFHS Licensed"],
    },
    expertise: ["Sports Injuries", "ACL Recovery"],
    homeVisitFee: 0,
    nextAvailable: "2024-11-08",
    city: "Riyadh",
    gender: "male",
    image: "/abdullah.jpg",
    availability: createAvailabilityPattern("available", ["online"], 5),
    reviews: [],
  },

  {
    id: "Nismah-Alalshi",
    name: { ar: "نسمه العلشي", en: "Nismah Alalshi" },
    specialties: ["women"],
    reviewCount: 0,
    basePrice: 200,
    languages: ["Arabic"],
    modes: ["home"],
    durations: [45, 60],
    bio: {
      ar: "ضعف عضلات قاع الحوض وآلام ما بعد الولادة.",
      en: "Women’s health & postpartum rehabilitation specialist.",
    },
    approach: {
      ar: "نهج لطيف ومناسب للنساء بعد الولادة.",
      en: "Gentle therapeutic approach suitable for postpartum recovery.",
    },
    credentials: {
      scfhsVerified: true,
      yearsExperience: 5,
      education: ["Bachelor of Physiotherapy"],
      certificates: ["SCFHS Licensed"],
    },
    expertise: ["Pelvic Floor", "Postpartum Recovery"],
    homeVisitFee: 100,
    nextAvailable: "2024-11-09",
    city: "Riyadh",
    gender: "female",
    image: "/Nismah.jpg",
    availability: createAvailabilityPattern("busy", ["home"], 3),
    reviews: [],
  },

  {
    id: "Alaa-Ahmed",
    name: { ar: "الاء أحمد", en: "Alaa Ahmed" },
    specialties: ["geriatrics"],
    reviewCount: 0,
    basePrice: 200,
    languages: ["Arabic"],
    modes: ["online"],
    durations: [45, 60],
    bio: {
      ar: "أخصائية علاج طبيعي للمسنين.",
      en: "Geriatric physical therapist.",
    },
    approach: {
      ar: "نهج علاجي لطيف يناسب كبار السن.",
      en: "Gentle therapeutic approach suitable for elderly patients.",
    },
    credentials: {
      scfhsVerified: true,
      yearsExperience: 4,
      education: ["Bachelor of Physiotherapy"],
      certificates: ["SCFHS Licensed"],
    },
    expertise: ["Elderly Care", "Mobility Training"],
    homeVisitFee: 0,
    nextAvailable: "2024-11-10",
    city: "Riyadh",
    gender: "female",
    image: "/Alaa.png",
    availability: createAvailabilityPattern("moderate", ["online"], 4),
    reviews: [],
  },
];