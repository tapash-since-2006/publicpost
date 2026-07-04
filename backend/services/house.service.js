import prisma from "../prisma/client.js";

export const selectHouse = async (userId, house) => {
  // Validate house
  const validHouses = ["CITIZEN", "JOURNALIST", "FACT_CHECKER"];
  if (!validHouses.includes(house)) {
    throw new Error("Invalid house selected");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { house },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    house: user.house,
    politicalLeaning: user.politicalLeaning,
  };
};
