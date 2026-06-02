export interface UserVariableData {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  username: string;
  membershipType: string;
  registrationDate: string;
  currentDate: string;
}

export interface VariableDefinition {
  key: string;
  label: string;
  description: string;
}

export const AVAILABLE_VARIABLES: VariableDefinition[] = [
  { key: "firstName", label: "First Name", description: "User's first name" },
  { key: "lastName", label: "Last Name", description: "User's last name" },
  { key: "fullName", label: "Full Name", description: "User's full name" },
  { key: "name", label: "Name", description: "Alias for fullName — user's full name" },
  { key: "email", label: "Email", description: "User's email address" },
  { key: "username", label: "Username", description: "Part before @ in email" },
  { key: "membershipType", label: "Membership Type", description: "Free / Admin" },
  { key: "registrationDate", label: "Registration Date", description: "Date user joined" },
  { key: "currentDate", label: "Current Date", description: "Today's date" },
  { key: "appUrl", label: "App URL", description: "Dynamic app base URL (localhost in dev, fouri.in in production)" },
];

type ResolverFn = (user: UserVariableData) => string;

const RESOLVERS: Record<string, ResolverFn> = {
  firstName: (u) => u.firstName,
  lastName: (u) => u.lastName,
  fullName: (u) => u.fullName,
  name: (u) => u.fullName,
  email: (u) => u.email,
  username: (u) => u.username,
  membershipType: (u) => u.membershipType,
  registrationDate: (u) => u.registrationDate,
  currentDate: (u) => u.currentDate,
};

const VARIABLE_REGEX = /\{\{(\w+)\}\}/g;

export function resolveVariables(text: string, user: UserVariableData): string {
  return text.replace(VARIABLE_REGEX, (match, name: string) => {
    const resolver = RESOLVERS[name];
    return resolver ? resolver(user) : match;
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function userToVariableData(user: {
  name?: string | null;
  email: string;
  createdAt: Date | string;
  role?: string;
}): UserVariableData {
  const nameParts = (user.name || user.email.split("@")[0] || "").split(" ");
  const createdDate = typeof user.createdAt === "string" ? new Date(user.createdAt) : user.createdAt;

  return {
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    fullName: user.name || user.email,
    email: user.email,
    username: user.email.split("@")[0] || "",
    membershipType: user.role === "ADMIN" ? "Admin" : "Free",
    registrationDate: formatDate(createdDate),
    currentDate: formatDate(new Date()),
  };
}
