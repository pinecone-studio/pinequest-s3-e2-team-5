export const colors = {
  pageBackground: "#FCFAFF",
  surface: "#FFFFFF",
  surfaceTint: "#F8F6FF",
  primary: "#896FD4",
  primaryDark: "#755CD0",
  primarySoft: "#E7E1FB",
  accentBlue: "#5B8DEF",
  accentWarm: "#F4A261",
  textPrimary: "#1F1B2D",
  textSecondary: "#3D384A",
  textMuted: "#6F697F",
  textSoft: "#A7A0B9",
  border: "#EAE6F5",
  borderStrong: "#D5CEE8",
  dangerBackground: "#FFF7F7",
  dangerBorder: "#FFD8D8",
  dangerText: "#B63B3B",
} as const;

export const fonts = {
  sans: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
  },
  display: {
    medium: "Poppins_500Medium",
    semibold: "Poppins_600SemiBold",
    bold: "Poppins_700Bold",
  },
} as const;

export const shadows = {
  card: {
    shadowColor: "#231749",
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 6,
  },
  button: {
    shadowColor: "#8D74FC",
    shadowOpacity: 0.26,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 6,
  },
} as const;
