import { router } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
import { StudentExamCard } from "@/components/StudentExamCard";
import { useAppData } from "@/data/app-data";
import {
  buildStudentExamSubjectOrder,
  formatScheduledDate,
  formatScheduledTime,
} from "@/lib/student-exam";
import { colors, fonts } from "@/lib/theme";

const learningMsLogo = require("../../../assets/learning-ms-logo.png");

export default function ResultsScreen() {
  const { submissions } = useAppData();
  const subjectOrder = buildStudentExamSubjectOrder(submissions);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.page}>
      <View style={styles.header}>
        <View style={styles.brandMarkWrap}>
          <Image source={learningMsLogo} style={styles.brandImage} resizeMode="contain" />
        </View>
        <View>
          <Text style={styles.brandTop}>Learning</Text>
          <Text style={styles.brandBottom}>MS</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {submissions.length === 0 ? (
          <EmptyState
            title="Үр дүн алга"
            description="Шалгалт өгсний дараа үр дүн болон асуултын задлан харах хэсэг энд гарна."
          />
        ) : (
          <View style={styles.cards}>
            {submissions.map((submission) => (
              <StudentExamCard
                key={submission.id}
                subject={submission.subject}
                title={submission.title}
                grade={submission.grade}
                duration={submission.duration}
                questionCount={submission.questionCount}
                scheduledDate={formatScheduledDate(submission.scheduledDate)}
                startTime={formatScheduledTime(submission.startTime)}
                footerLabel="Эхэлсэн цаг"
                subjectOrder={subjectOrder}
                onPress={() => {
                  router.push(`/(student)/results/${submission.id}`);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 24,
    paddingBottom: 18,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
  },
  brandMarkWrap: {
    height: 32,
    width: 43,
    alignItems: "center",
    justifyContent: "center",
  },
  brandImage: {
    width: 43,
    height: 32,
  },
  brandTop: {
    fontFamily: fonts.display.medium,
    fontSize: 19,
    color: colors.textPrimary,
  },
  brandBottom: {
    marginTop: -2,
    fontFamily: fonts.display.medium,
    fontSize: 19,
    color: colors.textPrimary,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 136,
  },
  cards: {
    gap: 16,
  },
});
