import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const SelectionGroup = ({ label, options, fieldKey, form, updateForm, colors }: any) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.label, { color: colors.subtext }]}>{label}</Text>
    <View style={styles.selectionRow}>
      {options.map((opt: any) => {
        const isSelected = form[fieldKey] === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[
              styles.selectionBadge,
              {
                backgroundColor: isSelected ? form.color : colors.modalBg,
                borderColor: isSelected ? form.color : colors.border
              }
            ]}
            onPress={() => updateForm(fieldKey, opt)}
          >
            <Text style={{
              color: isSelected ? "#FFF" : colors.text,
              fontWeight: isSelected ? "bold" : "normal"
            }}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, marginBottom: 8, fontWeight: "600", marginLeft: 2 },
  selectionRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  selectionBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 5,
  },
})