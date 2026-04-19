import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack } from "expo-router";

import { PremiumCard } from "@/components/PremiumCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";

export default function ContactScreen() {
  const { contactMessages, createContactMessage, session, user } = useAppState();
  const defaultName = useMemo(() => user?.name ?? session?.user?.email?.split("@")[0] ?? "", [session?.user?.email, user?.name]);
  const defaultEmail = useMemo(() => user?.email ?? session?.user?.email ?? "", [session?.user?.email, user?.email]);
  const [fullName, setFullName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState("Mesaj din aplicație");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMessage("Completează toate câmpurile înainte să trimiți mesajul.");
      return;
    }

    const result = await createContactMessage({
      fullName,
      email,
      subject,
      message,
    });

    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    setMessage("");
    setErrorMessage("");
    Alert.alert("Mesaj trimis", result.message);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Contact", headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }} />
      <PremiumCard>
        <Text style={styles.eyebrow}>Contact</Text>
        <Text style={styles.title}>Trimite un mesaj direct din aplicație</Text>
        <Text style={styles.body}>
          Pentru întrebări, suport sau colaborări, trimite mesajul aici. Mesajul ajunge în consola admin și poate fi urmărit fără live chat.
        </Text>
      </PremiumCard>

      <SectionHeader
        eyebrow="Formular"
        title="Scrie-ne"
        caption="Folosește formularul pentru întrebări legate de abonament, conținut sau cereri personalizate."
      />

      <View style={styles.form}>
        <Text style={styles.label}>Nume complet</Text>
        <TextInput value={fullName} onChangeText={setFullName} style={styles.input} placeholderTextColor="#6F6A5C" />

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholderTextColor="#6F6A5C"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Subiect</Text>
        <TextInput value={subject} onChangeText={setSubject} style={styles.input} placeholderTextColor="#6F6A5C" />

        <Text style={styles.label}>Mesaj</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          style={[styles.input, styles.textarea]}
          multiline
          placeholder="Scrie mesajul tău aici"
          placeholderTextColor="#6F6A5C"
        />

        {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}

        <PrimaryButton label="Trimite mesajul" onPress={() => void handleSubmit()} />
      </View>

      <SectionHeader
        eyebrow="Istoric"
        title="Mesajele tale"
        caption="Aici vezi firul conversației pentru fiecare mesaj trimis. Când adminul răspunde în aplicație, răspunsul apare direct sub mesajul tău."
      />
      <View style={styles.form}>
        {contactMessages.length ? (
          contactMessages.map((item) => (
            <View key={item.id} style={styles.messageRow}>
              <Text style={styles.messageSubject}>{item.subject}</Text>
              <Text style={styles.messageMeta}>
                {item.status === "new" ? "În așteptare" : item.status === "read" ? "Citit de admin" : "Răspuns disponibil"} • {item.email}
              </Text>
              <Text style={styles.messageBody}>{item.message}</Text>
              <View style={styles.replyThread}>
                {item.replies?.length ? (
                  item.replies.map((reply) => (
                    <View key={reply.id} style={styles.replyBubble}>
                      <Text style={styles.replyAuthor}>{reply.senderRole === "admin" ? "Admin" : reply.senderName}</Text>
                      <Text style={styles.messageBody}>{reply.body}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.body}>Nu există încă un răspuns în aplicație pe acest mesaj.</Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.body}>Nu ai trimis încă mesaje din aplicație.</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.gold,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontWeight: "800",
  },
  title: {
    color: colors.textStrong,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
  },
  body: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  form: {
    gap: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgPanel,
    padding: spacing.md,
  },
  label: {
    color: colors.textStrong,
    fontSize: typography.small,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgMuted,
    color: colors.textStrong,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: typography.body,
  },
  textarea: {
    minHeight: 150,
    textAlignVertical: "top",
  },
  errorMessage: {
    color: colors.danger,
    fontSize: typography.small,
    lineHeight: 20,
  },
  messageRow: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgMuted,
    padding: 14,
    gap: 6,
  },
  messageSubject: {
    color: colors.textStrong,
    fontSize: typography.body,
    fontWeight: "800",
  },
  messageMeta: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "700",
  },
  messageBody: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  replyThread: {
    gap: spacing.sm,
  },
  replyBubble: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgSoft,
    padding: 12,
    gap: 4,
  },
  replyAuthor: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
