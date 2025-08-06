import bcrypt from "bcryptjs";

//funzione che serve per hashare una password

export const hashValue = async (value: string, saltRounds?: number) => {
  return await bcrypt.hash(value, saltRounds || 10);
};

//funzione che server per confrontare una passwrod con un hash

export const compareValue = async (value: string, hashedValue: string) => {
  return bcrypt.compare(value, hashedValue).catch(() => false);
};
