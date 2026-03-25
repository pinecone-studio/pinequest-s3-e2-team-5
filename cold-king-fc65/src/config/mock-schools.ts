export type MockSchool = {
	id: string;
	schoolName: string;
	email: string;
	managerName: string;
	address: string;
	aimag: string;
};

export const mockSchools: MockSchool[] = [
	{
		id: "mock_school_1",
		schoolName: "Ulaanbaatar Laboratory School",
		email: "labschool@example.mn",
		managerName: "B.Bat-Erdene",
		address: "Sukhbaatar District, Ulaanbaatar",
		aimag: "Ulaanbaatar",
	},
	{
		id: "mock_school_2",
		schoolName: "Darkhan Future High School",
		email: "future.darkhan@example.mn",
		managerName: "S.Narantuya",
		address: "Darkhan city center",
		aimag: "Darkhan-Uul",
	},
	{
		id: "mock_school_3",
		schoolName: "Erdenet Science School",
		email: "science.erdenet@example.mn",
		managerName: "T.Ganbold",
		address: "Orkhon aimag, Erdenet",
		aimag: "Orkhon",
	},
	{
		id: "mock_school_4",
		schoolName: "Khuvsgul Education Complex",
		email: "edu.khuvsgul@example.mn",
		managerName: "M.Oyunbileg",
		address: "Murun, Khuvsgul",
		aimag: "Khuvsgul",
	},
	{
		id: "mock_school_5",
		schoolName: "Dornod New Era School",
		email: "newera.dornod@example.mn",
		managerName: "A.Enkhjin",
		address: "Choibalsan, Dornod",
		aimag: "Dornod",
	},
];

export function findMockSchoolByName(name: string) {
	const normalized = name.trim().toLowerCase();
	return mockSchools.find(
		(item) => item.schoolName.trim().toLowerCase() === normalized,
	);
}
