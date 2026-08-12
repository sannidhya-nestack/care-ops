export type Customer = {
  id: string;
  name: string;
  role: "family_caregiver" | "facility_admin" | "self" | "distributor";
  account: string;
  plan: string;
  email: string;
};

export const customers: Customer[] = [
  {
    id: "cus-01",
    name: "Priya Reynolds",
    role: "family_caregiver",
    account: "ACCT-88421",
    plan: "Home Plus",
    email: "priya.r@example.com",
  },
  {
    id: "cus-02",
    name: "Daniel Okonkwo",
    role: "family_caregiver",
    account: "ACCT-77102",
    plan: "Home Standard",
    email: "daniel.o@example.com",
  },
  {
    id: "cus-03",
    name: "Elena Vasquez",
    role: "facility_admin",
    account: "ACCT-FAC-220",
    plan: "Facility Pro",
    email: "elena.v@example.com",
  },
  {
    id: "cus-04",
    name: "Lisa Chen",
    role: "family_caregiver",
    account: "ACCT-55918",
    plan: "Home Plus",
    email: "lisa.c@example.com",
  },
  {
    id: "cus-05",
    name: "Marcus Brooks",
    role: "family_caregiver",
    account: "ACCT-44120",
    plan: "Home Standard",
    email: "marcus.b@example.com",
  },
  {
    id: "cus-06",
    name: "Amy Nguyen",
    role: "family_caregiver",
    account: "ACCT-66301",
    plan: "Home Plus",
    email: "amy.n@example.com",
  },
  {
    id: "cus-07",
    name: "Ravi Patel",
    role: "distributor",
    account: "ACCT-DIST-88",
    plan: "Partner Wholesale",
    email: "ravi.p@example.com",
  },
  {
    id: "cus-08",
    name: "Jordan Hale",
    role: "family_caregiver",
    account: "ACCT-91204",
    plan: "Home Plus",
    email: "jordan.h@example.com",
  },
];

export function getCustomer(id: string) {
  return customers.find((c) => c.id === id);
}
