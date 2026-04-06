export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string;
  logo: string;
  isPromoted?: boolean;
  type: "Full-time" | "Hybrid" | "Remote";
}

export type NavItem = {
  label: string;
  icon: string;
  active?: boolean;
};
