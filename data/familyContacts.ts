export type FamilyContact = {
  id: string;
  name: string;
  relationship: string;
  preferred_language: "en" | "es" | "fr";
  phoneHint: string;
};

export const familyContacts: FamilyContact[] = [
  {
    id: "fc-01",
    name: "Maya Reynolds",
    relationship: "Daughter",
    preferred_language: "en",
    phoneHint: "•••-0142",
  },
  {
    id: "fc-02",
    name: "Carlos Okonkwo",
    relationship: "Son",
    preferred_language: "es",
    phoneHint: "•••-8821",
  },
  {
    id: "fc-03",
    name: "Amina Vasquez",
    relationship: "Niece / care proxy",
    preferred_language: "en",
    phoneHint: "•••-4410",
  },
];
