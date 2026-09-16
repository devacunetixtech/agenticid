export type Activity = {
  id: string; wallet: string; kind: "registration" | "job";
  name?: string; amount?: string; rating?: string; feedback?: string;
  block: number; transaction: string;
};
