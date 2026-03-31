import type { TextProps } from "react-native";
import { Text } from "react-native";

export function SecureText(props: TextProps) {
  return <Text {...props} selectable={false} suppressHighlighting />;
}
