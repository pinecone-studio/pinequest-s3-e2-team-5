import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { colors } from "@/lib/theme";

export default function StudentTabsLayout() {
  return (
    <NativeTabs backgroundColor="#DCD9FF" tintColor={colors.primaryDark}>
      <NativeTabs.Trigger name="index">
        <Label>Шалгалт</Label>
        <Icon sf="list.bullet.clipboard.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="results">
        <Label>Үр дүн</Label>
        <Icon sf="chart.bar.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Хувийн</Label>
        <Icon sf="person.crop.circle.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
